package auth

import (
	"PranicServer/database"
	"PranicServer/models"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var db *gorm.DB

// Permission cache to avoid DB lookups on every request
var (
	permissionCache = struct {
		data    map[string][]string  // token -> permissions
		expires map[string]time.Time // token -> expiry time
		mu      sync.RWMutex
	}{
		data:    make(map[string][]string),
		expires: make(map[string]time.Time),
	}
	cacheTTL = time.Hour // Cache permissions for 1 hour
)

// cleanupPermissionCache removes expired entries from the cache
func cleanupPermissionCache() {
	permissionCache.mu.Lock()
	defer permissionCache.mu.Unlock()

	now := time.Now()
	for token, expiry := range permissionCache.expires {
		if now.After(expiry) {
			delete(permissionCache.data, token)
			delete(permissionCache.expires, token)
		}
	}
}

// stopCleanup can be used to stop the cache cleanup goroutine on shutdown
var stopCleanup chan struct{}

func init() {
	// Initialize database connection
	if db == nil {
		db = database.GetConnection()
	}

	// Start periodic cache cleanup every 10 minutes with cancellation support
	stopCleanup = make(chan struct{})
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				cleanupPermissionCache()
			case <-stopCleanup:
				return
			}
		}
	}()
}

// StopCacheCleanup stops the background cache cleanup goroutine
func StopCacheCleanup() {
	close(stopCleanup)
}

// Result   struct
type Result struct {
	Success bool
	Text    string
}

// IsValidAuthentication checks if the token is valid
func IsValidAuthentication(token string) (bool, *models.SuperUser, error) {
	if token == "" {
		return false, nil, errors.New("token is empty")
	}
	user, err := ValidateJWTToken(token)
	if err != nil {
		return false, nil, err
	}
	return true, user, nil
}

// BearerAuth is a middleware that validates a JWT Bearer token.
// It replaces the old per-request Basic Auth to avoid bcrypt DB lookups on every call.
func BearerAuth() fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: expected Bearer token"})
		}

		user, err := ValidateJWTToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: invalid or expired token"})
		}

		// Store validated user in context for downstream handlers
		c.Locals("user", user)
		return c.Next()
	}
}

// BasicAuth and BasicAuthEmptyRealm are kept for the legacy SMS desktop-app route only.
func basicAuthForRealm(callback func(fiber.Ctx, string, string, string) Result, realm string) fiber.Handler {
	var realmHeader string
	if realm != "" {
		realmHeader = "Basic realm=" + strconv.Quote(realm)
	}

	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			if realmHeader != "" {
				c.Set("WWW-Authenticate", realmHeader)
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Basic" {
			if realmHeader != "" {
				c.Set("WWW-Authenticate", realmHeader)
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		payload, _ := base64.StdEncoding.DecodeString(parts[1])
		pair := strings.SplitN(string(payload), ":", 2)

		if len(pair) != 2 {
			if realmHeader != "" {
				c.Set("WWW-Authenticate", realmHeader)
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}
		res := callback(c, realm, pair[0], pair[1])
		if !res.Success {
			if realmHeader != "" {
				c.Set("WWW-Authenticate", realmHeader)
			}
			if res.Text != "" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": res.Text})
			} else {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
			}
		}
		return c.Next()
	}
}

// BasicAuth wraps basicAuthForRealm with an empty realm
func BasicAuth(callback func(fiber.Ctx, string, string, string) Result) fiber.Handler {
	return basicAuthForRealm(callback, "")
}

// BasicAuthEmptyRealm is kept for the legacy SMS desktop-app route only
func BasicAuthEmptyRealm(context fiber.Ctx, realm, userName, passWord string) Result {
	var superUser models.SuperUser
	err := db.Where("user_name = ?", userName).First(&superUser).Error
	if err != nil {
		return Result{Success: false}
	}

	err = bcrypt.CompareHashAndPassword([]byte(superUser.PassWord), []byte(passWord))
	if err != nil {
		log.Debug(err)
		return Result{Success: false}
	}
	return Result{Success: true}
}

// GenerateHashFromPassword generates a "hash" to store in database from user password
func GenerateHashFromPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// getCachedPermissions retrieves cached permissions for a token
func getCachedPermissions(token string) ([]string, bool) {
	permissionCache.mu.RLock()
	defer permissionCache.mu.RUnlock()

	perms, ok := permissionCache.data[token]
	return perms, ok
}

// setCachedPermissions stores permissions in cache
func setCachedPermissions(token string, permissions []string) {
	permissionCache.mu.Lock()
	defer permissionCache.mu.Unlock()

	permissionCache.data[token] = permissions
}

// InvalidateUserPermissionCache removes cached permissions for a specific token
func InvalidateUserPermissionCache(token string) {
	permissionCache.mu.Lock()
	defer permissionCache.mu.Unlock()

	delete(permissionCache.data, token)
	delete(permissionCache.expires, token)
}

// InvalidateAllPermissionCache clears the entire permission cache
// Call this when roles or permissions are modified globally
func InvalidateAllPermissionCache() {
	permissionCache.mu.Lock()
	defer permissionCache.mu.Unlock()

	permissionCache.data = make(map[string][]string)
	permissionCache.expires = make(map[string]time.Time)
}

// extractPermissions extracts permission names from user roles
func extractPermissions(superUser *models.SuperUser) []string {
	var permissions []string
	for _, role := range superUser.Roles {
		if role.Name == "admin" {
			// Admin has all permissions
			return []string{"admin"}
		}
		for _, p := range role.Permissions {
			permissions = append(permissions, p.Name)
		}
	}
	return permissions
}

// checkPermissionCached checks if user has a specific permission using cache
func checkPermissionCached(token string, userID uint32, permission string) (bool, error) {
	// Try to get from cache
	perms, ok := getCachedPermissions(token)

	if !ok {
		// Cache miss - load from DB
		var superUser models.SuperUser
		if err := db.Preload("Roles.Permissions").Where("id = ?", userID).First(&superUser).Error; err != nil {
			return false, err
		}

		// Extract and cache permissions
		perms = extractPermissions(&superUser)
		setCachedPermissions(token, perms)
	}

	// Check if user has the permission
	for _, p := range perms {
		if p == "admin" || p == permission {
			return true, nil
		}
	}

	return false, nil
}

// PermissionMiddleware validates a Bearer JWT token and optionally checks for a specific permission.
// Uses JWT validation with permission caching to minimize DB lookups.
func PermissionMiddleware(permission string) fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		authParts := strings.SplitN(authHeader, " ", 2)
		if len(authParts) != 2 || authParts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: expected Bearer token"})
		}

		token := authParts[1]
		superUser, err := ValidateJWTToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: invalid or expired token"})
		}

		// Store user in context
		c.Locals("user", superUser)

		// Check permission if required (uses cache)
		if permission != "" {
			hasPermission, err := checkPermissionCached(token, superUser.ID, permission)
			if err != nil {
				log.Debug("Error checking permissions:", err)
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
			}

			if !hasPermission {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden: missing permission " + permission})
			}
		}

		return c.Next()
	}
}

// getJWTSecret returns the JWT signing secret from environment variable
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("FATAL: JWT_SECRET environment variable is not set. Server cannot start without a secure JWT secret.")
	}
	return []byte(secret)
}

// CreateJWTToken creates a JWT token for a user
func CreateJWTToken(user *models.SuperUser) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["username"] = user.UserName
	claims["user_id"] = user.ID
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()
	claims["iat"] = time.Now().Unix()

	return token.SignedString(getJWTSecret())
}

// ValidateJWTToken validates a JWT token and ensures the user still exists
func ValidateJWTToken(tokenString string) (*models.SuperUser, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	username, ok := claims["username"].(string)
	if !ok || username == "" {
		return nil, errors.New("invalid token: missing username claim")
	}

	var superUser models.SuperUser
	if err := db.Where("user_name = ?", username).First(&superUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user no longer exists")
		}
		return nil, errors.New("failed to validate user")
	}

	if !superUser.IsActive {
		return nil, errors.New("user account is disabled")
	}

	return &superUser, nil
}

// Authenticate checks username/password and returns JWT + Refresh Token
func Authenticate(c fiber.Ctx) error {
	type LoginRequest struct {
		UserName string `json:"userName"`
		PassWord string `json:"passWord"`
	}

	var req LoginRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid login request body"})
	}

	if req.UserName == "" || req.PassWord == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username and password are required"})
	}

	db := database.GetConnection()
	if db == nil {
		log.Debug("ERROR: Can not access database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Can not access database, please try again later"})
	}

	// First fetch user without preloads to validate password
	var superUser models.SuperUser
	err := db.Where("user_name = ?", req.UserName).First(&superUser).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or password"})
		}
		log.Debug("Error querying super user:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error during authentication"})
	}

	err = bcrypt.CompareHashAndPassword([]byte(superUser.PassWord), []byte(req.PassWord))
	if err != nil {
		log.Debug("Password does not match user password:", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid username or password"})
	}

	// Check if 2FA is enabled and required
	if superUser.TOTPEnabled {
		// Return a short-lived partial auth token instead of exposing userId directly
		partialToken, err := CreatePartial2FAToken(&superUser)
		if err != nil {
			log.Debug("Error creating partial 2FA token:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process 2FA"})
		}
		return c.JSON(fiber.Map{
			"requires2FA":  true,
			"message":      "Two-factor authentication required",
			"partialToken": partialToken,
		})
	}

	// Reload with roles and person
	if err := db.Preload("Roles").Preload("Person").Where("id = ?", superUser.ID).First(&superUser).Error; err != nil {
		log.Debug("Error preloading roles/person for user:", err)
	}

	// Generate Refresh Token
	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		log.Debug("Error creating refresh token:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create refresh token"})
	}

	// Save refresh token to database
	if err := db.Model(&models.SuperUser{}).Where("id = ?", superUser.ID).Update("refresh_token", refreshToken).Error; err != nil {
		log.Debug("Error saving refresh token:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save refresh token"})
	}

	// Strip password hash before sending to client
	superUser.PassWord = ""
	superUser.RefreshToken = refreshToken

	token, err := CreateJWTToken(&superUser)
	if err != nil {
		log.Debug("Error creating JWT token:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create authentication token"})
	}

	return c.JSON(fiber.Map{"token": token, "user": superUser})
}

// GenerateRefreshToken creates a random string for refresh token
func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CreatePartial2FAToken creates a short-lived token for the 2FA verification step.
// This avoids exposing the raw userId to the client.
func CreatePartial2FAToken(user *models.SuperUser) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = user.ID
	claims["purpose"] = "2fa_partial"
	claims["exp"] = time.Now().Add(5 * time.Minute).Unix() // 5 min expiry
	return token.SignedString(getJWTSecret())
}

// ValidatePartial2FAToken validates the partial 2FA token and returns the user ID
func ValidatePartial2FAToken(tokenString string) (uint32, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return getJWTSecret(), nil
	})
	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, errors.New("invalid partial token")
	}

	purpose, ok := claims["purpose"].(string)
	if !ok || purpose != "2fa_partial" {
		return 0, errors.New("invalid token purpose")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, errors.New("invalid user_id claim")
	}

	return uint32(userIDFloat), nil
}

// RefreshToken handles token refresh requests
func RefreshToken(c fiber.Ctx) error {
	type RefreshRequest struct {
		RefreshToken string `json:"refreshToken"`
	}

	var req RefreshRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Refresh token is required"})
	}

	var superUser models.SuperUser
	// Find user by refresh token
	if err := db.Where("refresh_token = ?", req.RefreshToken).First(&superUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid refresh token"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	// Generate new JWT token
	token, err := CreateJWTToken(&superUser)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create token"})
	}

	// Rotate refresh token for extra security
	newRefreshToken, err := GenerateRefreshToken()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to rotate refresh token"})
	}
	if err := db.Model(&superUser).Update("refresh_token", newRefreshToken).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save refresh token"})
	}

	return c.JSON(fiber.Map{"token": token, "refreshToken": newRefreshToken})
}

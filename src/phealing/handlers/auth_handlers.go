package handlers

import (
	"PranicServer/auth"
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/services"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// RequestPasswordReset handles password reset requests
func RequestPasswordReset(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		Email string `json:"email"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	// Find user by email (check if there's a person with this email linked to a user)
	var user models.SuperUser
	var person models.Person

	// First find the person with this email
	if err := db.Where("email = ?", req.Email).First(&person).Error; err != nil {
		// Don't reveal if email exists or not
		return c.JSON(fiber.Map{"message": "If the email exists, a reset link has been sent"})
	}

	// Then find the user linked to this person
	if err := db.Where("person_id = ?", person.ID).First(&user).Error; err != nil {
		// Don't reveal if email exists or not
		return c.JSON(fiber.Map{"message": "If the email exists, a reset link has been sent"})
	}

	// Generate reset token
	token, err := services.GenerateRecoveryToken()
	if err != nil {
		log.Debugf("Failed to generate reset token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process request"})
	}

	// Set token expiry (1 hour)
	expiry := time.Now().Add(1 * time.Hour)

	// Update user with reset token
	if err := db.Model(&user).Updates(map[string]interface{}{
		"password_reset_token":  token,
		"password_reset_expiry": &expiry,
	}).Error; err != nil {
		log.Debugf("Failed to save reset token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process request"})
	}

	// Send reset email
	notifService := services.NewNotificationService(db)
	resetURL := os.Getenv("PASSWORD_RESET_URL")
	if resetURL == "" {
		resetURL = "https://localhost:8080/app/reset-password"
	}

	if err := notifService.SendPasswordResetEmail(req.Email, token, resetURL); err != nil {
		log.Debugf("Failed to send reset email: %v", err)
		// Don't reveal error to user
	}

	return c.JSON(fiber.Map{"message": "If the email exists, a reset link has been sent"})
}

// ResetPassword handles password reset with token
func ResetPassword(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Token == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Token and password are required"})
	}

	// Validate password strength
	if len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password must be at least 8 characters"})
	}

	// Find user by reset token
	var user models.SuperUser
	if err := db.Where("password_reset_token = ?", req.Token).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or expired reset token"})
	}

	// Check if token is expired
	if user.PasswordResetExpiry == nil || time.Now().After(*user.PasswordResetExpiry) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Reset token has expired"})
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Debugf("Failed to hash password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to reset password"})
	}

	// Update password and clear reset token
	if err := db.Model(&user).Updates(map[string]interface{}{
		"pass_word":             string(hashedPassword),
		"password_reset_token":  "",
		"password_reset_expiry": nil,
	}).Error; err != nil {
		log.Debugf("Failed to update password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to reset password"})
	}

	return c.JSON(fiber.Map{"message": "Password has been reset successfully"})
}

// isTOTPEnabled checks if TOTP is enabled via environment variable
func isTOTPEnabled() bool {
	return os.Getenv("TOTP_ENABLED") == "true"
}

// isTOTPAdminOnly checks if TOTP management is restricted to admins
func isTOTPAdminOnly() bool {
	return os.Getenv("TOTP_ADMIN_ONLY") == "true"
}

// hasAdminRole checks if user has admin role
func hasAdminRole(user *models.SuperUser) bool {
	for _, role := range user.Roles {
		if strings.ToLower(role.Name) == "admin" {
			return true
		}
	}
	return false
}

// Setup2FA initiates 2FA setup for a user
func Setup2FA(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Check if TOTP is enabled
	if !isTOTPEnabled() {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Two-factor authentication is not enabled"})
	}

	// Get authenticated user from context
	userFromCtx, ok := c.Locals("user").(*models.SuperUser)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Reload user with roles from database to check admin role
	var user models.SuperUser
	if err := db.Preload("Roles").Where("id = ?", userFromCtx.ID).First(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load user"})
	}

	// Check if admin-only and user is not admin
	// Self-service 2FA setup is always allowed; admin-only restricts managing others' 2FA
	if isTOTPAdminOnly() && !hasAdminRole(&user) {
		log.Debugf("Non-admin user %s setting up their own 2FA (admin-only mode)", user.UserName)
	}

	// Check if 2FA is already enabled
	if user.TOTPEnabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "2FA is already enabled"})
	}

	// Generate TOTP secret
	totpService := services.NewTOTPService("")
	secret, provisioningURI, err := totpService.GenerateSecret(user.UserName)
	if err != nil {
		log.Debugf("Failed to generate TOTP secret: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to setup 2FA"})
	}

	// Generate QR code URL
	qrURL, err := totpService.GenerateQRCode(provisioningURI)
	if err != nil {
		log.Debugf("Failed to generate QR code: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to setup 2FA"})
	}

	// Store secret temporarily (not enabled yet)
	if err := db.Model(&user).Update("totp_secret", secret).Error; err != nil {
		log.Debugf("Failed to save TOTP secret: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to setup 2FA"})
	}

	return c.JSON(fiber.Map{
		"secret":          secret,
		"provisioningURI": provisioningURI,
		"qrCodeUrl":       qrURL,
	})
}

// Verify2FA verifies and enables 2FA
func Verify2FA(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Check if TOTP is enabled
	if !isTOTPEnabled() {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Two-factor authentication is not enabled"})
	}

	type Request struct {
		Code string `json:"code"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get authenticated user from context
	user, ok := c.Locals("user").(*models.SuperUser)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Check if admin-only and user is not admin
	// Self-service 2FA verification is always allowed
	if isTOTPAdminOnly() && !hasAdminRole(user) {
		log.Debugf("Non-admin user verifying their own 2FA (admin-only mode)")
	}

	if user.TOTPSecret == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "2FA setup not initiated"})
	}

	// Validate TOTP code
	totpService := services.NewTOTPService("")
	valid, err := totpService.ValidateCode(user.TOTPSecret, req.Code)
	if err != nil {
		log.Debugf("Failed to validate TOTP code: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify code"})
	}

	if !valid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid verification code"})
	}

	// Enable 2FA
	now := time.Now()
	if err := db.Model(&user).Updates(map[string]interface{}{
		"totp_enabled":     true,
		"totp_verified_at": &now,
	}).Error; err != nil {
		log.Debugf("Failed to enable 2FA: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to enable 2FA"})
	}

	// Generate backup codes
	backupCodes, err := totpService.GenerateBackupCodes(10)
	if err != nil {
		log.Debugf("Failed to generate backup codes: %v", err)
		// Non-fatal, continue
	}

	return c.JSON(fiber.Map{
		"message":     "2FA enabled successfully",
		"backupCodes": backupCodes,
	})
}

// Disable2FA disables 2FA for a user
func Disable2FA(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Check if TOTP is enabled
	if !isTOTPEnabled() {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Two-factor authentication is not enabled"})
	}

	type Request struct {
		Code     string `json:"code"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get authenticated user from context
	user, ok := c.Locals("user").(*models.SuperUser)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Check if admin-only and user is not admin
	// Note: Users should always be able to manage their own 2FA settings
	// This restriction is for managing OTHER users' 2FA, not their own
	if isTOTPAdminOnly() && !hasAdminRole(user) {
		log.Debugf("Non-admin user disabling their own 2FA (admin-only mode)")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PassWord), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid password"})
	}

	// Verify TOTP code
	if user.TOTPEnabled && req.Code != "" {
		totpService := services.NewTOTPService("")
		valid, err := totpService.ValidateCode(user.TOTPSecret, req.Code)
		if err != nil || !valid {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid verification code"})
		}
	}

	// Disable 2FA
	if err := db.Model(&user).Updates(map[string]interface{}{
		"totp_secret":      "",
		"totp_enabled":     false,
		"totp_verified_at": nil,
	}).Error; err != nil {
		log.Debugf("Failed to disable 2FA: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to disable 2FA"})
	}

	return c.JSON(fiber.Map{"message": "2FA disabled successfully"})
}

// UpdateSessionNotes updates the session notes for a schedule
func UpdateSessionNotes(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Verify authenticated user
	user, ok := c.Locals("user").(*models.SuperUser)
	if !ok || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	type Request struct {
		ScheduleID   uint32 `json:"scheduleId"`
		SessionNotes string `json:"sessionNotes"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.ScheduleID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Schedule ID is required"})
	}

	// Verify the user is a healer assigned to this schedule or has admin role
	var schedule models.Schedule
	if err := db.Preload("Healers").Where("id = ?", req.ScheduleID).First(&schedule).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch schedule"})
	}

	// Check authorization: must be admin or assigned healer
	isAuthorized := hasAdminRole(user)
	if !isAuthorized && user.PersonID > 0 {
		for _, healer := range schedule.Healers {
			if healer.PersonID == user.PersonID {
				isAuthorized = true
				break
			}
		}
	}
	if !isAuthorized {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You are not authorized to update notes for this schedule"})
	}

	// Update session notes
	result := db.Model(&models.Schedule{}).Where("id = ?", req.ScheduleID).Update("session_notes", req.SessionNotes)
	if result.Error != nil {
		log.Debugf("Failed to update session notes: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update session notes"})
	}

	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	return c.JSON(fiber.Map{"message": "Session notes updated successfully"})
}

// GetScheduleWithNotes gets a schedule including session notes
func GetScheduleWithNotes(c fiber.Ctx) error {
	db := database.GetDB(c)

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Schedule ID is required"})
	}

	var schedule models.Schedule
	if err := db.Preload("Healers").Preload("Attendees").Preload("Center").First(&schedule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
		}
		log.Debugf("Failed to fetch schedule: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch schedule"})
	}

	return c.JSON(schedule)
}

// SearchDocuments searches documents by extracted text or tags
func SearchDocuments(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		Query    string `json:"query"`
		PersonID uint32 `json:"personId"`
		Tags     string `json:"tags"`
		Page     int    `json:"page"`
		Limit    int    `json:"limit"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}

	query := db.Model(&models.Document{}).Preload("Person")

	// Filter by person
	if req.PersonID > 0 {
		query = query.Where("person_id = ?", req.PersonID)
	}

	// Search in extracted text or filename
	if req.Query != "" {
		searchPattern := "%" + req.Query + "%"
		query = query.Where("extracted_text ILIKE ? OR file_name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// Filter by tags
	if req.Tags != "" {
		tags := strings.Split(req.Tags, ",")
		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				query = query.Where("auto_tags ILIKE ? OR manual_tags ILIKE ?", "%"+tag+"%", "%"+tag+"%")
			}
		}
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	var documents []models.Document
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Order("created_on DESC").Find(&documents).Error; err != nil {
		log.Debugf("Failed to search documents: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to search documents"})
	}

	return c.JSON(fiber.Map{
		"data":  documents,
		"total": total,
		"page":  req.Page,
		"limit": req.Limit,
	})
}

// UpdateDocumentTags updates tags for a document
func UpdateDocumentTags(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		DocumentID uint32 `json:"documentId"`
		ManualTags string `json:"manualTags"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.DocumentID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Document ID is required"})
	}

	// Update document tags
	result := db.Model(&models.Document{}).Where("id = ?", req.DocumentID).Update("manual_tags", req.ManualTags)
	if result.Error != nil {
		log.Debugf("Failed to update document tags: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update document tags"})
	}

	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Document not found"})
	}

	// Update document_tags table for easier querying
	// First, delete existing manual tags
	db.Where("document_id = ? AND is_auto_tag = ?", req.DocumentID, false).Delete(&models.DocumentTag{})

	// Insert new manual tags
	if req.ManualTags != "" {
		tags := strings.Split(req.ManualTags, ",")
		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				docTag := models.DocumentTag{
					DocumentID: req.DocumentID,
					Tag:        tag,
					IsAutoTag:  false,
				}
				db.Create(&docTag)
			}
		}
	}

	return c.JSON(fiber.Map{"message": "Document tags updated successfully"})
}

// TriggerOCR triggers OCR processing for a document
func TriggerOCR(c fiber.Ctx) error {
	db := database.GetDB(c)

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Document ID is required"})
	}

	var document models.Document
	if err := db.First(&document, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Document not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch document"})
	}

	// TODO: Implement actual OCR processing
	// This would typically involve:
	// 1. Reading the file from disk
	// 2. Sending to OCR service (e.g., Tesseract, Google Vision API)
	// 3. Extracting text and auto-generating tags
	// 4. Updating the document record

	// For now, mark as processed
	db.Model(&document).Updates(map[string]interface{}{
		"ocr_processed":  true,
		"extracted_text": "OCR processing not yet implemented. This is a placeholder.",
	})

	return c.JSON(fiber.Map{
		"message":    "OCR processing triggered",
		"documentId": document.ID,
	})
}

// VerifyTOTPForLogin handles the second factor authentication during login
func VerifyTOTPForLogin(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		PartialToken string `json:"partialToken"`
		UserID       uint32 `json:"userId"` // Deprecated: kept for backward compatibility
		Code         string `json:"code"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "TOTP code is required"})
	}

	// Determine user ID: prefer partialToken, fall back to userId for backward compat
	var userID uint32
	if req.PartialToken != "" {
		var err error
		userID, err = auth.ValidatePartial2FAToken(req.PartialToken)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired 2FA session"})
		}
	} else if req.UserID > 0 {
		// Deprecated path: accept raw userId for backward compatibility during transition
		log.Debugf("WARNING: VerifyTOTPForLogin called with deprecated userId field")
		userID = req.UserID
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Partial token or user ID is required"})
	}

	// Find user by ID
	var user models.SuperUser
	if err := db.Preload("Roles").Preload("Person").Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		log.Debugf("Failed to fetch user: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA"})
	}

	// Check if user has 2FA enabled
	if !user.TOTPEnabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Two-factor authentication is not enabled for this user"})
	}

	// Validate TOTP code
	totpService := services.NewTOTPService("")
	valid, err := totpService.ValidateCode(user.TOTPSecret, req.Code)
	if err != nil {
		log.Debugf("Failed to validate TOTP code: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA"})
	}

	if !valid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid verification code"})
	}

	// Generate Refresh Token
	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		log.Debugf("Failed to generate refresh token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA"})
	}

	// Save refresh token to database
	if err := db.Model(&models.SuperUser{}).Where("id = ?", user.ID).Update("refresh_token", refreshToken).Error; err != nil {
		log.Debugf("Failed to save refresh token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA"})
	}

	// Strip password hash before sending to client
	user.PassWord = ""
	user.RefreshToken = refreshToken

	// Generate JWT token
	token, err := auth.CreateJWTToken(&user)
	if err != nil {
		log.Debugf("Failed to create JWT token: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify 2FA"})
	}

	return c.JSON(fiber.Map{
		"token":   token,
		"user":    user,
		"message": "2FA verification successful",
	})
}

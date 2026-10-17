package handlers

import (
	"PranicServer/auth"
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/utilities"
	"fmt"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

// Password validation constants
const (
	minPasswordLength    = 8
	maxPasswordLength    = 60
	passwordSpecialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
)

// validatePassword checks if password meets security requirements
// Returns error message if validation fails, empty string if valid
func validatePassword(password string) string {
	if len(password) < minPasswordLength {
		return fmt.Sprintf("Password must be at least %d characters long", minPasswordLength)
	}
	if len(password) > maxPasswordLength {
		return fmt.Sprintf("Password must not exceed %d characters", maxPasswordLength)
	}

	// Check for at least one uppercase letter
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUpper {
		return "Password must contain at least one uppercase letter"
	}

	// Check for at least one lowercase letter
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasLower {
		return "Password must contain at least one lowercase letter"
	}

	// Check for at least one digit
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasDigit {
		return "Password must contain at least one digit"
	}

	// Check for at least one special character
	hasSpecial := false
	for _, c := range password {
		if strings.ContainsRune(passwordSpecialChars, c) {
			hasSpecial = true
			break
		}
	}
	if !hasSpecial {
		return "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
	}

	return "" // Valid password
}

// GetMe returns current authenticated user profile
func GetMe(c fiber.Ctx) error {
	db := database.GetDB(c)
	user, ok := c.Locals("user").(*models.SuperUser)
	if !ok || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var superUser models.SuperUser
	db.Preload("Roles.Permissions").Preload("Person").Where("id = ?", user.ID).First(&superUser)

	// Check if this person is also a healer
	var healer models.Healer
	healerID := uint32(0)
	if superUser.PersonID > 0 {
		if err := db.Where("person_id = ?", superUser.PersonID).First(&healer).Error; err == nil {
			healerID = healer.ID
		}
	}

	superUser.FirstName = superUser.Person.FirstName
	superUser.LastName = superUser.Person.LastName
	superUser.RoleIDs = make([]uint32, len(superUser.Roles))
	for i, r := range superUser.Roles {
		superUser.RoleIDs[i] = r.ID
	}
	if len(superUser.Roles) > 0 {
		superUser.Role = superUser.Roles[0]
	}

	return c.JSON(fiber.Map{
		"user":     superUser,
		"healerID": healerID,
	})
}

// DeleteUser ....
func DeleteUser(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not acess database, please try again later",
		})
	}
	id := c.Params("id")
	var user models.SuperUser

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Where("id = ?", id).First(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// Delete associations first
	if err := tx.Model(&user).Association("Roles").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tx.Where("id = ?", id).Delete(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(tx, authUser, "Delete", "User", user.ID, fmt.Sprintf("Deleted user: %s", user.UserName))

	tx.Commit()
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"id #": id, "status": "deleted"})
}

// UpdateUser ....
func UpdateUser(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}
	var user models.SuperUser
	id := c.Params("id")

	if err := db.Where("id = ?", id).First(&user).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User not found"})
	}

	var updateData models.SuperUser
	if err := c.Bind().Body(&updateData); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unable to bind incoming user information: " + err.Error(),
		})
	}

	// Build a selective update map — never touch person_id unless explicitly provided,
	// to avoid violating the FK constraint when the frontend omits it.
	updateMap := map[string]interface{}{
		"user_name": updateData.UserName,
	}

	if updateData.PersonID > 0 {
		updateMap["person_id"] = updateData.PersonID
		user.PersonID = updateData.PersonID
	}

	if updateData.PassWord != "" {
		// Validate password strength for new password
		if validationErr := validatePassword(updateData.PassWord); validationErr != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": validationErr})
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(updateData.PassWord), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
		}
		updateMap["pass_word"] = string(hash)
		user.PassWord = string(hash)
	}

	// Use selective column update instead of Save (which writes ALL fields including person_id=0)
	if err := db.Model(&user).Updates(updateMap).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Re-read the current person_id from DB in case it wasn't in the update
	if user.PersonID == 0 {
		db.Select("person_id").Where("id = ?", user.ID).First(&user)
	}

	// Update Roles
	var updatedRoles []models.Role
	rolesChanged := false
	if len(updateData.RoleIDs) > 0 {
		db.Where("id IN (?)", updateData.RoleIDs).Find(&updatedRoles)
		db.Model(&user).Association("Roles").Replace(updatedRoles)
		rolesChanged = true
	} else if len(updateData.Roles) > 0 {
		updatedRoles = updateData.Roles
		db.Model(&user).Association("Roles").Replace(updatedRoles)
		rolesChanged = true
	}

	// Invalidate permission cache if roles changed
	if rolesChanged {
		auth.InvalidateAllPermissionCache()
	}

	// If the healer role was assigned, ensure a Healer record exists for this person
	if user.PersonID > 0 {
		isHealer := false
		for _, r := range updatedRoles {
			if strings.ToLower(r.Name) == "healer" {
				isHealer = true
				break
			}
		}
		if isHealer {
			var existingHealer models.Healer
			if db.Where("person_id = ?", user.PersonID).First(&existingHealer).Error != nil {
				healer := models.Healer{
					PersonID: user.PersonID,
					Level:    1,
				}
				if err := db.Create(&healer).Error; err != nil {
					log.Debug("dashboard: failed to create healer record:", err)
				}
			}
		}
	}

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Update", "User", user.ID, fmt.Sprintf("Updated user: %s", user.UserName))

	user.PassWord = ""
	return c.JSON(user)
}

// CreateUser ....
func CreateUser(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not acess database, please try again later",
		})
	}

	var user models.SuperUser
	if err := c.Bind().Body(&user); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ERROR: parsing user data:" + err.Error(),
		})
	}

	// Ensure ID is 0 for auto-increment if it's a new user
	user.ID = 0

	// Validate password strength
	if user.PassWord == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password is required"})
	}
	if validationErr := validatePassword(user.PassWord); validationErr != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": validationErr})
	}

	// If no PersonID is provided, create a Person record first
	if user.PersonID == 0 {
		newPerson := models.Person{
			FirstName: user.FirstName,
			LastName:  user.LastName,
			IsStaff:   true,
			IsActive:  true,
		}
		if err := db.Create(&newPerson).Error; err != nil {
			log.Debug("Error creating person for user:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create associated Person record: " + err.Error(),
			})
		}
		user.PersonID = newPerson.ID
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(user.PassWord), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}
	user.PassWord = string(hash)

	if creationError := db.Create(&user).Error; creationError != nil {
		log.Debug(creationError)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: storing user data in Database:" + creationError.Error(),
		})
	}

	// Update Roles based on RoleIDs if provided
	if len(user.RoleIDs) > 0 {
		var roles []models.Role
		db.Where("id IN (?)", user.RoleIDs).Find(&roles)
		if len(roles) > 0 {
			db.Model(&user).Association("Roles").Append(roles)

			// If any role is 'healer', automatically create a Healer record
			isHealer := false
			for _, r := range roles {
				if strings.ToLower(r.Name) == "healer" {
					isHealer = true
					break
				}
			}
			if isHealer {
				var existingHealer models.Healer
				if db.Where("person_id = ?", user.PersonID).First(&existingHealer).Error != nil {
					healer := models.Healer{
						PersonID: user.PersonID,
						Level:    1,
					}
					db.Create(&healer)
				}
			}
		}
	}

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Create", "User", user.ID, fmt.Sprintf("Created user: %s", user.UserName))

	user.PassWord = ""
	return c.Status(fiber.StatusCreated).JSON(user)
}

// GetUser ... get user by ID
func GetUser(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		log.Debug("ERROR: Can not acess database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not acess database, please try again later",
		})
	}
	id := c.Params("id")
	var user models.SuperUser
	if err := db.Preload("Roles").Preload("Person").Where("id = ?", id).First(&user).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user.FirstName = user.Person.FirstName
	user.LastName = user.Person.LastName
	user.RoleIDs = make([]uint32, len(user.Roles))
	for i, r := range user.Roles {
		user.RoleIDs[i] = r.ID
	}
	if len(user.Roles) > 0 {
		user.Role = user.Roles[0]
	}
	return c.Status(fiber.StatusOK).JSON(user)
}

// GetUsers collects all users
func GetUsers(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not acess database, please try again later",
		})
	}
	var users []models.SuperUser
	if err := db.Preload("Roles").Preload("Person").Find(&users).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	for i := range users {
		users[i].FirstName = users[i].Person.FirstName
		users[i].LastName = users[i].Person.LastName
		users[i].RoleIDs = make([]uint32, len(users[i].Roles))
		for j, r := range users[i].Roles {
			users[i].RoleIDs[j] = r.ID
		}
		if len(users[i].Roles) > 0 {
			users[i].Role = users[i].Roles[0]
		}
	}
	return c.Status(fiber.StatusOK).JSON(users)
}

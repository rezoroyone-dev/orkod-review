package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/services"
	"errors"
	"os"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// PatientRegister handles patient registration for the self-service portal
func PatientRegister(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Phone    string `json:"phone"`
		// Optional: link to existing person record
		PersonID  uint32 `json:"personId"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	if len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password must be at least 8 characters"})
	}

	// Check if patient already exists
	var existingPatient models.Patient
	if err := db.Where("email = ?", req.Email).First(&existingPatient).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "An account with this email already exists"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Debugf("Failed to hash password: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create account"})
	}

	// Start transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var personID uint32

	// If person ID provided, verify it exists
	if req.PersonID > 0 {
		var person models.Person
		if err := tx.First(&person, req.PersonID).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Person not found"})
		}
		personID = req.PersonID
	} else if req.FirstName != "" && req.LastName != "" {
		// Create new person record
		person := models.Person{
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Phone:     req.Phone,
			Email:     req.Email,
			IsActive:  true,
			IsStaff:   false,
		}
		if err := tx.Create(&person).Error; err != nil {
			tx.Rollback()
			log.Debugf("Failed to create person: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create account"})
		}
		personID = person.ID
	} else {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Either personId or firstName/lastName is required"})
	}

	// Generate verification token
	verificationToken, err := services.GenerateRecoveryToken()
	if err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create account"})
	}

	// Create patient account
	patient := models.Patient{
		PersonID:          personID,
		Email:             req.Email,
		PasswordHash:      string(hashedPassword),
		IsActive:          true,
		EmailVerified:     false,
		VerificationToken: verificationToken,
	}

	if err := tx.Create(&patient).Error; err != nil {
		tx.Rollback()
		log.Debugf("Failed to create patient: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create account"})
	}

	tx.Commit()

	// TODO: Send verification email

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":   "Account created successfully. Please check your email to verify your account.",
		"patientId": patient.ID,
	})
}

// PatientLogin handles patient login for the self-service portal
func PatientLogin(c fiber.Ctx) error {
	db := database.GetDB(c)

	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	// Find patient
	var patient models.Patient
	if err := db.Preload("Person").Where("email = ?", req.Email).First(&patient).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	// Check if active
	if !patient.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Account is disabled"})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(patient.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid email or password"})
	}

	// Generate JWT token
	token, err := createPatientJWT(&patient)
	if err != nil {
		log.Debugf("Failed to create JWT: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to login"})
	}

	// Update last login
	now := time.Now()
	db.Model(&patient).Update("last_login_at", &now)

	return c.JSON(fiber.Map{
		"token": token,
		"patient": fiber.Map{
			"id":       patient.ID,
			"email":    patient.Email,
			"personId": patient.PersonID,
			"person":   patient.Person,
		},
	})
}

// GetPatientAppointments gets appointments for the logged-in patient
func GetPatientAppointments(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Get patient from context
	patient, ok := c.Locals("patient").(*models.Patient)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Get upcoming and past appointments
	now := time.Now()

	var upcoming []models.Schedule
	db.Preload("Healers").Preload("Center").
		Joins("JOIN persons_schedules ON persons_schedules.schedule_id = schedules.id").
		Where("persons_schedules.person_id = ? AND schedules.start_date > ?", patient.PersonID, now).
		Order("start_date ASC").
		Find(&upcoming)

	var past []models.Schedule
	db.Preload("Healers").Preload("Center").
		Joins("JOIN persons_schedules ON persons_schedules.schedule_id = schedules.id").
		Where("persons_schedules.person_id = ? AND schedules.start_date <= ?", patient.PersonID, now).
		Order("start_date DESC").
		Limit(20).
		Find(&past)

	return c.JSON(fiber.Map{
		"upcoming": upcoming,
		"past":     past,
	})
}

// GetPatientTreatments gets treatment history for the logged-in patient
func GetPatientTreatments(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Get patient from context
	patient, ok := c.Locals("patient").(*models.Patient)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var treatments []models.Treatment
	db.Preload("Healer").Preload("SicknessNatures").
		Where("person_id = ?", patient.PersonID).
		Order("start_date DESC").
		Find(&treatments)

	return c.JSON(treatments)
}

// CancelPatientAppointment allows a patient to cancel their appointment
func CancelPatientAppointment(c fiber.Ctx) error {
	db := database.GetDB(c)

	// Get patient from context
	patient, ok := c.Locals("patient").(*models.Patient)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	scheduleID := c.Params("id")
	if scheduleID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Schedule ID is required"})
	}

	// Verify the schedule belongs to this patient
	var schedule models.Schedule
	if err := db.Joins("JOIN persons_schedules ON persons_schedules.schedule_id = schedules.id").
		Where("schedules.id = ? AND persons_schedules.person_id = ?", scheduleID, patient.PersonID).
		First(&schedule).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Appointment not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch appointment"})
	}

	// Check if appointment is in the future
	if schedule.StartDate.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot cancel past appointments"})
	}

	// Check if appointment is within 24 hours (cancellation policy)
	if schedule.StartDate.Sub(time.Now()) < 24*time.Hour {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot cancel appointments within 24 hours. Please contact the center."})
	}

	// Delete the schedule
	if err := db.Delete(&schedule).Error; err != nil {
		log.Debugf("Failed to cancel appointment: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cancel appointment"})
	}

	// TODO: Send cancellation notification

	return c.JSON(fiber.Map{"message": "Appointment cancelled successfully"})
}

// PatientAuthMiddleware validates patient JWT tokens
func PatientAuthMiddleware() fiber.Handler {
	return func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}

		// Extract token
		parts := []byte(authHeader)
		if len(parts) < 7 || string(parts[:7]) != "Bearer " {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid authorization header"})
		}
		tokenString := authHeader[7:]

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token claims"})
		}
		patientIDRaw, ok := claims["patient_id"].(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token: missing patient_id"})
		}
		patientID := uint32(patientIDRaw)

		// Load patient
		db := database.GetDB(c)
		var patient models.Patient
		if err := db.Preload("Person").First(&patient, patientID).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Patient not found"})
		}

		if !patient.IsActive {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Account is disabled"})
		}

		c.Locals("patient", &patient)
		return c.Next()
	}
}

// createPatientJWT creates a JWT token for a patient
func createPatientJWT(patient *models.Patient) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["patient_id"] = patient.ID
	claims["email"] = patient.Email
	claims["exp"] = time.Now().Add(time.Hour * 24 * 7).Unix() // 7 days for patients

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT_SECRET not set")
	}

	return token.SignedString([]byte(secret))
}

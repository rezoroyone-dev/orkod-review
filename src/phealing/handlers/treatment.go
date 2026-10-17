package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"strconv"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// CreateTreatment ....
func CreateTreatment(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var treatment models.Treatment

	if err := c.Bind().Body(&treatment); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing Treatment: " + err.Error()})
	}

	// Input validation
	if treatment.PersonID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "person_id is required"})
	}
	if treatment.StartDate.IsZero() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "start_date is required"})
	}

	// Save the healers from the request before creating treatment
	// We need to find existing healers by PersonID to avoid creating duplicates
	requestHealers := treatment.Healers
	treatment.Healers = nil

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if creationError := tx.Create(&treatment).Error; creationError != nil {
		tx.Rollback()
		log.Debug(creationError)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing a Treatment in Database: " + creationError.Error()})
	}

	// Find existing healers by PersonID and create the association
	if len(requestHealers) > 0 {
		var healers []models.Healer
		seenHealerIDs := make(map[uint32]bool)
		for _, h := range requestHealers {
			// Skip duplicates in the request
			if seenHealerIDs[h.PersonID] {
				continue
			}
			seenHealerIDs[h.PersonID] = true

			var healer models.Healer
			// Try to find existing healer by PersonID
			if err := tx.Where("person_id = ?", h.PersonID).First(&healer).Error; err != nil {
				// Healer doesn't exist, skip or log - shouldn't happen if data is valid
				log.Debugf("Warning: Healer with PersonID %d not found, skipping", h.PersonID)
				continue
			}
			healers = append(healers, healer)
		}

		if len(healers) > 0 {
			if err := tx.Model(&treatment).Association("Healers").Append(healers); err != nil {
				tx.Rollback()
				log.Debug("Error appending healers:", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error associating healers: " + err.Error()})
			}
		}
	}

	tx.Commit()

	// Reload treatment with healers and their person data
	if err := db.Preload("Healers.Person").Where("id = ?", treatment.ID).First(&treatment).Error; err != nil {
		log.Debug("Error preloading healers:", err)
		// Continue anyway - at least the treatment was created
	}

	processTreatmentForResponse(&treatment)

	return c.JSON(treatment)
}

// GetTreatments for a specific user id
func GetTreatments(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	personID := c.Params("id")
	status := c.Params("status")
	var treatments []models.Treatment

	// First get unique treatment IDs, then preload with distinct healers
	if err := db.Preload("Healers", func(db *gorm.DB) *gorm.DB {
		return db.Distinct("healers.*")
	}).Preload("Healers.Person").Where("person_id = ? AND UPPER(status) = UPPER(?)", personID, status).Find(&treatments).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		// Deduplicate healers in each treatment
		for i := range treatments {
			processTreatmentForResponse(&treatments[i])
		}
		return c.JSON(treatments)
	}
}

// GetTreatment .....
func GetTreatment(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	if len(strID) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id value is empty"})
	}
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing id: " + err.Error()})
	}

	var treatment models.Treatment
	if err := db.Preload("Healers.Person").Where("id = ?", id).First(&treatment).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	processTreatmentForResponse(&treatment)

	return c.JSON(treatment)
}

// DeleteTreatment delets a Treatment given its id
func DeleteTreatment(c fiber.Ctx) error {
	var strID = c.Params("id")
	if len(strID) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id value is empty"})
	}

	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing string id value to uint32" + err.Error()})
	}

	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var treatment models.Treatment
	if err := tx.Where("id = ?", id).First(&treatment).Error; err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tx.Model(&treatment).Association("Healers").Clear(); err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tx.Delete(&treatment).Error; err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	tx.Commit()
	return c.JSON(id)

}

// UpdateTreatment ... updates a Treatment
func UpdateTreatment(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var treatment models.Treatment

	if err := c.Bind().Body(&treatment); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing Treatment: " + err.Error()})
	}

	tx := db.Begin()
	var dbTreatment models.Treatment
	if err := tx.Preload("Healers.Person").Where("id = ?", treatment.ID).First(&dbTreatment).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Treatment not found"})
	}

	// Find existing healers by PersonID to avoid creating duplicates
	// Also deduplicate the incoming healers
	var newHealers []models.Healer
	seenHealerIDs := make(map[uint32]bool)
	for _, h := range treatment.Healers {
		// Skip duplicates in the request
		if seenHealerIDs[h.PersonID] {
			continue
		}
		seenHealerIDs[h.PersonID] = true

		var healer models.Healer
		if err := tx.Where("person_id = ?", h.PersonID).First(&healer).Error; err != nil {
			log.Debugf("Warning: Healer with PersonID %d not found, skipping", h.PersonID)
			continue
		}
		newHealers = append(newHealers, healer)
	}

	// Use GORM to replace associations safely
	if err := tx.Model(&treatment).Association("Healers").Replace(newHealers); err != nil {
		tx.Rollback()
		log.Debug("Error updating healers for Treatment: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating healers for Treatment: " + err.Error()})
	}

	// Clear healers from the struct so Save doesn't try to update associations again
	treatment.Healers = nil

	if err := tx.Save(&treatment).Error; err != nil {
		tx.Rollback()
		log.Debug("Error updating a Treatment in Database: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating a Treatment in Database: " + err.Error()})
	}
	tx.Commit()

	// Reload treatment with healers and their person data for the response
	// Use Distinct to avoid duplicate healers from the join table
	if err := db.Preload("Healers", func(db *gorm.DB) *gorm.DB {
		return db.Distinct("healers.*")
	}).Preload("Healers.Person").Where("id = ?", treatment.ID).First(&treatment).Error; err != nil {
		log.Debug("Error preloading healers after update:", err)
	}

	processTreatmentForResponse(&treatment)

	return c.JSON(treatment)
}

// Helper function to deduplicate healers by ID
func deduplicateHealers(healers []models.Healer) []models.Healer {
	seen := make(map[uint32]bool)
	uniqueHealers := make([]models.Healer, 0, len(healers))
	for _, h := range healers {
		if !seen[h.ID] {
			seen[h.ID] = true
			uniqueHealers = append(uniqueHealers, h)
		}
	}
	return uniqueHealers
}

// Helper function to process treatment for response (deduplicate and populate names)
func processTreatmentForResponse(treatment *models.Treatment) {
	treatment.Healers = deduplicateHealers(treatment.Healers)
	for i := range treatment.Healers {
		if treatment.Healers[i].Person.ID != 0 {
			treatment.Healers[i].FirstName = treatment.Healers[i].Person.FirstName
			treatment.Healers[i].LastName = treatment.Healers[i].Person.LastName
		}
	}
}

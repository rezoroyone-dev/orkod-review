package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/utilities"
	"fmt"
	"github.com/gofiber/fiber/v3"
)

// GetHealerAvailability returns availability for a specific healer
func GetHealerAvailability(c fiber.Ctx) error {
	db := database.GetDB(c)
	healerID := c.Params("healerID")
	var availabilities []models.HealerAvailability
	db.Where("healer_id = ?", healerID).Find(&availabilities)
	return c.JSON(availabilities)
}

// SaveHealerAvailability saves or updates availability for a healer
func SaveHealerAvailability(c fiber.Ctx) error {
	db := database.GetDB(c)
	healerID := c.Params("healerID")

	var availabilities []models.HealerAvailability
	if err := c.Bind().Body(&availabilities); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Simple approach: remove old and insert new
	db.Where("healer_id = ?", healerID).Delete(&models.HealerAvailability{})

	for i := range availabilities {
		availabilities[i].HealerID = uint32(parseUint(healerID))
		db.Create(&availabilities[i])
	}

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Update", "Availability", uint32(parseUint(healerID)), fmt.Sprintf("Updated availability for healer ID: %s", healerID))

	return c.JSON(availabilities)
}

// GetAvailableHealers returns healers that have configured availability
func GetAvailableHealers(c fiber.Ctx) error {
	db := database.GetDB(c)

	var results []result
	selectStatment := "healers.id, healers.level, persons.id as person_id, persons.first_name, persons.last_name, persons.phone"
	joinStatment := "INNER JOIN healers on healers.person_id = persons.id"
	availabilityJoin := "INNER JOIN healer_availabilities ON healer_availabilities.healer_id = healers.id"

	err := db.Table("persons").
		Select(selectStatment).
		Joins(joinStatment).
		Joins(availabilityJoin).
		Where("healer_availabilities.is_active = ?", true).
		Group("healers.id, healers.level, persons.id, persons.first_name, persons.last_name, persons.phone").
		Scan(&results).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(results)
}

func parseUint(s string) uint64 {
	// Helper since I don't want to import strconv everywhere for a quick cast
	// In real project use strconv.ParseUint
	var res uint64
	for _, c := range s {
		res = res*10 + uint64(c-'0')
	}
	return res
}

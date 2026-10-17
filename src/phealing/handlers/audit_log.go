package handlers

import (
	"PranicServer/database"
	"PranicServer/models"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// GetAuditLogs returns audit logs for the admin with pagination via ?page=1&limit=100
func GetAuditLogs(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	page := fiber.Query[int](c, "page", 1)
	limit := fiber.Query[int](c, "limit", 100)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 100
	}
	offset := (page - 1) * limit

	var total int64
	db.Model(&models.AuditLog{}).Count(&total)

	var logs []models.AuditLog
	if err := db.Order("created_at desc").Limit(limit).Offset(offset).Find(&logs).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: fetching audit logs: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// DeleteAuditLog deletes an audit log entry
func DeleteAuditLog(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	id := c.Params("id")
	if err := db.Where("id = ?", id).Delete(&models.AuditLog{}).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: deleting audit log: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{"status": "deleted", "id": id})
}

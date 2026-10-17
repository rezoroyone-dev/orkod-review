package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/utilities"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// GetPublicConfig exposes a small set of non-sensitive public settings that the
// booking pages need (currently the optional session price). 0 means "no price
// shown".
func GetPublicConfig(c fiber.Ctx) error {
	db := database.GetDB(c)
	return c.JSON(fiber.Map{
		"sessionPrice": sessionPriceValue(db),
	})
}

// sessionPriceValue reads the session_price setting as a float (0 when absent).
func sessionPriceValue(db *gorm.DB) float64 {
	var setting models.Setting
	if err := db.Where("key = ?", models.SettingSessionPrice).First(&setting).Error; err != nil {
		return 0
	}
	price, err := strconv.ParseFloat(setting.Value, 64)
	if err != nil || price < 0 {
		return 0
	}
	return price
}

// setSessionPriceRequest carries the new session price.
type setSessionPriceRequest struct {
	Price float64 `json:"price"`
}

// SetSessionPrice updates the session price shown on the public booking screen.
func SetSessionPrice(c fiber.Ctx) error {
	db := database.GetDB(c)
	var req setSessionPriceRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing request: " + err.Error()})
	}
	if req.Price < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Session_price_invalid"})
	}
	value := strconv.FormatFloat(req.Price, 'f', 2, 64)

	var setting models.Setting
	if err := db.Where("key = ?", models.SettingSessionPrice).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			setting = models.Setting{Key: models.SettingSessionPrice, Value: value}
			if err := db.Create(&setting).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
			auditLogSettingValue(c, models.SettingSessionPrice, value)
			return c.JSON(fiber.Map{"sessionPrice": req.Price})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.Model(&setting).Update("value", value).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	auditLogSettingValue(c, models.SettingSessionPrice, value)
	return c.JSON(fiber.Map{"sessionPrice": req.Price})
}

// auditLogSettingValue records a settings change in the audit log.
func auditLogSettingValue(c fiber.Ctx, key, value string) {
	authUser, ok := c.Locals("user").(*models.SuperUser)
	if !ok || authUser == nil {
		return
	}
	db := database.GetDB(c)
	utilities.RecordAudit(db, authUser, "Update", "Settings", 0, key+" = "+value)
}
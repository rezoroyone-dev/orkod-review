package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/utilities"
	"strings"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// donationsEnabled reads the global show/hide switch for the public feed.
func donationsEnabled(db *gorm.DB) bool {
	var setting models.Setting
	err := db.Where("key = ?", models.SettingDonationsVisible).First(&setting).Error
	if err != nil {
		return false
	}
	return setting.Value == "true"
}

// ListPublicDonations returns donations the donor opted into AND the admin
// approved, and only when the donations feed is publicly visible.
func ListPublicDonations(c fiber.Ctx) error {
	db := database.GetDB(c)
	enabled := donationsEnabled(db)
	var donations []models.Donation
	if enabled {
		if err := db.Where("is_approved = ? AND is_public = ?", true, true).
			Order("created_at DESC").
			Limit(200).
			Find(&donations).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}
	return c.JSON(fiber.Map{"enabled": enabled, "donations": donations})
}

// createDonationRequest is the public donation submission payload.
type createDonationRequest struct {
	Name     string  `json:"name"`
	Amount   float64 `json:"amount"`
	Message  string  `json:"message"`
	IsPublic bool    `json:"isPublic"`
}

// CreateDonation records a donation. It stays hidden until the donor opted in
// AND an admin approves it; nothing is published to the public feed implicitly.
func CreateDonation(c fiber.Ctx) error {
	db := database.GetDB(c)
	var req createDonationRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing request: " + err.Error()})
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Message = strings.TrimSpace(req.Message)
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Donation_name_required"})
	}
	if req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Donation_amount_required"})
	}
	if len(req.Message) > 500 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Donation_message_too_long"})
	}

	donation := models.Donation{
		Name:     req.Name,
		Amount:   req.Amount,
		Message:  req.Message,
		IsPublic: req.IsPublic,
	}
	if err := db.Create(&donation).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing donation: " + err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(donation)
}

// AdminListDonations lists every donation for the admin dashboard.
func AdminListDonations(c fiber.Ctx) error {
	db := database.GetDB(c)
	var donations []models.Donation
	if err := db.Order("created_at DESC").Limit(500).Find(&donations).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"enabled": donationsEnabled(db), "donations": donations})
}

// AdminApproveDonation publishes a donation to the public feed.
func AdminApproveDonation(c fiber.Ctx) error {
	db := database.GetDB(c)
	id := parseUint(c.Params("id"))
	if id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid donation id"})
	}
	if err := db.Model(&models.Donation{}).Where("id = ?", id).Update("is_approved", true).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Donation not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"id": id, "approved": true})
}

// AdminDeleteDonation removes a donation from the feed.
func AdminDeleteDonation(c fiber.Ctx) error {
	db := database.GetDB(c)
	id := parseUint(c.Params("id"))
	if id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid donation id"})
	}
	if err := db.Where("id = ?", id).Delete(&models.Donation{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"id": id, "deleted": true})
}

// setDonationsVisibleRequest carries the public-feed switch.
type setDonationsVisibleRequest struct {
	Visible bool `json:"visible"`
}

// SetDonationsVisible toggles whether donations are shown to every visitor.
func SetDonationsVisible(c fiber.Ctx) error {
	db := database.GetDB(c)
	var req setDonationsVisibleRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing request: " + err.Error()})
	}
	value := "false"
	if req.Visible {
		value = "true"
	}
	var setting models.Setting
	if err := db.Where("key = ?", models.SettingDonationsVisible).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			setting = models.Setting{Key: models.SettingDonationsVisible, Value: value}
			if err := db.Create(&setting).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
			auditLogSettingChange(c, value)
			return c.JSON(fiber.Map{"visible": req.Visible})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.Model(&setting).Update("value", value).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	auditLogSettingChange(c, value)
	return c.JSON(fiber.Map{"visible": req.Visible})
}

// auditLogSettingChange records the donations-visibility switch in the audit log.
func auditLogSettingChange(c fiber.Ctx, value string) {
	authUser, ok := c.Locals("user").(*models.SuperUser)
	if !ok || authUser == nil {
		return
	}
	db := database.GetDB(c)
	utilities.RecordAudit(db, authUser, "Update", "Settings", 0, "donations_visible = "+value)
}
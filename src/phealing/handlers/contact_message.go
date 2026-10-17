package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// SaveContactMessage handles the public submission of a contact form
func SaveContactMessage(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	var message models.ContactMessage
	if err := c.Bind().Body(&message); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ERROR: parsing message data: " + err.Error(),
		})
	}

	message.CreatedAt = time.Now()
	message.Read = false

	if err := db.Create(&message).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: storing message in database: " + err.Error(),
		})
	}

	return c.JSON(message)
}

// GetContactMessages returns all contact messages for the admin
func GetContactMessages(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	var messages []models.ContactMessage
	if err := db.Order("created_at desc").Find(&messages).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: fetching messages: " + err.Error(),
		})
	}

	return c.JSON(messages)
}

// DeleteContactMessage deletes a contact message
func DeleteContactMessage(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	id := c.Params("id")
	if err := db.Where("id = ?", id).Delete(&models.ContactMessage{}).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: deleting message: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{"status": "deleted", "id": id})
}

// MarkContactMessageAsRead marks a message as read
func MarkContactMessageAsRead(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	id := c.Params("id")
	if err := db.Model(&models.ContactMessage{}).Where("id = ?", id).Update("read", true).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: updating message status: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{"status": "updated", "id": id})
}

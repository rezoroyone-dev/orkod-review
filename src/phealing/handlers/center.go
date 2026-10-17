package handlers

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/models"
	"PranicServer/utilities"
	"mime/multipart"
	"strconv"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// DeleteCenter ....
func DeleteCenter(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	id := c.Params("id")
	var center models.Center
	err := db.Where("id = ?", id).First(&center).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	err = db.Unscoped().Delete(center).Error
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "SQL error,Failed to delete healer as it has other related entries in other tables"})
	}
	return c.JSON(fiber.Map{"id #" + id: "deleted"})
}

// SaveCenter ....
func SaveCenter(c fiber.Ctx) error {
	log.Debug("[DEBUG] SaveCenter called")
	var err error
	db := database.GetDB(c)
	if db == nil {
		log.Debug("[ERROR] SaveCenter: database is nil")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	var centerID uint32
	var name, city, managerName, phone, email, address, photo string
	var serverFullFileName string = ""
	var photoFile *multipart.FileHeader
	var formHasFile bool = false

	// Try multipart first
	log.Debug("[DEBUG] SaveCenter: attempting to parse multipart form")
	form, err := c.MultipartForm()
	if err == nil {
		log.Debug("[DEBUG] SaveCenter: multipart form parsed successfully")
		id := c.FormValue("id")
		if id == "" {
			id = "-1"
		}
		idNum, _ := strconv.ParseUint(id, 10, 32)
		centerID = uint32(idNum)
		name = c.FormValue("name")
		city = c.FormValue("city")
		managerName = c.FormValue("managerName")
		phone = c.FormValue("phone")
		email = c.FormValue("email")
		address = c.FormValue("address")
		photo = c.FormValue("photo")

		files := form.File["files"]
		if len(files) > 0 {
			formHasFile = true
			photoFile = files[0]
			parentDir := config.GetDataRoot() + utilities.GetPathSeparator() + "public/images"

			if photoFile.Filename == "" {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid image file name"})
			}

			serverFullFileName, err = utilities.GenerateNextUniqueFileName(parentDir, c)
			if err != nil {
				logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Unable to generate unique file name "+parentDir)
				return nil
			}
		}
	} else {
		// Fallback to JSON if not multipart
		var jsonCenter models.Center
		if err := c.Bind().Body(&jsonCenter); err == nil {
			name = jsonCenter.Name
			city = jsonCenter.City
			managerName = jsonCenter.ManagerName
			phone = jsonCenter.Phone
			email = jsonCenter.Email
			address = jsonCenter.Address
			photo = jsonCenter.Photo
			centerID = jsonCenter.ID
		}
	}

	// using transaction to make sure database info and file system photo storage are all ok
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error occurred while saving center information, transaction rolled back"})
		}
	}()

	if err := tx.Error; err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error starting database transaction for storing Center information")
		return nil
	}

	var center models.Center

	if centerID > 0 {
		// Update existing center
		center = models.Center{ID: centerID, Name: name, City: city, ManagerName: managerName, Phone: phone, Email: email, Address: address, Photo: serverFullFileName}
		if serverFullFileName == "" {
			center.Photo = photo
			if err := tx.Model(&center).Omit("id", "photo").Updates(map[string]interface{}{"name": name, "city": city, "manager_name": managerName, "phone": phone, "email": email, "address": address}).Error; err != nil {
				tx.Rollback()
				logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to store Center information in Database")
				return nil
			}
		} else {
			if err := tx.Save(&center).Error; err != nil {
				tx.Rollback()
				logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to store Center information in Database")
				return nil
			}
		}
	} else {
		// Create new center - check if name already exists first
		var existingCenter models.Center
		if err := tx.Where("name = ?", name).First(&existingCenter).Error; err == nil {
			// Center with this name already exists - return conflict
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Center with this name already exists"})
		}

		// Create new center
		center = models.Center{Name: name, City: city, ManagerName: managerName, Phone: phone, Email: email, Address: address, Photo: serverFullFileName}
		if err := tx.Create(&center).Error; err != nil {
			tx.Rollback()
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to store Center information in Database")
			return nil
		}
	}

	if formHasFile {
		if err := c.SaveFile(photoFile, serverFullFileName); err != nil {
			tx.Rollback()
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error during storing files to server file system")
			return nil
		}
	}
	if err := tx.Commit().Error; err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error saving center info in Database")
		tx.Rollback()
		return nil
	}

	return c.JSON(center)
}

// GetCenter ...
func GetCenter(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		log.Debug("ERROR: Can not acess database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not acess database, please try again later"})
	}
	id := c.Params("id")
	var center models.Center
	if err := db.Where("id = ?", id).First(&center).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(center)
}

// GetAllCenters collects all centers in database
func GetAllCenters(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var centers []models.Center
	if err := db.Find(&centers).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(centers)
}

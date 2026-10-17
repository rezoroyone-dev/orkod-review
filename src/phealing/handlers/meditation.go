package handlers

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/models"
	"PranicServer/utilities"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// DeleteMeditation ....
func DeleteMeditation(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error: can not access database, please try again later"})
	}
	id := c.Params("id")
	var meditation models.Meditation
	err := db.Where("id = ?", id).First(&meditation).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	err = db.Unscoped().Delete(meditation).Error
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "SQL error,Failed to delete meditation as it has other related entries in other tables"})
	}
	return c.JSON(fiber.Map{"id #" + id: "deleted"})
}

// SaveMeditation ....
func SaveMeditation(c fiber.Ctx) error {
	log.Debug("[DEBUG] SaveMeditation called")
	var err error
	db := database.GetDB(c)
	if db == nil {
		log.Debug("[ERROR] SaveMeditation: database is nil")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var meditationID int
	var name, path, comment string
	var medType int = 0

	// Try multipart first
	log.Debug("[DEBUG] SaveMeditation: attempting to parse multipart form")
	form, err := c.MultipartForm()
	var formHasFile bool = false
	var meditationFile *multipart.FileHeader

	if err == nil {
		log.Debug("[DEBUG] SaveMeditation: multipart form parsed successfully")
		id := c.FormValue("id")
		if id == "" {
			id = "-1"
		}
		meditationID, _ = strconv.Atoi(id)
		name = c.FormValue("name")
		path = c.FormValue("path")
		comment = c.FormValue("comment")
		medTypeStr := c.FormValue("medType")
		if medTypeStr != "" {
			medType, _ = strconv.Atoi(medTypeStr)
		}
		log.Debugf("[DEBUG] SaveMeditation: id=%d, name=%s, path=%s, medType=%d\n", meditationID, name, path, medType)

		files := form.File["files"]
		if len(files) > 0 {
			formHasFile = true
			meditationFile = files[0]
			log.Debugf("[DEBUG] SaveMeditation: file uploaded: %s\n", meditationFile.Filename)
		}
	} else {
		log.Debugf("[DEBUG] SaveMeditation: multipart form failed, trying JSON: %v\n", err)
		// Fallback to JSON
		var jsonMed models.Meditation
		if err := c.Bind().Body(&jsonMed); err == nil {
			meditationID = int(jsonMed.ID)
			name = jsonMed.Name
			path = jsonMed.Path
			comment = jsonMed.Comment
			medType = jsonMed.MedType
			log.Debugf("[DEBUG] SaveMeditation: JSON parsed: id=%d, name=%s, medType=%d\n", meditationID, name, medType)
		} else {
			log.Debugf("[DEBUG] SaveMeditation: JSON parse failed: %v\n", err)
		}
	}

	var meditation models.Meditation = models.Meditation{ID: meditationID, Name: name, MedType: medType, Path: path, Comment: comment}
	parentDir := config.GetDataRoot() + utilities.GetPathSeparator() + "mediaFiles"
	var serverFullFileName string = ""

	if formHasFile {
		if meditationFile.Filename == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid meditation file name"})
		}

		serverFullFileName, err = utilities.GenerateNextUniqueFileName(parentDir, c)
		if err != nil {
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Unable to generate unique file name "+parentDir)
			return nil
		}

		extension := filepath.Ext(meditationFile.Filename)
		serverFullFileName += extension
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error occurred while saving meditation information, transaction rolled back"})
		}
	}()

	if err := tx.Error; err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error starting database transaction for storing Meditation information")
		return nil
	}

	log.Debugf("[DEBUG] SaveMeditation: before switch - meditation.ID=%d, medType=%d, formHasFile=%v\n", meditation.ID, medType, formHasFile)

	// Fix: Only check medType for routing, not ID (ID will be auto-generated)
	if medType == 0 {
		// LINK type - use saveLink
		log.Debug("[DEBUG] SaveMeditation: routing to LINK case")
		switch medType {
		case 0: // LINK
			log.Debug("[DEBUG] SaveMeditation: EXECUTING CASE 0 (LINK)")
			if err := saveLink(&meditation, c, tx); err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
			}
		}
	} else if medType == 1 && formHasFile {
		// FILE type with file - use Create
		log.Debug("[DEBUG] SaveMeditation: routing to FILE case")
		if !formHasFile {
			tx.Rollback()
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file received from client"})
		}

		// Fix: Store relative path instead of full path (cross-platform compatible)
		// The relative path should be: mediaFiles/2026/2/26/filename.mp3
		// Normalize paths to use forward slashes for consistent cross-platform handling
		normalizedFullPath := strings.ReplaceAll(serverFullFileName, "\\", "/")
		normalizedParentDir := strings.ReplaceAll(parentDir, "\\", "/")
		relativePath := strings.TrimPrefix(normalizedFullPath, normalizedParentDir+"/")
		// Add mediaFiles prefix for correct URL resolution
		meditation.Path = "mediaFiles/" + relativePath
		log.Debugf("[DEBUG] SaveMeditation: storing relative path: %s\n", relativePath)

		// Fix: Set ID to 0 so GORM creates new record
		if meditation.ID < 0 {
			meditation.ID = 0
		}
		if err := tx.Create(&meditation).Error; err != nil {
			tx.Rollback()
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to store Meditation File information in Database")
			return nil
		}
		saveFile(meditationFile, serverFullFileName, c)
	} else if meditation.ID > 0 {
		// Update existing record
		log.Debug("[DEBUG] SaveMeditation: routing to UPDATE case")
		if err := tx.Save(&meditation).Error; err != nil {
			tx.Rollback()
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to update Meditation information in Database")
			return nil
		}
	} else {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Unknown meditation state: neither LINK nor FILE with valid data"})
	}

	if err := tx.Commit().Error; err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error saving meditation info in Database")
		tx.Rollback()
		return nil
	}

	return c.JSON(meditation)
}

// Saves the file to server OS file system
func saveFile(meditationFile *multipart.FileHeader, serverFullFileName string, c fiber.Ctx) {
	if err := c.SaveFile(meditationFile, serverFullFileName); err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error during storing files to server file system")
	}
}

func saveLink(meditation *models.Meditation, c fiber.Ctx, tx *gorm.DB) error {
	if strings.TrimSpace(meditation.Path) == "" { // empty links are not allowed here
		return fmt.Errorf("Empty links are not allowed")
	}
	if meditation.ID > 0 { // exisitng so update/save it
		if err := tx.Save(&meditation).Error; err != nil {
			return err
		}
	} else { // new so create it
		if err := tx.Create(&meditation).Error; err != nil {
			return err
		}
	}
	return nil
}

// ServeMultimediaFiles .... . . .
func ServeMultimediaFiles(c fiber.Ctx) error {
	path := c.Params("*")
	parentDir := config.GetDataRoot()
	pathSep := utilities.GetPathSeparator()
	var pathPrefix = parentDir + pathSep + "mediaFiles"
	if !strings.HasPrefix(path, pathPrefix) {
		path = pathPrefix + pathSep + path
	}

	// Check if file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "File not found"})
	}

	return c.SendFile(path)
}

// GetMeditation ...
func GetMeditation(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		log.Debug("ERROR: Can not acess database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error: can not access database, please try again later"})
	}
	id := c.Params("id")
	var meditation models.Meditation
	if err := db.Where("id = ?", id).First(&meditation).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(meditation)
}

// GetAllMeditations collects all meditations in database
func GetAllMeditations(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not acess database, please try again later"})
	}
	var meditations []models.Meditation
	if err := db.Find(&meditations).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(meditations)
}

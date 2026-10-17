package handlers

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/models"
	"PranicServer/utilities"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// DeleteDocument ....
func DeleteDocument(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	id := c.Params("id")
	var document models.Document
	if err := db.Where("id = ?", id).First(&document).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	filePath := document.Path
	// Try to remove the file, but don't fail hard if it's already gone
	if _, err := os.Stat(filePath); err != nil && os.IsNotExist(err) {
		// Try fallback to config.GetDataRoot() + filePath if filePath is relative
		fallbackPath := filepath.Join(config.GetDataRoot(), filePath)
		if _, err := os.Stat(fallbackPath); err == nil {
			filePath = fallbackPath
		}
	}

	if _, err := os.Stat(filePath); err == nil {
		if err := os.Remove(filePath); err != nil {
			log.Debugf("Error removing file %s: %v", filePath, err)
		}
	} else {
		log.Debugf("File %s does not exist (absolute or relative), proceeding to delete DB record", filePath)
	}

	if err := db.Where("id = ?", id).Delete(&document).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete document record: " + err.Error()})
	}

	return c.JSON(fiber.Map{"id #" + id: "deleted"})
}

// UploadDocuments uploads files to server, each file is stored under
// ./uploadedFiles/YEAR/MONTH/DAY/DocumentID
func UploadDocuments(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	formPersonID := c.FormValue("personID")
	if formPersonID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Client Error: Invalid personId value"})
	}
	var personID int
	var err error

	if personID, err = strconv.Atoi(formPersonID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Client Error: Invalid personID value %s", err)})
	}

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		logger.CatchJSONError(fiber.StatusBadRequest, c, err, "Error in populating MultipartForm")
		return nil
	}

	files := form.File["files"]
	parentDir := config.GetDataRoot() + utilities.GetPathSeparator() + "uploadedFiles"

	// Validate file uploads
	const maxFileSize = 50 * 1024 * 1024 // 50 MB per file
	allowedExtensions := map[string]bool{
		".pdf": true, ".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
		".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".txt": true,
		".csv": true, ".bmp": true, ".tiff": true, ".webp": true,
	}

	for _, file := range files {
		if file.Size > maxFileSize {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("File %s exceeds maximum size of 50MB", file.Filename)})
		}
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if !allowedExtensions[ext] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("File type %s is not allowed", ext)})
		}
	}

	for _, file := range files {
		if file.Filename == "" {
			continue
		}
		filename := filepath.Base(file.Filename)

		serverFullFileName, err := utilities.GenerateNextUniqueFileName(parentDir, c)
		if err != nil {
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Unable to generate unique file name "+parentDir)
			return nil
		}

		doc := models.Document{FileName: filename, Path: serverFullFileName, PersonID: uint32(personID)}

		if err := db.Save(&doc).Error; err != nil {
			log.Debug(err)
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to store Document information in Database")
			return nil
		}
		if err := c.SaveFile(file, serverFullFileName); err != nil {
			logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Error during storing files to server file system")
			return nil
		}
	}
	if len(files) > 0 {
		return c.JSON(fiber.Map{"message": fmt.Sprintf("Uploaded successfully %d files with PersonID=%d", len(files), personID)})
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Client Error: Nothing was uploaded!!!"})
	}
}

// GetDocument ....
func GetDocument(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	id := c.Params("id")
	var document models.Document
	if err := db.Where("id = ?", id).First(&document).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	document.Path = utilities.GetPathWithoutLeadingDots(document.Path)
	return c.JSON(document)
}

// GetDocumentsByPersonID Gets all Documents for a specific user .....
func GetDocumentsByPersonID(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	personID := c.Params("personID")
	var documents []models.Document
	if err := db.Where("person_id = ?", personID).Find(&documents).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	} else {
		removePathLeadingDots(documents)
		return c.JSON(documents)
	}
}

// GetDocuments Gets All Documents .....
func GetDocuments(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var documents []models.Document
	if err := db.Find(&documents).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		removePathLeadingDots(documents)
		return c.JSON(documents)
	}
}

// removePathLeadingDots cleans up the path by removing leading dots, remove Leading Dots From Docs Paths
func removePathLeadingDots(docs []models.Document) {
	for i := 0; i < len(docs); i++ {
		docs[i].Path = utilities.GetPathWithoutLeadingDots(docs[i].Path)
	}
}

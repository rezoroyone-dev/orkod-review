package handlers

import (
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/resources"
	"PranicServer/services"

	"github.com/gofiber/fiber/v3"
)

// GetSicknessNatures returns the list of sickness natures by language
func GetSicknessNatures(c fiber.Ctx) error {
	var err error
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	type QueryInfo struct {
		Lang string `json:"lang"`
	}
	var queryInfo QueryInfo

	err = c.Bind().Body(&queryInfo)
	logger.CatchJSONError(fiber.StatusBadRequest, c, err, "Failed to parse language from client")
	if err != nil {
		return nil
	}
	sicknessNatures, err := services.GetSicknessNaturesByLang(queryInfo.Lang)
	logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Unable to collect Sickness Nature data in server")
	if err != nil {
		return nil
	}
	return c.JSON(sicknessNatures)
}

// GetProtocolPDF returns the pdf file contents for a specific language and pdf file name
func GetProtocolPDF(c fiber.Ctx) error {
	var err error

	type QueryInfo struct {
		Lang     string `json:"lang"`
		FileName string `json:"fileName"`
	}
	var queryInfo QueryInfo

	err = c.Bind().Body(&queryInfo)
	logger.CatchJSONError(fiber.StatusBadRequest, c, err, "Failed to parse protocol request from client")
	if err != nil {
		return nil
	}

	var filePath = "/data/sicknessNature/protocols/" + queryInfo.Lang + "/" + queryInfo.FileName

	var pdfFileContents []byte
	pdfFileContents, err = resources.ReadFile(filePath)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	c.Set("Content-Type", "application/pdf")
	return c.Send(pdfFileContents)
}

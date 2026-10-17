package invoice

import (
	"PranicServer/config"
	"PranicServer/utilities"
	"encoding/json"
	"io/ioutil"
	"os"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

var jsonFileName string = config.GetDataRoot() + utilities.GetPathSeparator() + "invoiceTemplate.json"

// SaveTemplate Writes the Invoice Template file invoiceTemplate.json based on the incoming JSON from client
func SaveTemplate(c fiber.Ctx) error {
	var err error

	type InvoiceTemplate struct {
		Contents string `json:"contents"`
	}

	var invoiceTemplate InvoiceTemplate

	if err := c.Bind().Body(&invoiceTemplate); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing invoiceTemplate: " + err.Error()})
	}

	jsonString, err := json.Marshal(&invoiceTemplate)

	if err != nil {
		log.Debug("Error decoding Invoice Templates " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	err = ioutil.WriteFile(jsonFileName, jsonString, os.ModePerm)
	if err != nil {
		log.Debug("Error Wrtiting Invoice Templates JSON file " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"Saved": "Yes"})
}

// FetchTemplate sends the Invoice Template file invoiceTemplate.json contents
func FetchTemplate(c fiber.Ctx) error {
	jsonFileContents, err := ioutil.ReadFile(jsonFileName)
	if err != nil {
		log.Debug("Error reading Invoice Templates JSON file in server" + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(string(jsonFileContents))
}

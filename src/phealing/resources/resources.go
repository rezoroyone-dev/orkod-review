package resources

import (
	_ "PranicServer/resources/statik" // TODO: Replace with the absolute import path
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"github.com/rakyll/statik/fs"
)

var statikFS http.FileSystem

func init() {
	var err error
	statikFS, err = fs.New()
	if err != nil {
		log.Fatal(err)
	}
}

// ReadFile reads a static file
func ReadFile(filePath string) ([]byte, error) {
	// Access individual files by their paths.
	r, err := statikFS.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer r.Close()
	contents, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return contents, nil
}

// GetStaticFS returns the static File system
func GetStaticFS() http.FileSystem {
	return statikFS
}

// Test is a test function
func Test(filePath string) {
	// fileContents, err := ReadFile("/data/sicknessNature/sicknessNatures_en.json")
	fileContents, err := ReadFile(filePath)
	if err != nil {
		log.Debug(err)
	}
	fmt.Println(string(fileContents))
}

// StaticHandler is a .....
func StaticHandler(c fiber.Ctx) error {
	p := c.Params("filepath")
	if p == "/" || p == "/app/" {
		p = "/app"
	}

	if p == "/app" {
		p = "/app/index.html"
	}

	if !strings.HasPrefix(p, "/app/") {
		// strings.Replace(p, "/app/", "/WebRoot/", 1)
		p = "/app" + p
	}

	data, err := ReadFile(p)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Send(data)
}

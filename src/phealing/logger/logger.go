package logger

import (
	"PranicServer/config"
	"log"

	"github.com/gofiber/fiber/v3"
	fiberLogger "github.com/gofiber/fiber/v3/log"
)

var configParams *config.ParamsStruct

// GormLogger struct
type GormLogger struct{}

// Print - Log Formatter
func (*GormLogger) Print(v ...interface{}) {
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
	switch v[0] {
	case "sql":
		log.Println(v...)
	case "github.com/gofiber/fiber/v3/log":
		log.Println(v...)
	default:
		log.Println(v...)
	}
}

func init() {
	configParams := config.GetConfigParams()
	logFile := config.GetLogFile()
	fiberLogger.SetOutput(logFile)
	log.SetOutput(logFile)
	if configParams.Debug == "true" {
		// log.SetPrefix("[DEBUG] ")
		log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds)
		fiberLogger.SetLevel(fiberLogger.LevelDebug)
	} else {
		fiberLogger.SetLevel(fiberLogger.LevelError)
	}
}

// Start enables loggin
func Start() {

}

// GetLogger returns loger
func GetLogger() *GormLogger {
	return &GormLogger{}
}

// CatchError ...
func CatchError(err error) {
	if err != nil {
		log.Println("ERROR: ", err)
	}
}

// CatchFatalError ...
func CatchFatalError(err error) {
	if err != nil {
		log.Fatal("ERROR: ", err)
	}
}

// CatchJSONError ...
func CatchJSONError(errorCode int, c fiber.Ctx, err error, msg string) {
	if err != nil {
		if msg != "" {
			msg += "\n"
		}
		errorMSG := msg + err.Error()
		log.Println(errorMSG)
		c.Status(errorCode).JSON(fiber.Map{"error": errorMSG})
	}
}

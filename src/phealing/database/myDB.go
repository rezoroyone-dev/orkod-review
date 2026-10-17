package database

import (
	"PranicServer/config"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

func init() {
	configParams := config.GetConfigParams()

	username := configParams.DbUser
	password := configParams.DbPassword
	dbName := configParams.DbName
	dbHost := configParams.DbHost
	dbPort := configParams.DbPort

	// Build DSN
	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s sslmode=disable password=%s",
		dbHost, dbPort, username, dbName, password)

	gormConfig := &gorm.Config{}

	// Determine GORM log level from config
	// 0=Silent, 1=Error, 2=Warn, 3=Info, 4=Verbose
	logLevel := logger.Silent // default to silent
	if configParams.GormLogLevel != "" {
		if level, err := strconv.Atoi(configParams.GormLogLevel); err == nil {
			switch level {
			case 0:
				logLevel = logger.Silent
			case 1:
				logLevel = logger.Error
			case 2:
				logLevel = logger.Warn
			case 3:
				logLevel = logger.Info
			case 4:
				logLevel = logger.Info // Verbose maps to Info in GORM
			}
		}
	} else if configParams.Debug == "true" {
		// Fallback to info level if Debug is true and no GormLogLevel specified
		logLevel = logger.Info
	}
	gormConfig.Logger = logger.Default.LogMode(logLevel)

	var err error
	db, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		log.Debug("Failed to connect database: ", err)
		log.Fatal("Failed to connect database: ", err)
		return
	}
}

// GetConnection ... returns database connection (kept for backward compatibility)
func GetConnection() *gorm.DB {
	return db
}

// DBMiddleware injects the *gorm.DB instance into each request's context via c.Locals("db").
// Apply this middleware globally so all handlers can retrieve the DB via GetDB(c).
func DBMiddleware() func(c fiber.Ctx) error {
	return func(c fiber.Ctx) error {
		c.Locals("db", db)
		return c.Next()
	}
}

// GetDB retrieves the *gorm.DB from the request context.
// Falls back to the global singleton if not set (e.g. in tests or non-middleware paths).
func GetDB(c fiber.Ctx) *gorm.DB {
	if v := c.Locals("db"); v != nil {
		if d, ok := v.(*gorm.DB); ok {
			return d
		}
	}
	return db
}

package main

import (
	"PranicServer/auth"
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/license"
	"PranicServer/logger"
	"PranicServer/server"
	"PranicServer/services"
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3/log"
	"gorm.io/gorm"
)

var db *gorm.DB
var configParams *config.ParamsStruct

func init() {
	logger.Start()

	configParams = config.GetConfigParams()

	license.PerformLicenseChecks()
	db = database.GetConnection()

	if db == nil {
		log.Error("FATAL: Cannot access database, exiting")
		os.Exit(1)
	}

	// Check if database migration should be enabled
	if configParams.EnableDBMigration == "true" {
		database.MigrateDB(db)
	} else {
		log.Info("Database migration disabled via configuration")
	}

	database.CreateDefaultMeditations(db)
	auth.SeedRolesAndPermissions(db)
	auth.SeedAdminUser(db, configParams.AdminPassword)

	// Seed email templates for notifications
	if err := services.SeedDefaultEmailTemplates(db); err != nil {
		log.Warnf("Warning: Failed to seed email templates: %v", err)
	}
}

func main() {
	// Create a context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Channel to catch OS signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start background scheduler
	ticker := time.NewTicker(time.Hour * 24)
	go func() {
		for {
			select {
			case <-ticker.C:
				license.PerformLicenseChecks()
				database.CleanupAuditLogs(db)
			case <-ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()

	// Start server in a goroutine
	go func() {
		log.Infof("Starting server on port %s (HTTP) and %s (HTTPS)",
			configParams.HTTPPort, configParams.HTTPSPort)
		server.Start(configParams)
	}()

	// Wait for shutdown signal
	<-stop
	log.Info("Shutting down gracefully...")

	// Stop the server first to stop accepting new requests
	if err := server.Stop(); err != nil {
		log.Errorf("Error shutting down server: %v", err)
	}

	// Cancel context to stop background tasks
	cancel()

	// Stop auth cache cleanup goroutine
	auth.StopCacheCleanup()

	// Give outstanding requests time to complete
	time.Sleep(2 * time.Second)

	// Close database connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Errorf("Error getting underlying sql.DB: %v", err)
	} else {
		if err := sqlDB.Close(); err != nil {
			log.Errorf("Error closing database connection: %v", err)
		} else {
			log.Info("Database connection closed")
		}
	}

	log.Info("Server stopped")
}

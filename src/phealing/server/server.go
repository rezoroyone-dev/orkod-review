package server

import (
	"PranicServer/config"
	"PranicServer/logger"
	"PranicServer/routes"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

// serverInstance holds the Fiber app for graceful shutdown
var serverInstance *fiber.App

// Start initializes and starts the Fiber server
func Start(configParams *config.ParamsStruct) {
	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Store reference for graceful shutdown
	serverInstance = app

	// Add middleware
	app.Use(recover.New())

	// CORS: load allowed origins from CORS_ALLOWED_ORIGINS env var.
	// In production set this to your actual domain (e.g., "https://yourdomain.com").
	// Falls back to localhost origins for local development only.
	corsOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOriginsStr == "" {
		corsOriginsStr = "https://www.orkodcenter.com,https://orkodcenter.com,http://www.orkodcenter.local:8080,http://www.orkodcenter.local:9091,http://www.orkodcenter.local:80,http://www.orkodcenter.local:5173"
	}
	// Fiber v3 AllowOrigins is []string
	corsOrigins := strings.Split(corsOriginsStr, ",")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Access-control-allow-origin", "Access-Control-Allow-Headers", "authorization", "Origin", "Content-Length", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           int(12 * time.Hour / time.Second),
	}))

	// Setup routes
	routes.Setup(app)

	// listen and serve
	var err error
	var httpsEnabled bool = configParams.HTTPS_ENABLED == "true"
	if httpsEnabled {
		// Fiber v3: ListenTLS replaced by Listen with ListenConfig
		err = app.Listen(":"+configParams.HTTPSPort, fiber.ListenConfig{
			CertFile:    configParams.TLSCertLocation,
			CertKeyFile: configParams.TLSKeyLocation,
		})
	} else {
		// For HTTP:
		err = app.Listen(":" + configParams.HTTPPort)
	}

	logger.CatchFatalError(err)
}

// Stop gracefully shuts down the Fiber server
func Stop() error {
	if serverInstance != nil {
		return serverInstance.Shutdown()
	}
	return nil
}

package routes

import (
	"PranicServer/auth"
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/handlers"
	"PranicServer/invoice"
	"PranicServer/license"
	"PranicServer/sms"
	"PranicServer/utilities"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/gofiber/fiber/v3/middleware/static"
)

// Setup registers all application routes
func Setup(app *fiber.App) {
	parentDir := config.GetDataRoot()
	pathSep := utilities.GetPathSeparator()
	baseRoutePath := utilities.GetPathWithoutLeadingDots(parentDir)

	// Redirect root to /app
	app.Get("/", func(c fiber.Ctx) error {
		return c.Redirect().To("/app")
	})

	// Serve static files for the frontend app
	app.Use("/app", static.New("./dist"))

	// Inject *gorm.DB into every request context via c.Locals("db")
	app.Use(database.DBMiddleware())

	api := app.Group("/api")

	{
		publicDir := parentDir + pathSep + "public"

		// Serving meditation video/audio files - make this PUBLIC (no auth required)
		// Must be before api.Use(auth.BearerAuth()) to avoid 401 errors
		media := api.Group("/mediaFiles")
		media.Get("/*", handlers.ServeMultimediaFiles)

		// public routes go here, no authentication is required
		public := api.Group("/public")

		// Static file serving
		licenseFiles := parentDir + pathSep + "licenseFiles"
		public.Use("/licenseFiles", static.New(licenseFiles))
		public.Use("/images", static.New(publicDir+pathSep+"images"))
		public.Use("/audio", static.New(publicDir+pathSep+"audio"))

		// License requests
		public.Post("/createLicenseRequestFile", license.CreateLicenseRequest)
		public.Post("/uploadLicenseFile", license.UploadLicenseFile)
		public.Post("/licenseStatus", license.Status)

		// Public booking routes - rate limited to prevent abuse
		public.Get("/availableHealers", limiter.New(limiter.Config{
			Max:        100,
			Expiration: 1 * time.Minute,
		}), handlers.GetAvailableHealers)
		public.Get("/healerAvailability/:healerID", limiter.New(limiter.Config{
			Max:        100,
			Expiration: 1 * time.Minute,
		}), handlers.GetHealerAvailability)
		public.Post("/bookSession", limiter.New(limiter.Config{
			Max:        10,
			Expiration: 1 * time.Minute,
		}), handlers.CreateSchedule) // Reuse existing handler
		public.Post("/contact", limiter.New(limiter.Config{
			Max:        20,
			Expiration: 1 * time.Minute,
		}), handlers.SaveContactMessage)

		// Public specialty-booking, doctor directory, reviews and donation feed.
		// These power the anonymous public site and are rate limited to deter abuse.
		public.Get("/specialties", handlers.GetPublicSpecialties)
		public.Get("/slots", limiter.New(limiter.Config{
			Max:        120,
			Expiration: 1 * time.Minute,
		}), handlers.GetPublicSlots)
		public.Get("/config", handlers.GetPublicConfig)
		public.Post("/bookSpecialty", limiter.New(limiter.Config{
			Max:        10,
			Expiration: 1 * time.Minute,
		}), handlers.BookSpecialtySession)

		// Public doctor directory (safe projection; never exposes private fields)
		public.Get("/doctors", limiter.New(limiter.Config{
			Max:        120,
			Expiration: 1 * time.Minute,
		}), handlers.GetPublicDoctors)
		public.Get("/doctors/:id", limiter.New(limiter.Config{
			Max:        120,
			Expiration: 1 * time.Minute,
		}), handlers.GetPublicDoctor)

		// Public reviews (read approved, submit new)
		public.Get("/reviews", limiter.New(limiter.Config{
			Max:        120,
			Expiration: 1 * time.Minute,
		}), handlers.GetReviews)
		public.Post("/reviews", limiter.New(limiter.Config{
			Max:        20,
			Expiration: 1 * time.Minute,
		}), handlers.CreateReview)

		// Public donation feed (read approved+public, submit new)
		public.Get("/donations", limiter.New(limiter.Config{
			Max:        60,
			Expiration: 1 * time.Minute,
		}), handlers.ListPublicDonations)
		public.Post("/donations", limiter.New(limiter.Config{
			Max:        20,
			Expiration: 1 * time.Minute,
		}), handlers.CreateDonation)

		// Patient Self-Service Portal — registered BEFORE the global BearerAuth
		// boundary so /register and /login stay public. See patient_routes.go.
		registerPatientRoutes(api)

		// Rate limit: max 50 login attempts per minute per IP
		// (increased from 10 to support parallel integration test runs)
		api.Post("/authenticate", limiter.New(limiter.Config{
			Max:        50,
			Expiration: 1 * time.Minute,
			KeyGenerator: func(c fiber.Ctx) string {
				return c.IP()
			},
			LimitReached: func(c fiber.Ctx) error {
				return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
					"error": "Too many login attempts. Please try again in 1 minute.",
				})
			},
		}), auth.Authenticate)

		// Token refresh endpoint
		api.Post("/auth/refresh", auth.RefreshToken)

		// 2FA verification for login - this must be public (no auth required)
		// since it's part of the authentication flow
		api.Post("/auth/2fa/verify-login", handlers.VerifyTOTPForLogin)

		api.Get("/me", auth.PermissionMiddleware(""), handlers.GetMe)

		// SMS Routes and requests for Mobile App go here
		smsRoute := api.Group("/sms")
		smsRoute.Use(auth.BasicAuth(auth.BasicAuthEmptyRealm))
		smsRoute.Use(license.CheckLicense)
		smsRoute.Post("/allSMS", sms.GetAllSMS)

		// enabling auth for private routes — Bearer JWT token (no bcrypt on every request)
		api.Use(auth.BearerAuth())
		// enabling license checks for each request
		api.Use(license.CheckLicense)

		api.Use(baseRoutePath+pathSep+"uploadedFiles", static.New(parentDir+pathSep+"uploadedFiles"))
		api.Use("/uploadedFiles", static.New(parentDir+pathSep+"uploadedFiles"))

		// SMS Routes and requests for Desktop App
		api.Post("/smsTemplates", sms.GetSmsTemplates)
		api.Post("/saveSmsTemplates", sms.SaveSmsTemplates)
		api.Post("/getServerIP", sms.GetServerIP)

		//Invoice
		invoiceRoute := api.Group("/invoice")
		invoiceRoute.Post("/saveTemplate", invoice.SaveTemplate)
		invoiceRoute.Post("/fetchTemplate", invoice.FetchTemplate)

		// people routes
		api.Get("/people", handlers.GetPersons)
		api.Get("/people/:id", handlers.GetPerson)
		api.Post("/people", handlers.CreatePerson)
		api.Post("/people/:id", handlers.UpdatePerson)
		api.Delete("/people/:id", handlers.DeletePerson)

		// User routes
		api.Get("/users/:id", auth.PermissionMiddleware("manage_users"), handlers.GetUser)
		api.Post("/users/:id", auth.PermissionMiddleware("manage_users"), handlers.UpdateUser)
		api.Get("/users", auth.PermissionMiddleware("manage_users"), handlers.GetUsers)
		api.Post("/users", auth.PermissionMiddleware("manage_users"), handlers.CreateUser)
		api.Delete("/users/:id", auth.PermissionMiddleware("manage_users"), handlers.DeleteUser)

		// Role Management
		api.Get("/roles", auth.PermissionMiddleware("manage_roles"), handlers.GetRoles)
		api.Get("/permissions", auth.PermissionMiddleware("manage_roles"), handlers.GetPermissions)
		api.Post("/roles", auth.PermissionMiddleware("manage_roles"), handlers.CreateRole)
		api.Post("/roles/:id", auth.PermissionMiddleware("manage_roles"), handlers.UpdateRole)
		api.Delete("/roles/:id", auth.PermissionMiddleware("manage_roles"), handlers.DeleteRole)

		// Healer Availability
		api.Get("/healerAvailability/:healerID", auth.PermissionMiddleware(""), handlers.GetHealerAvailability)
		api.Post("/healerAvailability/:healerID", auth.PermissionMiddleware("set_availability"), handlers.SaveHealerAvailability)

		// search routes
		api.Post("/search", handlers.Search)

		// Healer routes
		api.Post("/findHealers", handlers.FindHealers)
		api.Post("/getHealer", handlers.GetHealer)
		api.Post("/getAllHealers", handlers.GetAllHealers)
		api.Post("/createHealer", handlers.CreateHealer)
		api.Delete("/deleteHealer/:id", handlers.DeleteHealer)

		// Healer specialties (admin-managed healing areas that drive public booking)
		api.Get("/getHealerSpecialties/:healerID", auth.PermissionMiddleware(""), handlers.GetHealerSpecialties)
		api.Post("/saveHealerSpecialties/:healerID", auth.PermissionMiddleware("set_availability"), handlers.SaveHealerSpecialties)

		// Public-site settings (session price, donations visibility)
		api.Post("/settings/sessionPrice", auth.PermissionMiddleware(""), handlers.SetSessionPrice)
		api.Post("/settings/donationsVisible", auth.PermissionMiddleware(""), handlers.SetDonationsVisible)

		// Donations (admin moderation)
		api.Get("/donations", auth.PermissionMiddleware(""), handlers.AdminListDonations)
		api.Post("/donations/:id/approve", auth.PermissionMiddleware(""), handlers.AdminApproveDonation)
		api.Delete("/donations/:id", auth.PermissionMiddleware(""), handlers.AdminDeleteDonation)

		// Doctor directory management (admin, includes inactive profiles)
		api.Get("/doctors", auth.PermissionMiddleware(""), handlers.GetAllDoctors)
		api.Post("/doctors", auth.PermissionMiddleware(""), handlers.CreateDoctor)
		api.Post("/doctors/:id", auth.PermissionMiddleware(""), handlers.UpdateDoctor)
		api.Delete("/doctors/:id", auth.PermissionMiddleware(""), handlers.DeleteDoctor)

		// Review moderation (admin)
		api.Post("/reviews/:id/moderate", auth.PermissionMiddleware(""), handlers.ModerateReview)
		api.Delete("/reviews/:id", auth.PermissionMiddleware(""), handlers.DeleteReview)

		// schedule routes
		api.Post("/scheduleList", handlers.GetSchedules)
		api.Post("/futureScheduleList", handlers.GetFutureSchedules)
		api.Get("/schedule/:id", handlers.GetSchedule)
		api.Post("/createSchedule", handlers.CreateSchedule)
		api.Post("/createRecurringSchedule", handlers.CreateRecurringSchedule)
		api.Post("/updateSchedule", handlers.UpdateSchedule)

		api.Post("/GetSchedulesByPersonID", handlers.GetSchedulesByPersonID)
		api.Delete("/deleteSchedule/:id", handlers.DeleteSchedule)

		// Treatments
		api.Post("/createTreatment", handlers.CreateTreatment)
		api.Post("/updateTreatment", handlers.UpdateTreatment)
		api.Delete("/deleteTreatment/:id", handlers.DeleteTreatment)
		api.Get("/treatmentList/:status/:id", handlers.GetTreatments)
		api.Get("/treatment/:id", handlers.GetTreatment)

		// SicknessNatures
		api.Post("/sicknessNatures", handlers.GetSicknessNatures)
		api.Post("/protocolPDF", handlers.GetProtocolPDF)

		// Documents
		api.Post("/uploadDocuments", handlers.UploadDocuments)
		api.Delete("/deleteDocument/:id", handlers.DeleteDocument)
		api.Get("/document/:id", handlers.GetDocument)
		api.Get("/documentList/:personID", handlers.GetDocumentsByPersonID)

		//Centers
		api.Post("/getAllCenters", handlers.GetAllCenters)
		api.Get("/center/:id", handlers.GetCenter)
		api.Delete("/center/:id", handlers.DeleteCenter)
		api.Post("/saveCenter", handlers.SaveCenter)

		//Meditations
		api.Post("/getAllMeditations", handlers.GetAllMeditations)
		api.Get("/meditation/:id", handlers.GetMeditation)
		api.Delete("/meditation/:id", handlers.DeleteMeditation)
		api.Post("/saveMeditation", handlers.SaveMeditation)

		// reporting routes
		api.Post("/getTreatmentsReportData", handlers.GetTreatmentsReportData)
		api.Post("/getPatientsReportData", handlers.GetPatientsReportData)
		api.Post("/exportToExcel", handlers.ExportToExcel)

		// dashboard analytics
		api.Get("/dashboardStats", handlers.GetDashboardStats)

		// Contact Messages (Inbox)
		api.Get("/contactMessages", auth.PermissionMiddleware("manage_inbox"), handlers.GetContactMessages)
		api.Delete("/contactMessages/:id", auth.PermissionMiddleware("manage_inbox"), handlers.DeleteContactMessage)
		api.Post("/contactMessages/:id/read", auth.PermissionMiddleware("manage_inbox"), handlers.MarkContactMessageAsRead)

		// Audit Logs
		api.Get("/auditLogs", auth.PermissionMiddleware("view_audit_logs"), handlers.GetAuditLogs)
		api.Delete("/auditLogs/:id", auth.PermissionMiddleware("view_audit_logs"), handlers.DeleteAuditLog)

		// Password Reset (public)
		api.Post("/auth/requestReset", handlers.RequestPasswordReset)
		api.Post("/auth/resetPassword", handlers.ResetPassword)

		// Two-Factor Authentication
		api.Post("/auth/2fa/setup", handlers.Setup2FA)
		api.Post("/auth/2fa/verify", handlers.Verify2FA)
		api.Post("/auth/2fa/disable", handlers.Disable2FA)

		// Session Notes
		api.Post("/schedule/notes", handlers.UpdateSessionNotes)
		api.Get("/schedule/:id/notes", handlers.GetScheduleWithNotes)

		// Document Search and Tagging
		api.Post("/documents/search", handlers.SearchDocuments)
		api.Post("/documents/tags", handlers.UpdateDocumentTags)
		api.Post("/documents/:id/ocr", handlers.TriggerOCR)
	}
}

package routes

import (
	"PranicServer/handlers"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
)

// registerPatientRoutes wires the Patient Self-Service Portal.
//
// ORDERING CONSTRAINT: this MUST be called BEFORE api.Use(auth.BearerAuth()).
//
// Why: patient JWTs carry a `patient_id` claim but no `username` claim, so the
// global staff BearerAuth middleware rejects them (auth.go requires `username`
// to resolve a SuperUser). Keeping this block above the BearerAuth boundary
// makes /register and /login genuinely public and lets the protected sub-group
// rely solely on PatientAuthMiddleware. Routes registered on the api group
// AFTER this call still receive BearerAuth + license checks as before, so
// global authentication is not weakened.
func registerPatientRoutes(api fiber.Router) {
	// Patient Portal (public routes)
	patientAPI := api.Group("/patient")
	patientAPI.Post("/register", limiter.New(limiter.Config{
		Max:          10,
		Expiration:   1 * time.Minute,
		KeyGenerator: clientIPKey,
	}), handlers.PatientRegister)
	patientAPI.Post("/login", limiter.New(limiter.Config{
		Max:          30,
		Expiration:   1 * time.Minute,
		KeyGenerator: clientIPKey,
	}), handlers.PatientLogin)

	// Patient Portal (authenticated routes)
	patientAuth := patientAPI.Group("/", handlers.PatientAuthMiddleware())
	patientAuth.Get("/appointments", handlers.GetPatientAppointments)
	patientAuth.Get("/treatments", handlers.GetPatientTreatments)
	patientAuth.Delete("/appointments/:id", handlers.CancelPatientAppointment)
}

// clientIPKey rate-limits requests by client IP address.
func clientIPKey(c fiber.Ctx) string { return c.IP() }

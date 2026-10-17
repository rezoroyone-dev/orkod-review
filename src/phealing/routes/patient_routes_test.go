package routes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"PranicServer/auth"
	"PranicServer/database"

	"github.com/gofiber/fiber/v3"
)

// buildAPI mirrors the exact ordering used by Setup for the /api group:
// public/patient routes first, then the global BearerAuth boundary, then
// private routes. Any drift in this ordering in Setup is what these tests
// are designed to catch.
func buildAPI() *fiber.App {
	app := fiber.New(fiber.Config{AppName: "patient-routes-test"})
	api := app.Group("/api", database.DBMiddleware())

	registerPatientRoutes(api)
	api.Use(auth.BearerAuth())

	// Canary "private" route — must require the global Bearer auth.
	api.Get("/private-canary", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true})
	})

	return app
}

func doReq(t *testing.T, app *fiber.App, method, path, body string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	t.Cleanup(func() { resp.Body.Close() })
	return resp
}

func TestPatientRegister_IsPublicWithoutBearerToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-public-register")
	app := buildAPI()

	resp := doReq(t, app, http.MethodPost, "/api/patient/register", `{}`)

	// 400 comes from the handler's own validation ("email and password are
	// required"). If these routes were still behind BearerAuth, the middleware
	// would return 401 before the handler ever runs.
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST /api/patient/register without token = %d, want 400 (public route must reach handler)", resp.StatusCode)
	}
}

func TestPatientLogin_IsPublicWithoutBearerToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-public-login")
	app := buildAPI()

	resp := doReq(t, app, http.MethodPost, "/api/patient/login", `{}`)

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("POST /api/patient/login without token = %d, want 400 (public route must reach handler)", resp.StatusCode)
	}
}

func TestPatientProtectedRoutes_RequireAuth(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-protected")
	app := buildAPI()

	cases := []struct {
		name    string
		method  string
		path    string
		authHdr string
	}{
		{"appointments no token", http.MethodGet, "/api/patient/appointments", ""},
		{"appointments invalid token", http.MethodGet, "/api/patient/appointments", "Bearer not.a.valid.jwt"},
		{"treatments no token", http.MethodGet, "/api/patient/treatments", ""},
		{"cancel appointment no token", http.MethodDelete, "/api/patient/appointments/1", ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			if tc.authHdr != "" {
				req.Header.Set("Authorization", tc.authHdr)
			}
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("%s %s: %v", tc.method, tc.path, err)
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusUnauthorized {
				t.Fatalf("%s %s = %d, want 401", tc.method, tc.path, resp.StatusCode)
			}
		})
	}
}

func TestGlobalBearerAuth_StillProtectsPrivateRoutes(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-global")
	app := buildAPI()

	resp := doReq(t, app, http.MethodGet, "/api/private-canary", "")

	// Global auth must not have been weakened by making patient routes public.
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("GET /api/private-canary without token = %d, want 401", resp.StatusCode)
	}
}
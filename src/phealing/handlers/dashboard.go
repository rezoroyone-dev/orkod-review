package handlers

import (
	"PranicServer/database"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// DashboardStats holds all KPI data for the analytics home page
type DashboardStats struct {
	// Patients
	TotalPatients        int64 `json:"totalPatients"`
	NewPatientsThisMonth int64 `json:"newPatientsThisMonth"`
	// Appointments
	AppointmentsToday    int64 `json:"appointmentsToday"`
	AppointmentsThisWeek int64 `json:"appointmentsThisWeek"`
	// Treatments
	OpenTreatments      int64   `json:"openTreatments"`
	ClosedTreatments    int64   `json:"closedTreatments"`
	TreatmentCompletion float64 `json:"treatmentCompletionRate"` // percentage
	// Revenue
	RevenueThisMonth float64 `json:"revenueThisMonth"`
	TotalRevenue     float64 `json:"totalRevenue"`
	TotalUnpaid      float64 `json:"totalUnpaid"`
	// Healers
	TotalHealers int64 `json:"totalHealers"`
	// Upcoming (next 7 days)
	UpcomingAppointments int64 `json:"upcomingAppointments"`
}

// GetDashboardStats returns aggregated KPI data for the analytics dashboard
func GetDashboardStats(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEnd := todayStart.Add(24 * time.Hour)
	weekEnd := todayStart.Add(7 * 24 * time.Hour)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	var stats DashboardStats

	// ── Patients ──────────────────────────────────────────────────────────────
	// Total patients = persons who are NOT healers
	if err := db.Raw(`
		SELECT COUNT(*) FROM persons
		WHERE id NOT IN (SELECT person_id FROM healers)
	`).Scan(&stats.TotalPatients).Error; err != nil {
		log.Debug("dashboard: totalPatients error:", err)
	}

	// New patients this month = distinct persons (non-healers) whose FIRST treatment started this month
	if err := db.Raw(`
		SELECT COUNT(*) FROM (
			SELECT person_id
			FROM treatments
			WHERE person_id NOT IN (SELECT person_id FROM healers)
			GROUP BY person_id
			HAVING MIN(start_date) >= ?
		) AS new_patients
	`, monthStart).Scan(&stats.NewPatientsThisMonth).Error; err != nil {
		log.Debug("dashboard: newPatientsThisMonth error:", err)
	}

	// ── Appointments ──────────────────────────────────────────────────────────
	// Appointments today
	if err := db.Raw(`
		SELECT COUNT(*) FROM schedules
		WHERE start_date >= ? AND start_date < ?
	`, todayStart, todayEnd).Scan(&stats.AppointmentsToday).Error; err != nil {
		log.Debug("dashboard: appointmentsToday error:", err)
	}

	// Appointments this week (today → +7 days)
	if err := db.Raw(`
		SELECT COUNT(*) FROM schedules
		WHERE start_date >= ? AND start_date < ?
	`, todayStart, weekEnd).Scan(&stats.AppointmentsThisWeek).Error; err != nil {
		log.Debug("dashboard: appointmentsThisWeek error:", err)
	}

	// Upcoming appointments (next 7 days, same as this week)
	stats.UpcomingAppointments = stats.AppointmentsThisWeek

	// ── Treatments ────────────────────────────────────────────────────────────
	if err := db.Raw(`
		SELECT COUNT(*) FROM treatments WHERE UPPER(status) = 'OPEN'
	`).Scan(&stats.OpenTreatments).Error; err != nil {
		log.Debug("dashboard: openTreatments error:", err)
	}

	if err := db.Raw(`
		SELECT COUNT(*) FROM treatments WHERE UPPER(status) = 'CLOSED'
	`).Scan(&stats.ClosedTreatments).Error; err != nil {
		log.Debug("dashboard: closedTreatments error:", err)
	}

	total := stats.OpenTreatments + stats.ClosedTreatments
	if total > 0 {
		stats.TreatmentCompletion = float64(stats.ClosedTreatments) / float64(total) * 100
	}

	// ── Revenue ───────────────────────────────────────────────────────────────
	// Revenue collected this month
	if err := db.Raw(`
		SELECT COALESCE(SUM(payed), 0) FROM treatments
		WHERE start_date >= ?
	`, monthStart).Scan(&stats.RevenueThisMonth).Error; err != nil {
		log.Debug("dashboard: revenueThisMonth error:", err)
	}

	// Total revenue ever collected
	if err := db.Raw(`
		SELECT COALESCE(SUM(payed), 0) FROM treatments
	`).Scan(&stats.TotalRevenue).Error; err != nil {
		log.Debug("dashboard: totalRevenue error:", err)
	}

	// Total unpaid (total_cost - payed)
	if err := db.Raw(`
		SELECT COALESCE(SUM(total_cost - payed), 0) FROM treatments
		WHERE total_cost > payed
	`).Scan(&stats.TotalUnpaid).Error; err != nil {
		log.Debug("dashboard: totalUnpaid error:", err)
	}

	// ── Healers ───────────────────────────────────────────────────────────────
	if err := db.Raw(`
		SELECT COUNT(*) FROM healers
	`).Scan(&stats.TotalHealers).Error; err != nil {
		log.Debug("dashboard: totalHealers error:", err)
	}

	return c.JSON(stats)
}

package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

// RecurringScheduleRequest is the payload for creating recurring sessions.
// It embeds a base Schedule plus recurrence parameters.
type RecurringScheduleRequest struct {
	models.Schedule
	// RecurrenceType: "daily" | "weekly" | "biweekly" | "monthly"
	// (already on models.Schedule, but repeated here for clarity in docs)
	// RecurrenceInterval: total number of occurrences to create (including the first)
	// RecurrenceEndDate: optional — stop generating after this date even if interval not reached
}

// CreateRecurringSchedule creates multiple schedule occurrences based on a recurrence rule.
// POST /api/createRecurringSchedule
//
// Body: same as createSchedule, plus:
//   - recurrenceType:     "daily" | "weekly" | "biweekly" | "monthly"
//   - recurrenceInterval: number of occurrences (2–52)
//   - recurrenceEndDate:  optional ISO timestamp — hard stop date
func CreateRecurringSchedule(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	var req models.Schedule
	if err := c.Bind().Body(&req); err != nil {
		log.Debugf("CreateRecurringSchedule BodyParser error: %v, Body: %s", err, string(c.Body()))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing recurring schedule: " + err.Error()})
	}

	// Validate recurrence type
	validTypes := map[string]bool{"daily": true, "weekly": true, "biweekly": true, "monthly": true}
	if !validTypes[req.RecurrenceType] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "recurrenceType must be one of: daily, weekly, biweekly, monthly",
		})
	}

	// Validate interval: 2–52 occurrences
	if req.RecurrenceInterval < 2 || req.RecurrenceInterval > 52 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "recurrenceInterval must be between 2 and 52",
		})
	}

	// Determine the step duration between occurrences
	stepDays := recurrenceStepDays(req.RecurrenceType)

	// Compute session duration (end - start)
	sessionDuration := req.EndDate.Sub(req.StartDate)

	// Determine the color to start from (same logic as CreateSchedule)
	var colorInfo struct {
		BgColor string `gorm:"column:bg_color"`
	}
	db.Raw("SELECT bg_color FROM schedules WHERE ID = ( SELECT MAX(ID) FROM schedules)").Scan(&colorInfo)
	colorIndex := 0
	if colorInfo.BgColor != "" {
		for i, c := range models.SchedulesBgColors {
			if c == colorInfo.BgColor {
				colorIndex = (i + 1) % len(models.SchedulesBgColors)
				break
			}
		}
	}

	// Snapshot associations — we'll re-link them for every occurrence
	healers := req.Healers
	attendees := req.Attendees
	meditations := req.Meditations
	sicknessNatures := req.SicknessNatures

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// We'll assign a shared group ID after creating the first occurrence
	var groupID uint32
	createdSchedules := make([]models.Schedule, 0, req.RecurrenceInterval)

	baseStart := req.StartDate.UTC()
	baseEnd := req.EndDate.UTC()

	for i := 0; i < req.RecurrenceInterval; i++ {
		// Check hard stop date
		if req.RecurrenceEndDate != nil && baseStart.After(*req.RecurrenceEndDate) {
			break
		}

		occ := models.Schedule{
			CalendarID:         req.CalendarID,
			CenterID:           req.CenterID,
			StartDate:          baseStart,
			EndDate:            baseEnd,
			Title:              req.Title,
			Busy:               req.Busy,
			IsLocal:            req.IsLocal,
			Category:           req.Category,
			DueDateClass:       req.DueDateClass,
			BgColor:            models.SchedulesBgColors[colorIndex],
			Color:              req.Color,
			RecurrenceType:     req.RecurrenceType,
			RecurrenceInterval: req.RecurrenceInterval,
			RecurrenceEndDate:  req.RecurrenceEndDate,
			// RecurrenceGroupID will be set after first insert
		}

		// Advance color for next occurrence
		colorIndex = (colorIndex + 1) % len(models.SchedulesBgColors)

		// Create the base occurrence
		var createErr error
		if occ.CenterID <= 0 {
			createErr = tx.Model(&occ).Omit("center_id", "center").Create(&occ).Error
		} else {
			createErr = tx.Create(&occ).Error
		}
		if createErr != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error creating occurrence " + string(rune('0'+i)) + ": " + createErr.Error()})
		}

		// First occurrence sets the group ID
		if i == 0 {
			groupID = occ.ID
		}
		// Update group ID on the occurrence
		if err := tx.Model(&occ).Update("recurrence_group_id", groupID).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error setting group id: " + err.Error()})
		}
		occ.RecurrenceGroupID = groupID

		// Link healers
		for _, h := range healers {
			if h.ID > 0 {
				var existingHealer models.Healer
				if tx.Where("id = ?", h.ID).First(&existingHealer).Error == nil {
					tx.Model(&occ).Association("Healers").Append(&existingHealer)
				}
			}
		}

		// Link attendees
		for _, p := range attendees {
			if p.ID > 0 {
				var existingPerson models.Person
				if tx.Where("id = ?", p.ID).First(&existingPerson).Error == nil {
					tx.Model(&occ).Association("Attendees").Append(&existingPerson)
				}
			}
		}

		// Link meditations
		if len(meditations) > 0 {
			tx.Model(&occ).Association("Meditations").Replace(meditations)
		}

		// Link sickness natures
		if len(sicknessNatures) > 0 {
			tx.Model(&occ).Association("SicknessNatures").Replace(sicknessNatures)
		}

		createdSchedules = append(createdSchedules, occ)

		// Advance to next occurrence
		baseStart = advanceDate(baseStart, req.RecurrenceType, stepDays)
		baseEnd = baseStart.Add(sessionDuration)
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error committing recurring schedules: " + err.Error()})
	}

	// Return summary
	return c.JSON(fiber.Map{
		"created":         len(createdSchedules),
		"recurrenceGroup": groupID,
		"schedules":       createdSchedules,
	})
}

// recurrenceStepDays returns the number of days between occurrences for simple types.
// For "monthly" we return 0 and handle it separately in advanceDate.
func recurrenceStepDays(recurrenceType string) int {
	switch recurrenceType {
	case "daily":
		return 1
	case "weekly":
		return 7
	case "biweekly":
		return 14
	default:
		return 0 // monthly handled separately
	}
}

// advanceDate moves a date forward by one recurrence step.
func advanceDate(t time.Time, recurrenceType string, stepDays int) time.Time {
	if recurrenceType == "monthly" {
		return t.AddDate(0, 1, 0)
	}
	return t.AddDate(0, 0, stepDays)
}

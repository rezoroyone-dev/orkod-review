package handlers

import (
	"hash/fnv"
	"strconv"
	"strings"
	"time"

	"PranicServer/database"
	"PranicServer/models"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// CreateSchedule ....
func CreateSchedule(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var schedule models.Schedule

	if err := c.Bind().Body(&schedule); err != nil {
		log.Debugf("CreateSchedule BodyParser error: %v, Body: %s", err, string(c.Body()))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing schedule: " + err.Error()})
	}

	// Input validation
	if schedule.StartDate.IsZero() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "start_date is required"})
	}
	if schedule.EndDate.IsZero() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "end_date is required"})
	}
	if schedule.EndDate.Before(schedule.StartDate) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "end_date must be after start_date"})
	}

	// 0. Public Booking Restriction: Prevent multiple future bookings by same person (email/phone)
	if c.Locals("user") == nil {
		for _, p := range schedule.Attendees {
			if p.Email != "" || p.Phone != "" {
				var count int
				// Check if this person exists and has future schedules
				db.Raw(`
					SELECT count(*) 
					FROM schedules s 
					INNER JOIN persons_schedules ps ON s.id = ps.schedule_id 
					INNER JOIN persons p ON ps.person_id = p.id 
					WHERE (p.email = ? OR p.phone = ?) AND s.end_date > ?`,
					p.Email, p.Phone, time.Now()).Row().Scan(&count)

				if count > 0 {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Already_has_upcoming_booking",
					})
				}
			}
		}
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// setting schedule nice color
	var colorInfo struct {
		BgColor string `json:"bgColor"  gorm:"column:bg_color"`
	}
	tx.Raw("SELECT bg_color FROM schedules WHERE ID = ( SELECT MAX(ID) FROM schedules)").Scan(&colorInfo)
	if colorInfo.BgColor != "" {
		var colorIndex int = 0
		var numberOfColors int = len(models.SchedulesBgColors)
		for i := 0; i < numberOfColors; i++ {
			if models.SchedulesBgColors[i] == colorInfo.BgColor {
				colorIndex = (i + 1) % numberOfColors
				break
			}
		}
		schedule.BgColor = models.SchedulesBgColors[colorIndex]
	}

	// 1. Separate associations to avoid GORM auto-create/update issues
	healers := schedule.Healers
	attendees := schedule.Attendees
	schedule.Healers = nil
	schedule.Attendees = nil
	schedule.StartDate = schedule.StartDate.UTC()
	schedule.EndDate = schedule.EndDate.UTC()

	// 2. Create the base schedule
	if schedule.CenterID <= 0 {
		if err := tx.Model(&schedule).Omit("center_id", "center").Create(&schedule).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing schedule: " + err.Error()})
		}
	} else {
		if err := tx.Create(&schedule).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing schedule: " + err.Error()})
		}
	}

	// 3. Handle Healers (Only link existing ones)
	if len(healers) > 0 {
		for _, h := range healers {
			if h.ID > 0 {
				var existingHealer models.Healer
				if tx.Where("id = ?", h.ID).First(&existingHealer).Error == nil {
					tx.Model(&schedule).Association("Healers").Append(&existingHealer)
				}
			}
		}
	}

	// 4. Handle Attendees (Create if new, link if existing)
	if len(attendees) > 0 {
		for _, p := range attendees {
			if p.ID > 0 {
				var existingPerson models.Person
				if tx.Where("id = ?", p.ID).First(&existingPerson).Error == nil {
					tx.Model(&schedule).Association("Attendees").Append(&existingPerson)
				}
			} else {
				// New person from public booking
				if err := tx.Create(&p).Error; err == nil {
					tx.Model(&schedule).Association("Attendees").Append(&p)
				}
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error committing schedule: " + err.Error()})
	}

	// Preload everything for the response
	db.Preload("Healers.Person").Preload("Attendees").First(&schedule, schedule.ID)
	return c.JSON(schedule)
}

// GetSchedules .....
func GetSchedules(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var err error
	var dateInfo struct {
		Start time.Time `json:"start"`
		End   time.Time `json:"end"`
	}
	if err = c.Bind().Body(&dateInfo); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing schedule date info: " + err.Error()})
	}
	var schedules []models.Schedule

	schedules, err = GetSchedulesByRange(db, dateInfo.Start, dateInfo.End)

	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(schedules)
}

// GetSchedulesByRange returns the schedules for a specific range
func GetSchedulesByRange(db *gorm.DB, startDate time.Time, endDate time.Time) ([]models.Schedule, error) {
	var err error = nil
	var schedules []models.Schedule

	err = db.Preload("Healers.Person").Preload("Attendees").Preload("Meditations").Preload("Center").Preload("SicknessNatures").Where("start_date >= ? AND end_date <= ?", startDate, endDate).Find(&schedules).Error
	if err != nil {
		return schedules, err
	}
	return schedules, err
}

// GetFutureSchedules .....
func GetFutureSchedules(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var dateInfo struct {
		PersonID uint32    `json:"personID"`
		Start    time.Time `json:"start"`
		End      time.Time `json:"end"`
	}
	if err := c.Bind().Body(&dateInfo); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing schedule date info: " + err.Error()})
	}

	var schedules []models.Schedule
	err := db.Preload("Healers.Person").Raw("SELECT * from schedules WHERE id in (SELECT schedule_id FROM persons_schedules WHERE person_id = ?) AND (start_date >= ? AND end_date <= ?)", dateInfo.PersonID, dateInfo.Start, dateInfo.End).Find(&schedules).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		return c.JSON(schedules)
	}
}

// GetSchedulesByPersonID .....
func GetSchedulesByPersonID(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var userInfo struct {
		PersonID uint32 `json:"personID"`
	}
	if err := c.Bind().Body(&userInfo); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing schedule personID: " + err.Error()})
	}

	var schedules []models.Schedule
	if err := db.Preload("Healers.Person").Joins("JOIN persons_schedules ON persons_schedules.schedule_id = schedules.id").Where("persons_schedules.person_id = ?", userInfo.PersonID).Find(&schedules).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		return c.JSON(schedules)
	}
}

// GetSchedule .....
func GetSchedule(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	if len(strID) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id value is empty"})
	}
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing id: " + err.Error()})
	}

	var schedule models.Schedule
	if err := db.Preload("Healers.Person").Preload("Attendees").Preload("Meditations").Preload("Center").Preload("SicknessNatures").Where("id = ?", id).First(&schedule).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(schedule)
}

// DeleteSchedule delets a schedule given its id
func DeleteSchedule(c fiber.Ctx) error {
	var strID = c.Params("id")
	if len(strID) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id value is empty"})
	}

	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing string id value to uint32" + err.Error()})
	}

	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var schedule models.Schedule
	if err := tx.Where("id = ?", id).First(&schedule).Error; err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	// Clear associations
	if err := tx.Model(&schedule).Association("Healers").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Model(&schedule).Association("Attendees").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Model(&schedule).Association("Meditations").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Model(&schedule).Association("SicknessNatures").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tx.Delete(&schedule).Error; err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	tx.Commit()
	return c.JSON(id)

}

// UpdateSchedule ... updates a schedule
func UpdateSchedule(c fiber.Ctx) error {
	var err error
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var schedule models.Schedule

	if err = c.Bind().Body(&schedule); err != nil {
		log.Debugf("UpdateSchedule BodyParser error: %v, Body: %s", err, string(c.Body()))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing schedule: " + err.Error()})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err = tx.Error; err != nil {
		log.Debug("Error starting transaction: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error: " + err.Error()})
	}

	var dbSchedule models.Schedule
	if err = tx.Where("id = ?", schedule.ID).First(&dbSchedule).Error; err != nil {
		tx.Rollback()
		log.Debug("Error finding schedule in Database: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error finding schedule in Database: " + err.Error()})
	}

	// Update many-to-many associations - lookup existing records by ID to avoid duplicates
	// Healers
	var existingHealers []models.Healer
	for _, h := range schedule.Healers {
		if h.ID > 0 {
			var existingHealer models.Healer
			if tx.Where("id = ?", h.ID).First(&existingHealer).Error == nil {
				existingHealers = append(existingHealers, existingHealer)
			}
		}
	}
	if err = tx.Model(&dbSchedule).Association("Healers").Replace(existingHealers); err != nil {
		tx.Rollback()
		log.Debug("Error updating healers: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating healers: " + err.Error()})
	}

	// Attendees
	var existingAttendees []models.Person
	for _, a := range schedule.Attendees {
		if a.ID > 0 {
			var existingPerson models.Person
			if tx.Where("id = ?", a.ID).First(&existingPerson).Error == nil {
				existingAttendees = append(existingAttendees, existingPerson)
			}
		}
	}
	if err = tx.Model(&dbSchedule).Association("Attendees").Replace(existingAttendees); err != nil {
		tx.Rollback()
		log.Debug("Error updating attendees: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating attendees: " + err.Error()})
	}

	// Meditations - these should have IDs if they exist
	if err = tx.Model(&dbSchedule).Association("Meditations").Replace(schedule.Meditations); err != nil {
		tx.Rollback()
		log.Debug("Error updating meditations: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating meditations: " + err.Error()})
	}

	// SicknessNatures - these should have IDs if they exist
	if err = tx.Model(&dbSchedule).Association("SicknessNatures").Replace(schedule.SicknessNatures); err != nil {
		tx.Rollback()
		log.Debug("Error updating sickness natures: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error updating sickness natures: " + err.Error()})
	}

	// Update the main schedule fields from the request
	// Use a map to ensure all fields (including zero values) are correctly updated
	updates := map[string]interface{}{
		"start_date":     schedule.StartDate.UTC(),
		"end_date":       schedule.EndDate.UTC(),
		"title":          schedule.Title,
		"is_local":       schedule.IsLocal,
		"busy":           schedule.Busy,
		"category":       schedule.Category,
		"calendar_id":    schedule.CalendarID,
		"bg_color":       schedule.BgColor,
		"color":          schedule.Color,
		"due_date_class": schedule.DueDateClass,
	}

	if schedule.CenterID <= 0 {
		updates["center_id"] = -1
	} else {
		updates["center_id"] = schedule.CenterID
	}

	if err = tx.Model(&dbSchedule).Updates(updates).Error; err != nil {
		tx.Rollback()
		log.Debug("Error saving schedule updates: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error saving schedule updates: " + err.Error()})
	}

	if err = tx.Commit().Error; err != nil {
		tx.Rollback()
		log.Debug("Error committing transaction: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error committing transaction: " + err.Error()})
	}

	// Preload associations for the response using the main DB connection
	db.Preload("Healers.Person").Preload("Attendees").Preload("Meditations").Preload("SicknessNatures").Preload("Center").First(&dbSchedule, dbSchedule.ID)

	return c.JSON(dbSchedule)
}

// fnv1a64 hashes s with the 64-bit FNV-1a algorithm. It derives stable,
// collision-resistant keys for the Postgres advisory locks that serialize
// bookings for the same provider or booking identity.
func fnv1a64(s string) uint64 {
	h := fnv.New64a()
	_, _ = h.Write([]byte(s))
	return h.Sum64()
}

// validScheduleStatus reports whether status is a sanctioned booking lifecycle
// state. The comparison is case-sensitive; empty and unknown values fail.
func validScheduleStatus(status string) bool {
	switch status {
	case models.ScheduleStatusPending,
		models.ScheduleStatusConfirmed,
		models.ScheduleStatusCompleted,
		models.ScheduleStatusCancelled:
		return true
	default:
		return false
	}
}

// healerRecordName resolves a healer's display name, preferring the related
// Person record and falling back to the virtual FirstName/LastName mirrors.
func healerRecordName(h models.Healer) string {
	first, last := h.Person.FirstName, h.Person.LastName
	if first == "" && last == "" {
		first, last = h.FirstName, h.LastName
	}
	return strings.TrimSpace(strings.Join([]string{first, last}, " "))
}

// PublicBookingSummary is the PII-free projection of a booking returned to the
// anonymous public site. It deliberately omits attendees and any contact data.
type PublicBookingSummary struct {
	ID          uint32    `json:"id"`
	Title       string    `json:"title"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	BgColor     string    `json:"bgColor"`
	HealerNames []string  `json:"healerNames"`
	CenterName  string    `json:"centerName"`
	Status      string    `json:"status"`
}

// buildPublicBookingSummary builds the privacy-safe booking payload from a
// schedule. It never copies attendee or contact fields, and it mirrors the
// schedule's real status so a missing status can never fabricate "confirmed".
func buildPublicBookingSummary(_ *gorm.DB, schedule *models.Schedule) PublicBookingSummary {
	names := make([]string, 0, len(schedule.Healers))
	for _, h := range schedule.Healers {
		if name := healerRecordName(h); name != "" {
			names = append(names, name)
		}
	}
	return PublicBookingSummary{
		ID:          schedule.ID,
		Title:       schedule.Title,
		StartDate:   schedule.StartDate,
		EndDate:     schedule.EndDate,
		BgColor:     schedule.BgColor,
		HealerNames: names,
		CenterName:  schedule.Center.Name,
		Status:      schedule.Status,
	}
}

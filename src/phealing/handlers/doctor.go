package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"errors"
	"math"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// PublicDoctor is the safe projection of a Doctor for anonymous visitors.
// It deliberately excludes: email, phone, address, birthDate, folderNumber,
// licenseNumber and personID.
type PublicDoctor struct {
	ID              uint32  `json:"id"`
	Title           string  `json:"title"`
	FirstName       string  `json:"firstName"`
	LastName        string  `json:"lastName"`
	Specialty       string  `json:"specialty"`
	City            string  `json:"city"`
	About           string  `json:"about"`
	Certifications  string  `json:"certifications"`
	YearsExperience int     `json:"yearsExperience"`
	WorkingHours    string  `json:"workingHours"`
	PhotoURL        string  `json:"photoUrl"`
	Verified        bool    `json:"verified"`
	IsAcceptingNew  bool    `json:"isAcceptingNew"`
	RatingAvg       float64 `json:"ratingAvg,omitempty"`
	RatingCount     int     `json:"ratingCount"`
}

// publicDoctorFromModel builds the safe public projection from a Doctor entity.
// Kept as a standalone function so it can be unit-tested without a database.
func publicDoctorFromModel(d *models.Doctor) PublicDoctor {
	p := PublicDoctor{
		ID:              d.ID,
		Title:           strings.TrimSpace(d.Title),
		Specialty:       strings.TrimSpace(d.Specialty),
		About:           strings.TrimSpace(d.About),
		Certifications:  strings.TrimSpace(d.Certifications),
		YearsExperience: d.YearsExperience,
		WorkingHours:    strings.TrimSpace(d.WorkingHours),
		PhotoURL:        strings.TrimSpace(d.PhotoURL),
		Verified:        d.IsVerified,
		IsAcceptingNew:  d.IsAcceptingNew,
	}
	if d.Person.ID > 0 {
		p.FirstName = strings.TrimSpace(d.Person.FirstName)
		p.LastName = strings.TrimSpace(d.Person.LastName)
		p.City = strings.TrimSpace(d.Person.City)
	}
	return p
}

// doctorDisplayName returns "Title FirstName LastName" for a doctor.
func doctorDisplayName(d *models.Doctor) string {
	name := strings.TrimSpace(strings.Join([]string{d.Person.FirstName, d.Person.LastName}, " "))
	if name == "" {
		name = "Doctor"
	}
	if d.Title != "" {
		return d.Title + " " + name
	}
	return name
}

// ratingAggregate is the per-doctor review aggregate for public listings.
type ratingAggregate struct {
	TargetID uint32
	Avg      float64
	Count    int
}

// attachDoctorRatings fills RatingAvg/RatingCount from the approved reviews table.
func attachDoctorRatings(db *gorm.DB, payload []PublicDoctor) error {
	if len(payload) == 0 {
		return nil
	}
	ids := make([]uint32, len(payload))
	for i, p := range payload {
		ids[i] = p.ID
	}
	var rows []struct {
		TargetID uint32  `gorm:"column:target_id"`
		Avg      float64 `gorm:"column:avg_rating"`
		Count    int     `gorm:"column:rating_count"`
	}
	if err := db.Table("reviews").
		Select("target_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count").
		Where("target_type = ? AND target_id IN ? AND is_approved = ?", models.ReviewTargetDoctor, ids, true).
		Group("target_id").
		Scan(&rows).Error; err != nil {
		return err
	}
	byID := make(map[uint32]ratingAggregate, len(rows))
	for _, r := range rows {
		byID[r.TargetID] = ratingAggregate{TargetID: r.TargetID, Avg: r.Avg, Count: r.Count}
	}
	for i := range payload {
		if agg, ok := byID[payload[i].ID]; ok {
			payload[i].RatingAvg = math.Round(agg.Avg*10) / 10
			payload[i].RatingCount = agg.Count
		}
	}
	return nil
}

// GetPublicDoctors returns the public doctor directory (safe projection).
func GetPublicDoctors(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	// Optional ?specialty= filter is intentionally ignored on the wire for now;
	// the full directory is small and the frontend filters client-side.

	var doctors []models.Doctor
	// Ordering needs the joined person name columns (doctors has no name fields).
	if err := db.Preload("Person").
		Joins("JOIN persons ON persons.id = doctors.person_id").
		Select("doctors.*").
		Where("doctors.is_active = ?", true).
		Order("persons.last_name, persons.first_name").
		Find(&doctors).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load doctors"})
	}

	payload := make([]PublicDoctor, 0, len(doctors))
	for i := range doctors {
		payload = append(payload, publicDoctorFromModel(&doctors[i]))
	}
	if err := attachDoctorRatings(db, payload); err != nil {
		log.Debug(err)
	}

	return c.JSON(payload)
}

// GetPublicDoctor returns a single doctor profile (safe projection).
func GetPublicDoctor(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil || id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid doctor id"})
	}

	var doctor models.Doctor
	if err := db.Preload("Person").Where("id = ? AND is_active = ?", uint32(id), true).First(&doctor).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "doctor not found"})
		}
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load doctor"})
	}

	payload := publicDoctorFromModel(&doctor)
	var agg ratingAggregate
	db.Table("reviews").
		Select("AVG(rating) AS avg_rating, COUNT(*) AS rating_count").
		Where("target_type = ? AND target_id = ? AND is_approved = ?", models.ReviewTargetDoctor, doctor.ID, true).
		Scan(&agg)
	payload.RatingAvg = math.Round(agg.Avg*10) / 10
	payload.RatingCount = agg.Count

	return c.JSON(payload)
}

// adminDoctor is the internal representation used for admin CRUD (includes
// private fields like license number and contact details).
type adminDoctor struct {
	ID              uint32 `json:"id" gorm:"column:id"`
	PersonID        uint32 `json:"personID" gorm:"column:person_id"`
	FirstName       string `json:"firstName" gorm:"column:first_name"`
	LastName        string `json:"lastName" gorm:"column:last_name"`
	Phone           string `json:"phone" gorm:"column:phone"`
	Email           string `json:"email" gorm:"column:email"`
	Title           string `json:"title" gorm:"column:title"`
	Specialty       string `json:"specialty" gorm:"column:specialty"`
	About           string `json:"about" gorm:"column:about"`
	Certifications  string `json:"certifications" gorm:"column:certifications"`
	YearsExperience int    `json:"yearsExperience" gorm:"column:years_experience"`
	LicenseNumber   string `json:"licenseNumber" gorm:"column:license_number"`
	PhotoURL        string `json:"photoUrl" gorm:"column:photo_url"`
	WorkingHours    string `json:"workingHours" gorm:"column:working_hours"`
	IsAcceptingNew  bool   `json:"isAcceptingNew" gorm:"column:is_accepting_new"`
	IsVerified      bool   `json:"verified" gorm:"column:is_verified"`
	IsActive        bool   `json:"isActive" gorm:"column:is_active"`
}

var adminDoctorSelect = `
	doctors.id, doctors.person_id,
	persons.first_name, persons.last_name, persons.phone, persons.email,
	doctors.title, doctors.specialty, doctors.about, doctors.certifications,
	doctors.years_experience, doctors.license_number, doctors.photo_url,
	doctors.working_hours, doctors.is_accepting_new, doctors.is_verified, doctors.is_active`

const adminDoctorJoin = "INNER JOIN persons ON persons.id = doctors.person_id"

// GetAllDoctors returns all doctors (including inactive) for admin management.
func GetAllDoctors(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	page := fiber.Query[int](c, "page", 1)
	limit := fiber.Query[int](c, "limit", 200)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 200
	}
	offset := (page - 1) * limit

	var total int64
	db.Table("doctors").Joins(adminDoctorJoin).Count(&total)

	var results []adminDoctor
	err := db.Table("doctors").Select(adminDoctorSelect).Joins(adminDoctorJoin).
		Order("doctors.id DESC").Limit(limit).Offset(offset).Scan(&results).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": results, "total": total, "page": page, "limit": limit})
}

// validateDoctorInput performs input validation for create/update.
func validateDoctorInput(specialty string, yearsExperience int) string {
	if strings.TrimSpace(specialty) == "" {
		return "specialty is required"
	}
	if yearsExperience < 0 || yearsExperience > 80 {
		return "yearsExperience must be between 0 and 80"
	}
	return ""
}

// CreateDoctor creates a new doctor profile linked to an existing person.
// Guards: the person must exist, must not already be a doctor.
func CreateDoctor(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	var doctor models.Doctor
	if err := c.Bind().Body(&doctor); err != nil {
		log.Debugf("CreateDoctor BodyParser error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing doctor information: " + err.Error()})
	}

	if doctor.PersonID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "personID is required"})
	}
	if msg := validateDoctorInput(doctor.Specialty, doctor.YearsExperience); msg != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": msg})
	}

	var person models.Person
	if err := db.First(&person, doctor.PersonID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "person not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var existing models.Doctor
	if err := db.Where("person_id = ?", doctor.PersonID).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "a doctor profile already exists for this person"})
	}

	if err := db.Create(&doctor).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: storing doctor data in Database:" + err.Error()})
	}

	var result adminDoctor
	if err := db.Table("doctors").Select(adminDoctorSelect).Joins(adminDoctorJoin).Where("doctors.id = ?", doctor.ID).Scan(&result).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

// UpdateDoctor selectively updates a doctor profile.
func UpdateDoctor(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil || id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid doctor id"})
	}

	var doctor models.Doctor
	if err := db.First(&doctor, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "doctor not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var updateData models.Doctor
	if err := c.Bind().Body(&updateData); err != nil {
		log.Debugf("UpdateDoctor BodyParser error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing doctor information: " + err.Error()})
	}

	if updateData.Specialty != "" {
		if msg := validateDoctorInput(updateData.Specialty, updateData.YearsExperience); msg != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": msg})
		}
	}

	updates := map[string]interface{}{
		"title":            updateData.Title,
		"specialty":        updateData.Specialty,
		"about":            updateData.About,
		"certifications":   updateData.Certifications,
		"years_experience": updateData.YearsExperience,
		"license_number":   updateData.LicenseNumber,
		"photo_url":        updateData.PhotoURL,
		"working_hours":    updateData.WorkingHours,
		"is_accepting_new": updateData.IsAcceptingNew,
		"is_verified":      updateData.IsVerified,
		"is_active":        updateData.IsActive,
	}
	if err := db.Model(&doctor).Updates(updates).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var result adminDoctor
	if err := db.Table("doctors").Select(adminDoctorSelect).Joins(adminDoctorJoin).Where("doctors.id = ?", doctor.ID).Scan(&result).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

// DeleteDoctor removes a doctor profile and its reviews.
func DeleteDoctor(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil || id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid doctor id"})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var doctor models.Doctor
	if err := tx.First(&doctor, id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "doctor not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Remove associated reviews first to avoid orphans.
	if err := tx.Where("target_type = ? AND target_id = ?", models.ReviewTargetDoctor, doctor.ID).Delete(&models.Review{}).Error; err != nil {
		tx.Rollback()
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Delete(&doctor).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"id": id, "status": "deleted"})
}

// doctorNameForTarget resolves a display name for a review target.
func doctorNameForTarget(db *gorm.DB, id uint32) (string, error) {
	var doctor models.Doctor
	if err := db.Preload("Person").First(&doctor, id).Error; err != nil {
		return "", err
	}
	return doctorDisplayName(&doctor), nil
}

// ErrTargetNotFound is returned when a review target does not exist.
var ErrTargetNotFound = errors.New("review target not found")

// formatDoctorName is used by review handlers to build display names.
func formatDoctorName(d *models.Doctor) string { return doctorDisplayName(d) }
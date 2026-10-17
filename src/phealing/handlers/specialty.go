package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"fmt"
	"log"
	"math/rand/v2"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// Specialty booking error codes surfaced to the frontend.
const (
	errCodeSpecialtyRequired  = "Specialty_required"
	errCodeNoHealersAvailable = "No_healers_available"
	errCodeInvalidDateRange   = "Invalid_date_range"
)

// healerNameRow is a lightweight projection of a healer's display name.
type healerNameRow struct {
	HealerID  uint32 `gorm:"column:healer_id"`
	FirstName string `gorm:"column:first_name"`
	LastName  string `gorm:"column:last_name"`
}

// sortedHealerIDs returns the candidate healer ids (deduplicated, ascending).
func sortedHealerIDs(ids []uint32) []uint32 {
	seen := make(map[uint32]bool, len(ids))
	out := make([]uint32, 0, len(ids))
	for _, id := range ids {
		if id != 0 && !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

// slotStartsForWindow returns every slot start time (in loc) of slotMinutes
// length that fits inside the [ws, we) availability window on the given day.
func slotStartsForWindow(day time.Time, ws, we string, slotMinutes int) []time.Time {
	wsH, wsM, wsOK := parseHHMM(ws)
	weH, weM, weOK := parseHHMM(we)
	if !wsOK || !weOK {
		return nil
	}
	loc := day.Location()
	start := time.Date(day.Year(), day.Month(), day.Day(), wsH, wsM, 0, 0, loc)
	end := time.Date(day.Year(), day.Month(), day.Day(), weH, weM, 0, 0, loc)
	if !end.After(start) {
		return nil
	}
	step := time.Duration(slotMinutes) * time.Minute
	var out []time.Time
	for t := start; t.Add(step).Before(end) || t.Add(step).Equal(end); t = t.Add(step) {
		out = append(out, t)
	}
	return out
}

// timeWindowCovers reports whether the slot [start, end) fits entirely inside a
// single availability window expressed as "HH:mm" bounds.
func timeWindowCovers(ws, we string, start, end time.Time) bool {
	if !end.After(start) {
		return false
	}
	loc := start.Location()
	ss := fmt.Sprintf("%02d:%02d", start.In(loc).Hour(), start.In(loc).Minute())
	se := fmt.Sprintf("%02d:%02d", end.In(loc).Hour(), end.In(loc).Minute())
	wns, ok := normalizeHHMM(ws)
	if !ok {
		return false
	}
	wne, ok := normalizeHHMM(we)
	if !ok {
		return false
	}
	if wne <= wns {
		return false
	}
	return ss >= wns && se <= wne
}

// busySegments holds a healer's existing (non-cancelled) schedule intervals.
type busySegment struct {
	HealerID uint32
	Start    time.Time
	End      time.Time
}

func busyOverlaps(segments []busySegment, healerID uint32, start, end time.Time) bool {
	for _, s := range segments {
		if s.HealerID != healerID {
			continue
		}
		if schedulesOverlap(s.Start, s.End, start, end) {
			return true
		}
	}
	return false
}

// healerSessionCount returns how many non-cancelled sessions a healer has ever
// been attached to. This is the "workload" used for fair assignment.
func healerSessionCount(tx *gorm.DB, healerID uint32) (int64, error) {
	var count int64
	if err := tx.Model(&models.Schedule{}).
		Joins("JOIN schedules_healers sh ON sh.schedule_id = schedules.id").
		Where("sh.healer_id = ? AND schedules.status <> ?", healerID, models.ScheduleStatusCancelled).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// pickFairest chooses the healer with the fewest completed sessions. Ties are
// broken randomly so no single lower-workload healer is always chosen. r is
// injected for deterministic tests.
func pickFairest(sessionCounts map[uint32]int64, r *rand.Rand) uint32 {
	if len(sessionCounts) == 0 {
		return 0
	}
	var minCount int64 = -1
	for _, v := range sessionCounts {
		if minCount < 0 || v < minCount {
			minCount = v
		}
	}
	bucket := make([]uint32, 0, len(sessionCounts))
	for id, v := range sessionCounts {
		if v == minCount {
			bucket = append(bucket, id)
		}
	}
	if len(bucket) == 1 {
		return bucket[0]
	}
	return bucket[r.IntN(len(bucket))]
}

// candidateHealersForSlot returns the healers with the given specialty who can
// take the requested slot right now (active window + no overlap). The slot start
// must be strictly in the future. Called from within a booking transaction so a
// concurrent booking cannot slip through the per-healer advisory locks.
func candidateHealersForSlot(tx *gorm.DB, specialty string, start, end time.Time) ([]uint32, error) {
	if start.Location() == nil {
		return nil, vErr(errCodeInvalidBookingTimes)
	}
	loc := start.Location()
	weekday := int(start.In(loc).Weekday())

	var ids []uint32
	if err := tx.Model(&models.HealerSpecialty{}).
		Where("specialty = ?", specialty).
		Pluck("healer_id", &ids).Error; err != nil {
		return nil, err
	}
	ids = sortedHealerIDs(ids)
	if len(ids) == 0 {
		return nil, nil
	}

	var windows []models.HealerAvailability
	if err := tx.Where("healer_id IN ? AND is_active = ?", ids, true).
		Find(&windows).Error; err != nil {
		return nil, err
	}

	var busy []busySegment
	if err := tx.Raw(`
		SELECT sh.healer_id, s.start_date AS start, s.end_date AS end
		FROM schedules_healers sh
		JOIN schedules s ON s.id = sh.schedule_id
		WHERE sh.healer_id IN ? AND s.status <> ?
	 	AND s.start_date < ? AND s.end_date > ?`,
		ids, models.ScheduleStatusCancelled, end, start).Scan(&busy).Error; err != nil {
		return nil, err
	}

	eligible := make([]uint32, 0, len(ids))
	for _, healerID := range ids {
		dayCovered := false
		for _, w := range windows {
			if w.HealerID != healerID || w.DayOfWeek != weekday {
				continue
			}
			if timeWindowCovers(w.StartTime, w.EndTime, start, end) {
				dayCovered = true
				break
			}
		}
		if !dayCovered {
			continue
		}
		if busyOverlaps(busy, healerID, start, end) {
			continue
		}
		eligible = append(eligible, healerID)
	}
	return eligible, nil
}

// healerNameByID builds a display-name map for the given healer ids.
func healerNameByID(tx *gorm.DB, ids []uint32) (map[uint32]string, error) {
	names := make(map[uint32]string, len(ids))
	if len(ids) == 0 {
		return names, nil
	}
	var rows []healerNameRow
	if err := tx.Raw(`
		SELECT healers.id AS healer_id, persons.first_name, persons.last_name
		FROM healers
		JOIN persons ON persons.id = healers.person_id
		WHERE healers.id IN ?`, sortedHealerIDs(ids)).Scan(&rows).Error; err != nil {
		return names, err
	}
	for _, r := range rows {
		names[r.HealerID] = strings.TrimSpace(strings.Join([]string{r.FirstName, r.LastName}, " "))
	}
	return names, nil
}

// GetHealerSpecialties returns the admin-assigned healing areas of a healer.
func GetHealerSpecialties(c fiber.Ctx) error {
	db := database.GetDB(c)
	healerID := parseUint(c.Params("healerID"))
	if healerID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid healer id"})
	}
	var rows []string
	if err := db.Model(&models.HealerSpecialty{}).
		Where("healer_id = ?", healerID).
		Pluck("specialty", &rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(rows)
}

// SaveHealerSpecialties replaces the healing areas assigned to a healer.
func SaveHealerSpecialties(c fiber.Ctx) error {
	db := database.GetDB(c)
	healerID := parseUint(c.Params("healerID"))
	if healerID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid healer id"})
	}
	var req struct {
		Specialties []string `json:"specialties"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing specialties: " + err.Error()})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if err := tx.Where("healer_id = ?", healerID).Delete(&models.HealerSpecialty{}).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	kept := make([]string, 0, len(req.Specialties))
	for _, s := range req.Specialties {
		s = strings.TrimSpace(strings.ToLower(s))
		if s == "" {
			continue
		}
		if err := tx.Create(&models.HealerSpecialty{HealerID: uint32(healerID), Specialty: s}).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		kept = append(kept, s)
	}
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(kept)
}

// publicSpecialty is a specialty with the number of healers who can currently
// take bookings for it.
type publicSpecialty struct {
	Specialty   string `json:"specialty"`
	HealerCount int64  `json:"healerCount"`
}

// GetPublicSpecialties lists specialties that have at least one healer with an
// active availability window assigned to them.
func GetPublicSpecialties(c fiber.Ctx) error {
	db := database.GetDB(c)
	var rows []publicSpecialty
	if err := db.Raw(`
		SELECT hs.specialty AS specialty, COUNT(DISTINCT hs.healer_id) AS healer_count
		FROM healer_specialties hs
		JOIN healer_availabilities ha ON ha.healer_id = hs.healer_id AND ha.is_active = true
		GROUP BY hs.specialty
		ORDER BY hs.specialty`).Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(rows)
}

// publicSlotHealer is a healer available for a specific slot.
type publicSlotHealer struct {
	ID   uint32 `json:"id"`
	Name string `json:"name"`
}

// publicSlot is a free one-hour slot with the healers who can take it.
type publicSlot struct {
	Start   string             `json:"start"`
	End     string             `json:"end"`
	Healers []publicSlotHealer `json:"healers"`
}

// GetPublicSlots returns every free one-hour slot on the requested date for the
// requested specialty. tzOffset (minutes east of UTC) lets the server generate
// wall-clock slots matching the visitor's timezone without trusting free-form
// timezone data.
func GetPublicSlots(c fiber.Ctx) error {
	db := database.GetDB(c)
	specialty := strings.TrimSpace(strings.ToLower(c.Query("specialty")))
	if specialty == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeSpecialtyRequired})
	}
	date, err := time.Parse("2006-01-02", c.Query("date"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeInvalidDateRange})
	}
	tzOffset := 0
	if v := strings.TrimSpace(c.Query("tzOffset")); v != "" {
		tzOffset, err = strconv.Atoi(v)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeInvalidDateRange})
		}
	}
	loc := time.FixedZone("visitor", tzOffset)

	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
	if dayStart.IsZero() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeInvalidDateRange})
	}
	dayEnd := dayStart.AddDate(0, 0, 1)
	now := time.Now().In(loc)

	var ids []uint32
	if err := db.Model(&models.HealerSpecialty{}).
		Where("specialty = ?", specialty).
		Pluck("healer_id", &ids).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	ids = sortedHealerIDs(ids)

	names, err := healerNameByID(db, ids)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var windows []models.HealerAvailability
	if len(ids) > 0 {
		if err := db.Where("healer_id IN ? AND is_active = ? AND day_of_week = ?",
			ids, true, int(dayStart.Weekday())).Find(&windows).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	var busy []busySegment
	if len(ids) > 0 {
		if err := db.Raw(`
			SELECT sh.healer_id, s.start_date AS start, s.end_date AS end
			FROM schedules_healers sh
			JOIN schedules s ON s.id = sh.schedule_id
			WHERE sh.healer_id IN ? AND s.status <> ?
			AND s.start_date < ? AND s.end_date > ?`,
			ids, models.ScheduleStatusCancelled, dayEnd, dayStart).Scan(&busy).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	const slotLen = time.Hour
	slotMap := make(map[time.Time][]publicSlotHealer)
	for _, w := range windows {
		for _, t := range slotStartsForWindow(dayStart, w.StartTime, w.EndTime, 60) {
			slotEnd := t.Add(slotLen)
			if !t.After(now) {
				continue
			}
			if busyOverlaps(busy, w.HealerID, t, slotEnd) {
				continue
			}
			name := names[w.HealerID]
			if name == "" {
				name = "Healer"
			}
			slotMap[t] = append(slotMap[t], publicSlotHealer{ID: w.HealerID, Name: name})
		}
	}

	keys := make([]time.Time, 0, len(slotMap))
	for t := range slotMap {
		keys = append(keys, t)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i].Before(keys[j]) })

	slots := make([]publicSlot, 0, len(keys))
	for _, t := range keys {
		slots = append(slots, publicSlot{
			Start:   t.Format(time.RFC3339),
			End:     t.Add(slotLen).Format(time.RFC3339),
			Healers: slotMap[t],
		})
	}

	return c.JSON(fiber.Map{
		"specialty": specialty,
		"date":      date.Format("2006-01-02"),
		"slots":     slots,
	})
}

// specialtyBookingRequest is the anonymous booking payload that selects a
// specialty instead of a specific healer.
type specialtyBookingRequest struct {
	Specialty string          `json:"specialty"`
	Title     string          `json:"title"`
	Start     time.Time       `json:"start"`
	End       time.Time       `json:"end"`
	Attendees []models.Person `json:"attendees"`
	Consent   bool            `json:"consent"`
}

// BookSpecialtySession books a one-hour healing session for a specialty. The
// server picks the healer with the fewest prior sessions among everyone who can
// take the slot; equal workloads are resolved randomly so no healer is
// over-selected.
func BookSpecialtySession(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var req specialtyBookingRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing request: " + err.Error()})
	}
	req.Specialty = strings.TrimSpace(strings.ToLower(req.Specialty))
	if req.Specialty == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeSpecialtyRequired})
	}

	if err := validateBookingTimes(req.Start, req.End, time.Now()); err != nil {
		code := err.Error()
		status := fiber.StatusBadRequest
		if ve, ok := err.(*validationError); ok {
			code = ve.code
		}
		return c.Status(status).JSON(fiber.Map{"error": code})
	}
	if req.End.Sub(req.Start) != time.Hour {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeInvalidBookingTimes})
	}

	hasPhone := false
	for _, p := range req.Attendees {
		if strings.TrimSpace(p.Phone) != "" {
			hasPhone = true
			break
		}
	}
	if !hasPhone {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeContactRequired})
	}
	if !req.Consent {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": errCodeConsentRequired})
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if identity := bookingIdentity(req.Attendees); identity != "" {
		lockKey := int64(fnv1a64(identity))
		if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", lockKey).Error; err != nil {
			log.Printf("specialty booking lock error: %v", err)
		}
	}

	for _, p := range req.Attendees {
		if p.Email != "" || p.Phone != "" {
			var count int
			tx.Raw(`
				SELECT count(*)
				FROM schedules s
				INNER JOIN persons_schedules ps ON s.id = ps.schedule_id
				INNER JOIN persons p ON ps.person_id = p.id
				WHERE (p.email = ? OR p.phone = ?) AND s.end_date > ? AND s.status <> ?`,
				p.Email, p.Phone, time.Now(), models.ScheduleStatusCancelled).Row().Scan(&count)
			if count > 0 {
				tx.Rollback()
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Already_has_upcoming_booking"})
			}
		}
	}

	candidates, err := candidateHealersForSlot(tx, req.Specialty, req.Start, req.End)
	if err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if len(candidates) == 0 {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": errCodeNoHealersAvailable})
	}

	counts := make(map[uint32]int64, len(candidates))
	free := make([]uint32, 0, len(candidates))
	for _, healerID := range candidates {
		if err := validateHealerSlot(tx, healerID, req.Start, req.End); err != nil {
			continue // someone else grabbed it or window changed; skip
		}
		n, err := healerSessionCount(tx, healerID)
		if err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		counts[healerID] = n
		free = append(free, healerID)
	}
	if len(free) == 0 {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": errCodeNoHealersAvailable})
	}
	picked := pickFairest(counts, rand.New(rand.NewPCG(uint64(time.Now().UnixNano()), 0xb4)))

	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "Healing session - " + req.Specialty
	}

	schedule := models.Schedule{
		Title:        title,
		StartDate:    req.Start,
		EndDate:      req.End,
		Healers:      []models.Healer{{ID: picked}},
		Attendees:    req.Attendees,
		ConsentGiven: req.Consent,
		Status:       models.ScheduleStatusPending,
	}

	if err := validatePublicBooking(tx, &schedule); err != nil {
		tx.Rollback()
		code := err.Error()
		status := fiber.StatusBadRequest
		if ve, ok := err.(*validationError); ok {
			code = ve.code
			if ve.code == errCodeSlotAlreadyBooked || ve.code == errCodeHealerNotBookable {
				status = fiber.StatusConflict
			}
		}
		return c.Status(status).JSON(fiber.Map{"error": code})
	}

	if err := persistSchedule(tx, &schedule); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing schedule: " + err.Error()})
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error committing schedule: " + err.Error()})
	}

	db.Preload("Healers.Person").First(&schedule, schedule.ID)
	names, _ := healerNameByID(db, []uint32{picked})
	healerName := names[picked]

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"booking":  buildPublicBookingSummary(db, &schedule),
		"specialty": req.Specialty,
		"healer":   fiber.Map{"id": picked, "name": healerName},
	})
}

// bookingIdentity derives a lockable identity from the attendees of a booking.
func bookingIdentity(attendees []models.Person) string {
	for _, p := range attendees {
		if p.Email != "" || p.Phone != "" {
			return p.Email + "|" + p.Phone
		}
	}
	return ""
}

// persistSchedule stores the base schedule plus its healer/attendee
// associations. It mirrors the storage half of CreateSchedule so the specialty
// booking path reuses the exact same plumbing.
func persistSchedule(tx *gorm.DB, schedule *models.Schedule) error {
	healers := schedule.Healers
	attendees := schedule.Attendees
	schedule.Healers = nil
	schedule.Attendees = nil
	schedule.StartDate = schedule.StartDate.UTC()
	schedule.EndDate = schedule.EndDate.UTC()

	if schedule.CenterID <= 0 {
		if err := tx.Model(schedule).Omit("center_id", "center").Create(schedule).Error; err != nil {
			return err
		}
	} else {
		if err := tx.Create(schedule).Error; err != nil {
			return err
		}
	}

	if len(healers) > 0 {
		for _, h := range healers {
			if h.ID > 0 {
				var existing models.Healer
				if tx.Where("id = ?", h.ID).First(&existing).Error == nil {
					if err := tx.Model(schedule).Association("Healers").Append(&existing); err != nil {
						return err
					}
				}
			}
		}
	}

	if len(attendees) > 0 {
		for _, p := range attendees {
			if p.ID > 0 {
				var existing models.Person
				if tx.Where("id = ?", p.ID).First(&existing).Error == nil {
					if err := tx.Model(schedule).Association("Attendees").Append(&existing); err != nil {
						return err
					}
				}
			} else {
				if err := tx.Create(&p).Error; err == nil {
					if err := tx.Model(schedule).Association("Attendees").Append(&p); err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
}
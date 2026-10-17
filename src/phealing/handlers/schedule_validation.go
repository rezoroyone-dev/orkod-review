package handlers

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"PranicServer/models"

	"gorm.io/gorm"
)

// Public booking validation error codes. These are returned to the client as
// {"error": "<code>"} so the frontend can map each one to a user-facing message.
const (
	errCodeHealerRequired          = "Healer_required"
	errCodeInvalidHealerID         = "Invalid_healer_id"
	errCodeHealerNotFound          = "Healer_not_found"
	errCodeHealerNotBookable       = "Healer_not_bookable"
	errCodeInvalidBookingTimes     = "Invalid_booking_times"
	errCodeSlotInThePast           = "Slot_in_the_past"
	errCodeNoAvailabilityForDay    = "No_availability_for_this_day"
	errCodeSlotOutsideWorkingHours = "Slot_outside_working_hours"
	errCodeSlotAlreadyBooked       = "Slot_already_booked"
	errCodeContactRequired         = "Contact_required"
	errCodeConsentRequired         = "Consent_required"
)

// validationError carries a stable public code for a booking rejection.
type validationError struct {
	code string
}

func (e *validationError) Error() string { return e.code }

func vErr(code string) error { return &validationError{code: code} }

// validateBookingTimes checks that the requested slot is well-formed and lies
// strictly in the future. Additionally, it clears any start/end values that are
// not fully provided. now is injected so tests can control the reference clock.
func validateBookingTimes(start, end, now time.Time) error {
	if start.IsZero() || end.IsZero() {
		return vErr(errCodeInvalidBookingTimes)
	}
	if !end.After(start) {
		return vErr(errCodeInvalidBookingTimes)
	}
	if !start.After(now) || !end.After(now) {
		return vErr(errCodeSlotInThePast)
	}
	return nil
}

// parseHHMM splits an "HH:mm" (or "H:mm") availability value into hour/minute.
func parseHHMM(s string) (hour, min int, ok bool) {
	parts := strings.Split(strings.TrimSpace(s), ":")
	if len(parts) != 2 {
		return 0, 0, false
	}
	h, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, false
	}
	m, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, false
	}
	if h < 0 || h > 23 || m < 0 || m > 59 {
		return 0, 0, false
	}
	return h, m, true
}

// normalizeHHMM returns a zero-padded "HH:mm" form of a stored availability
// bound so windows can be compared with the slot lexicographically.
func normalizeHHMM(s string) (string, bool) {
	h, m, ok := parseHHMM(s)
	if !ok {
		return "", false
	}
	return fmt.Sprintf("%02d:%02d", h, m), true
}

// slotFitsWindow reports whether the booking slot [start,end) fits entirely
// inside at least one active availability window that falls on the same
// weekday as the slot. Times are interpreted in the slot's own timezone, so a
// request carrying an explicit offset is validated consistently with how the
// client presented the slot. Windows that are malformed or zero-length are
// ignored, matching the conservative "fail closed" posture.
func slotFitsWindow(start, end time.Time, windows []models.HealerAvailability) bool {
	if !end.After(start) || start.Location() == nil {
		return false
	}
	loc := start.Location()
	weekday := int(start.In(loc).Weekday())
	slotStart := fmt.Sprintf("%02d:%02d", start.In(loc).Hour(), start.In(loc).Minute())
	slotEnd := fmt.Sprintf("%02d:%02d", end.In(loc).Hour(), end.In(loc).Minute())
	if slotStart >= slotEnd {
		return false
	}

	for _, w := range windows {
		if !w.IsActive || w.DayOfWeek != weekday {
			continue
		}
		ws, ok := normalizeHHMM(w.StartTime)
		if !ok {
			continue
		}
		we, ok := normalizeHHMM(w.EndTime)
		if !ok {
			continue
		}
		if we <= ws {
			continue
		}
		if slotStart >= ws && slotEnd <= we {
			return true
		}
	}
	return false
}

// schedulesOverlap reports whether an existing interval [existingStart,
// existingEnd) overlaps the requested slot. Boundaries are exclusive so
// back-to-back slots are allowed.
func schedulesOverlap(existingStart, existingEnd, slotStart, slotEnd time.Time) bool {
	return existingStart.Before(slotEnd) && existingEnd.After(slotStart)
}

// publicBookingHealerIDs extracts, validates and de-duplicates the healer ids
// referenced by an anonymous booking. IDs are returned in ascending order so
// advisory locks are always acquired in a stable sequence (no deadlocks).
func publicBookingHealerIDs(healers []models.Healer) ([]uint32, error) {
	if len(healers) == 0 {
		return nil, vErr(errCodeHealerRequired)
	}
	seen := make(map[uint32]bool, len(healers))
	ids := make([]uint32, 0, len(healers))
	for _, h := range healers {
		if h.ID == 0 {
			return nil, vErr(errCodeInvalidHealerID)
		}
		if seen[h.ID] {
			continue
		}
		seen[h.ID] = true
		ids = append(ids, h.ID)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	return ids, nil
}

// validateHealerSlot re-derives every booking constraint for a single provider
// from server state inside the caller's transaction:
//   - the provider exists and is bookable (has an active availability window),
//   - the requested slot is within the provider's working hours,
//   - no existing or concurrently committed schedule overlaps the slot.
//
// Availability/conflict information is never accepted from the client; only the
// healer id and the requested start/end are used.
func validateHealerSlot(tx *gorm.DB, healerID uint32, start, end time.Time) error {
	var healer models.Healer
	if err := tx.Select("id").Where("id = ?", healerID).First(&healer).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return vErr(errCodeHealerNotFound)
		}
		return err
	}

	var activeCount int64
	if err := tx.Model(&models.HealerAvailability{}).
		Where("healer_id = ? AND is_active = ?", healerID, true).
		Count(&activeCount).Error; err != nil {
		return err
	}
	if activeCount == 0 {
		return vErr(errCodeHealerNotBookable)
	}

	// Serialize bookings for this provider: the overlap query that follows must
	// not race with a concurrent booking of the same slot. The lock is derived
	// from the provider id and released automatically at commit/rollback.
	lockKey := int64(fnv1a64("healer:" + strconv.FormatUint(uint64(healerID), 10)))
	if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", lockKey).Error; err != nil {
		return err
	}

	var windows []models.HealerAvailability
	if err := tx.Where("healer_id = ? AND is_active = ?", healerID, true).Find(&windows).Error; err != nil {
		return err
	}

	loc := start.Location()
	weekday := int(start.In(loc).Weekday())
	dayWindows := make([]models.HealerAvailability, 0, len(windows))
	for _, w := range windows {
		if w.DayOfWeek == weekday {
			dayWindows = append(dayWindows, w)
		}
	}
	if len(dayWindows) == 0 {
		return vErr(errCodeNoAvailabilityForDay)
	}
	if !slotFitsWindow(start, end, dayWindows) {
		return vErr(errCodeSlotOutsideWorkingHours)
	}

	var overlapCount int64
	if err := tx.Raw(`
		SELECT count(*)
		FROM schedules s
		INNER JOIN schedules_healers sh ON sh.schedule_id = s.id
		WHERE sh.healer_id = ? AND s.start_date < ? AND s.end_date > ? AND s.status <> ?`,
		healerID, end, start, models.ScheduleStatusCancelled).Scan(&overlapCount).Error; err != nil {
		return err
	}
	if overlapCount > 0 {
		return vErr(errCodeSlotAlreadyBooked)
	}
	return nil
}

// validatePublicBooking is the server-side gate for anonymous bookings. It
// independently verifies provider existence/bookability, slot validity, working
// hours and availability/conflicts inside the opened transaction, so a booking
// can never rely on frontend availability alone.
func validatePublicBooking(tx *gorm.DB, schedule *models.Schedule) error {
	if err := validateBookingTimes(schedule.StartDate, schedule.EndDate, time.Now()); err != nil {
		return err
	}

	ids, err := publicBookingHealerIDs(schedule.Healers)
	if err != nil {
		return err
	}

	for _, healerID := range ids {
		if err := validateHealerSlot(tx, healerID, schedule.StartDate, schedule.EndDate); err != nil {
			return err
		}
	}
	return nil
}
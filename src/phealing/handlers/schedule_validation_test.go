package handlers

import (
	"testing"
	"time"

	"PranicServer/models"
)

// Reference layout: 2026-09-14 is a Monday, 2026-09-15 a Tuesday,
// 2026-09-13 a Sunday (matching JS getDay(): 0=Sunday..6=Saturday).
var monLoc = time.FixedZone("test", 2*3600) // UTC+2

func at(day, hh, mm int) time.Time {
	return time.Date(2026, 9, day, hh, mm, 0, 0, monLoc)
}

func TestValidateBookingTimes(t *testing.T) {
	now := time.Date(2026, 9, 11, 10, 0, 0, 0, time.UTC)
	cases := []struct {
		name  string
		start time.Time
		end   time.Time
		code  string // "" => valid
	}{
		{"valid future slot", now.Add(2 * time.Hour), now.Add(2*time.Hour + 30*time.Minute), ""},
		{"missing start", time.Time{}, now.Add(30 * time.Minute), errCodeInvalidBookingTimes},
		{"missing end", now.Add(30 * time.Minute), time.Time{}, errCodeInvalidBookingTimes},
		{"end before start", now.Add(2 * time.Hour), now.Add(time.Hour), errCodeInvalidBookingTimes},
		{"equal times", now.Add(time.Hour), now.Add(time.Hour), errCodeInvalidBookingTimes},
		{"start in the past", now.Add(-time.Hour), now.Add(time.Hour), errCodeSlotInThePast},
		{"end in the past", now.Add(-2 * time.Hour), now.Add(-time.Hour), errCodeSlotInThePast},
		{"start exactly now", now, now.Add(30 * time.Minute), errCodeSlotInThePast},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateBookingTimes(tc.start, tc.end, now)
			if tc.code == "" {
				if err != nil {
					t.Fatalf("expected valid, got %v", err)
				}
				return
			}
			ve, ok := err.(*validationError)
			if !ok || ve.code != tc.code {
				t.Fatalf("got %v (type %T), want code %s", err, err, tc.code)
			}
		})
	}
}

func TestSlotFitsWindow(t *testing.T) {
	windows := []models.HealerAvailability{
		{DayOfWeek: 1, StartTime: "09:00", EndTime: "12:00", IsActive: true}, // Monday
		{DayOfWeek: 1, StartTime: "14:00", EndTime: "17:00", IsActive: true}, // Monday
		{DayOfWeek: 2, StartTime: "09:00", EndTime: "12:00", IsActive: true}, // Tuesday
		{DayOfWeek: 1, StartTime: "09:00", EndTime: "12:00", IsActive: false}, // Monday (inactive)
	}

	cases := []struct {
		name  string
		start time.Time
		end   time.Time
		want  bool
	}{
		{"slot inside window", at(14, 10, 0), at(14, 10, 30), true},
		{"slot at window start", at(14, 9, 0), at(14, 9, 30), true},
		{"slot ending at window end", at(14, 11, 30), at(14, 12, 0), true},
		{"slot starts before window", at(14, 8, 30), at(14, 9, 30), false},
		{"slot ends after window", at(14, 11, 30), at(14, 12, 30), false},
		{"slot straddles between windows", at(14, 12, 0), at(14, 13, 0), false},
		{"slot outside all windows", at(14, 13, 0), at(14, 13, 30), false},
		{"weekday without availability", at(13, 10, 0), at(13, 10, 30), false},
		{"slot on Tuesday window", at(15, 10, 0), at(15, 10, 30), true},
		{"zero-length slot rejected", at(14, 10, 0), at(14, 10, 0), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := slotFitsWindow(tc.start, tc.end, windows); got != tc.want {
				t.Fatalf("slotFitsWindow = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestSlotFitsWindowOnlyActiveWindows(t *testing.T) {
	inactive := []models.HealerAvailability{
		{DayOfWeek: 1, StartTime: "09:00", EndTime: "17:00", IsActive: false},
	}
	if slotFitsWindow(at(14, 10, 0), at(14, 10, 30), inactive) {
		t.Fatal("inactive windows must not grant availability")
	}
}

func TestSlotFitsWindowTimezoneAware(t *testing.T) {
	// The same instant must be judged against the window in the timezone the
	// request carries: 10:00+02:00 fits a 10:00 window, 08:00 UTC does not.
	windows := []models.HealerAvailability{
		{DayOfWeek: 1, StartTime: "10:00", EndTime: "11:00", IsActive: true},
	}
	startLocal := at(14, 10, 0) // Monday 10:00 +02:00
	if !slotFitsWindow(startLocal, startLocal.Add(30*time.Minute), windows) {
		t.Fatal("slot in the window's own timezone should fit")
	}
	utc := time.FixedZone("utc", 0)
	if slotFitsWindow(startLocal.In(utc), startLocal.UTC().Add(30*time.Minute), windows) {
		t.Fatal("same instant expressed as 08:00 UTC must NOT match a 10:00 window")
	}
}

func TestSlotFitsWindowRejectsMalformedWindows(t *testing.T) {
	start := at(14, 10, 0)
	end := start.Add(30 * time.Minute)
	for _, tc := range []struct {
		name string
		w    models.HealerAvailability
	}{
		{"empty times", models.HealerAvailability{DayOfWeek: 1, StartTime: "", EndTime: ""}},
		{"one field only", models.HealerAvailability{DayOfWeek: 1, StartTime: "09:00", EndTime: ""}},
		{"bad hour", models.HealerAvailability{DayOfWeek: 1, StartTime: "25:00", EndTime: "26:00"}},
		{"bad minute", models.HealerAvailability{DayOfWeek: 1, StartTime: "09:70", EndTime: "10:00"}},
		{"non numeric", models.HealerAvailability{DayOfWeek: 1, StartTime: "09:xx", EndTime: "10:00"}},
		{"reversed bounds", models.HealerAvailability{DayOfWeek: 1, StartTime: "17:00", EndTime: "09:00"}},
	} {
		tc.w.IsActive = true
		t.Run(tc.name, func(t *testing.T) {
			if slotFitsWindow(start, end, []models.HealerAvailability{tc.w}) {
				t.Fatal("malformed window must not match")
			}
		})
	}
}

func TestSchedulesOverlap(t *testing.T) {
	slot := func(h, m int) time.Time { return at(14, h, m) }
	cases := []struct {
		name           string
		es, ee, ss, se time.Time
		want           bool
	}{
		{"no overlap before", slot(8, 0), slot(9, 0), slot(10, 0), slot(11, 0), false},
		{"no overlap after", slot(12, 0), slot(13, 0), slot(10, 0), slot(11, 0), false},
		{"back-to-back allowed", slot(10, 0), slot(11, 0), slot(11, 0), slot(12, 0), false},
		{"back-to-back reversed", slot(11, 0), slot(12, 0), slot(10, 0), slot(11, 0), false},
		{"exact overlap", slot(10, 0), slot(11, 0), slot(10, 0), slot(11, 0), true},
		{"existing contains slot", slot(9, 0), slot(12, 0), slot(10, 0), slot(11, 0), true},
		{"slot contains existing", slot(10, 0), slot(11, 0), slot(9, 0), slot(12, 0), true},
		{"partial start overlap", slot(9, 0), slot(10, 30), slot(10, 0), slot(11, 0), true},
		{"partial end overlap", slot(10, 30), slot(12, 0), slot(10, 0), slot(11, 0), true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := schedulesOverlap(tc.es, tc.ee, tc.ss, tc.se); got != tc.want {
				t.Fatalf("schedulesOverlap = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestParseHHMM(t *testing.T) {
	valid := map[string][2]int{
		"09:00": {9, 0},
		"9:05":  {9, 5},
		"00:00": {0, 0},
		"23:59": {23, 59},
	}
	for in, want := range valid {
		h, m, ok := parseHHMM(in)
		if !ok || h != want[0] || m != want[1] {
			t.Fatalf("parseHHMM(%q) = %d,%d,%v want %d,%d,true", in, h, m, ok, want[0], want[1])
		}
	}
	for _, in := range []string{"", "9", "9:5:0", "24:00", "12:60", "aa:bb", "-1:00"} {
		if _, _, ok := parseHHMM(in); ok {
			t.Fatalf("parseHHMM(%q) should be invalid", in)
		}
	}
}

func TestPublicBookingHealerIDs(t *testing.T) {
	if _, err := publicBookingHealerIDs([]models.Healer{{ID: 0}}); err == nil {
		t.Fatal("healer with id 0 must be rejected")
	}
	if _, err := publicBookingHealerIDs(nil); err == nil {
		t.Fatal("empty healers must be rejected")
	}

	ids, err := publicBookingHealerIDs([]models.Healer{
		{ID: 7}, {ID: 3}, {ID: 7}, {ID: 5},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []uint32{3, 5, 7}
	if len(ids) != len(want) {
		t.Fatalf("ids = %v, want %v", ids, want)
	}
	for i := range want {
		if ids[i] != want[i] {
			t.Fatalf("ids = %v, want %v", ids, want)
		}
	}

	_, err = publicBookingHealerIDs([]models.Healer{{ID: 9}, {ID: 0}})
	ve, _ := err.(*validationError)
	if ve == nil || ve.code != errCodeInvalidHealerID {
		t.Fatalf("expected %s error, got %v", errCodeInvalidHealerID, ve)
	}
}

func TestHealerLockKeysDeterministicAndDistinct(t *testing.T) {
	a1 := fnv1a64("healer:3")
	if a1 != fnv1a64("healer:3") {
		t.Fatal("lock key must be deterministic")
	}
	if a1 == fnv1a64("healer:4") {
		t.Fatal("lock keys for different healers must differ")
	}
	if a1 == fnv1a64("someone@x.com|+123") {
		t.Fatal("healer lock key must not collide with an attendee identity lock key")
	}
}
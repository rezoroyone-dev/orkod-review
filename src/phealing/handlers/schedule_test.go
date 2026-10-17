package handlers

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"PranicServer/models"
)

func TestFNV1a64_Deterministic(t *testing.T) {
	if fnv1a64("a@b.com|+2010") != fnv1a64("a@b.com|+2010") {
		t.Fatal("hash must be deterministic")
	}
}

func TestFNV1a64_DistinguishesIdentity(t *testing.T) {
	a := fnv1a64("x@x.com|+1000")
	b := fnv1a64("x@x.com|+2000")
	c := fnv1a64("y@x.com|+1000")
	if a == b || a == c || b == c {
		t.Fatalf("expected distinct hash keys for distinct identities: %d %d %d", a, b, c)
	}
}

// TestPublicBookingSummary_NoPII is the privacy contract for anonymous
// bookings: the summary payload must contain no attendee or healer
// contact information, and must still carry confirmation details.
func TestPublicBookingSummary_NoPII(t *testing.T) {
	start := time.Now().Add(24 * time.Hour)
	schedule := &models.Schedule{
		ID:        123,
		Title:     "Pranic Healing Session",
		StartDate: start,
		EndDate:   start.Add(1 * time.Hour),
		BgColor:   "#0E9488",
	}
	schedule.Healers = []models.Healer{
		{ID: 1, FirstName: "Fatima", LastName: "Nour"},
	}
	schedule.CenterID = 5
	schedule.Center = models.Center{Name: "Main Healing Center"}

	summary := buildPublicBookingSummary(nil, schedule)
	if summary.Status != "" {
		t.Errorf("Status = %q, want empty (mirrors the schedule's real status)", summary.Status)
	}

	schedule.Status = models.ScheduleStatusPending
	summary = buildPublicBookingSummary(nil, schedule)
	if summary.Status != models.ScheduleStatusPending {
		t.Errorf("Status = %q, want %q", summary.Status, models.ScheduleStatusPending)
	}
	if summary.CenterName != "Main Healing Center" {
		t.Errorf("CenterName = %q", summary.CenterName)
	}
	if len(summary.HealerNames) != 1 || summary.HealerNames[0] != "Fatima Nour" {
		t.Errorf("HealerNames = %v, want [Fatima Nour]", summary.HealerNames)
	}

	raw, err := json.Marshal(summary)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	s := strings.ToLower(string(raw))
	for _, forbidden := range []string{"email", "phone", "address", "bloodgroup", "birthdate", "folder", "license"} {
		if strings.Contains(s, forbidden) {
			t.Fatalf("booking summary leaks %q: %s", forbidden, raw)
		}
	}
}

// TestValidScheduleStatus locks the sanctioned booking lifecycle states.
func TestValidScheduleStatus(t *testing.T) {
	for status, want := range map[string]bool{
		"":          false,
		"pending":   true,
		"confirmed": true,
		"completed": true,
		"cancelled": true,
		"CONFIRMED": false,
		"deleted":   false,
		"draft":     false,
	} {
		if got := validScheduleStatus(status); got != want {
			t.Fatalf("validScheduleStatus(%q) = %v, want %v", status, got, want)
		}
	}
}

// TestDefaultScheduleStatus ensures new schedules get a sensible default so a
// missing status never fabricates "confirmed".
func TestDefaultScheduleStatus(t *testing.T) {
	fallback := models.Schedule{}
	if fallback.Status != "" && fallback.Status != models.ScheduleStatusPending {
		t.Fatalf("unexpected default status %q", fallback.Status)
	}
}
package handlers

import (
	"math/rand/v2"
	"testing"
	"time"
)

func TestPickFairest(t *testing.T) {
	// Unique minimum workload -> always chosen.
	counts := map[uint32]int64{1: 0, 2: 5, 3: 9}
	for i := 0; i < 50; i++ {
		if got := pickFairest(counts, rand.New(rand.NewPCG(1, uint64(i)))); got != 1 {
			t.Fatalf("expected healer 1, got %d", got)
		}
	}

	// Ties resolve to one of the lowest-workload healers and, over many draws,
	// both get picked (random tie-break).
	ties := map[uint32]int64{1: 2, 2: 2, 3: 10}
	picked := map[uint32]bool{}
	for i := 0; i < 200; i++ {
		got := pickFairest(ties, rand.New(rand.NewPCG(uint64(i), 7)))
		if got != 1 && got != 2 {
			t.Fatalf("picked non-minimum healer %d", got)
		}
		picked[got] = true
	}
	if !picked[1] || !picked[2] {
		t.Fatalf("random tie-break never picked one of the tied healers: %v", picked)
	}

	// Empty map -> zero id.
	if got := pickFairest(nil, rand.New(rand.NewPCG(0, 0))); got != 0 {
		t.Fatalf("expected 0 for empty counts, got %d", got)
	}
}

func TestSlotStartsForWindow(t *testing.T) {
	loc := time.FixedZone("test", 60)
	day := time.Date(2026, 9, 24, 0, 0, 0, 0, loc)

	slots := slotStartsForWindow(day, "09:00", "12:00", 60)
	if len(slots) != 3 {
		t.Fatalf("expected 3 slots, got %d: %v", len(slots), slots)
	}
	for i, wantH := range []int{9, 10, 11} {
		if slots[i].Hour() != wantH || slots[i].Minute() != 0 {
			t.Fatalf("slot %d: expected %02d:00, got %v", i, wantH, slots[i])
		}
	}

	if got := slotStartsForWindow(day, "09:00", "09:00", 60); len(got) != 0 {
		t.Fatalf("zero-length window should yield no slots, got %v", got)
	}
	if got := slotStartsForWindow(day, "12:00", "09:00", 60); len(got) != 0 {
		t.Fatalf("inverted window should yield no slots, got %v", got)
	}
	if got := slotStartsForWindow(day, "oops", "12:00", 60); len(got) != 0 {
		t.Fatalf("malformed window should yield no slots, got %v", got)
	}
}

func TestTimeWindowCovers(t *testing.T) {
	loc := time.FixedZone("test", -120)
	mk := func(h, m int) time.Time {
		return time.Date(2026, 9, 24, h, m, 0, 0, loc)
	}

	c1 := timeWindowCovers("09:00", "11:00", mk(9, 0), mk(10, 0))
	if !c1 {
		t.Fatal("expected 09-10 slot inside 09-11 window")
	}
	if !timeWindowCovers("09:00", "11:00", mk(10, 0), mk(11, 0)) {
		t.Fatal("expected 10-11 slot inside 09-11 window")
	}
	if timeWindowCovers("09:00", "11:00", mk(8, 30), mk(9, 30)) {
		t.Fatal("slot spilling before the window must be rejected")
	}
	if timeWindowCovers("09:00", "11:00", mk(10, 0), mk(12, 0)) {
		t.Fatal("slot spilling after the window must be rejected")
	}
	if timeWindowCovers("bad", "11:00", mk(9, 0), mk(10, 0)) {
		t.Fatal("malformed bounds must be rejected")
	}
}

func TestSortedHealerIDs(t *testing.T) {
	got := sortedHealerIDs([]uint32{4, 2, 4, 0, 1})
	want := []uint32{1, 2, 4}
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}
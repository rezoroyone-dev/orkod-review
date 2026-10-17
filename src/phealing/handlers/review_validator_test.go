package handlers

import (
	"strings"
	"testing"

	"PranicServer/models"
)

func TestValidateReviewInput_Valid(t *testing.T) {
	cases := []struct {
		name        string
		targetType  string
		targetID    uint32
		rating      uint8
		title       string
		comment     string
		authorName  string
		authorEmail string
	}{
		{"doctor minimal", models.ReviewTargetDoctor, 1, 5, "Great", "", "Ali", ""},
		{"doctor comment only", models.ReviewTargetDoctor, 9, 3, "", "Nice session", "Sara", "s@e.com"},
		{"healer full", models.ReviewTargetHealer, 4, 1, "Needs work", "Detail", "Omar", "o@e.com"},
		{"boundary title", models.ReviewTargetDoctor, 2, 5, strings.Repeat("x", maxReviewTitle), "", "N", ""},
		{"boundary comment", models.ReviewTargetDoctor, 2, 5, "", strings.Repeat("y", maxReviewComment), "N", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if msg := validateReviewInput(tc.targetType, tc.targetID, tc.rating, tc.title, tc.comment, tc.authorName, tc.authorEmail); msg != "" {
				t.Errorf("expected valid, got error: %s", msg)
			}
		})
	}
}

func TestValidateReviewInput_Invalid(t *testing.T) {
	cases := []struct {
		name        string
		targetType  string
		targetID    uint32
		rating      uint8
		title       string
		comment     string
		authorName  string
		authorEmail string
		wantSubstr  string
	}{
		{"targetType doctor or healer", "clinic", 1, 5, "t", "", "n", "", "targetType"},
		{"missing targetId", models.ReviewTargetDoctor, 0, 5, "t", "", "n", "", "targetId"},
		{"rating too low", models.ReviewTargetDoctor, 1, 0, "t", "", "n", "", "rating"},
		{"rating too high", models.ReviewTargetDoctor, 1, 6, "t", "", "n", "", "rating"},
		{"no content", models.ReviewTargetDoctor, 1, 3, "  ", "  ", "n", "", "title or comment"},
		{"title too long", models.ReviewTargetDoctor, 1, 3, strings.Repeat("x", maxReviewTitle+1), "", "n", "", "too long"},
		{"comment too long", models.ReviewTargetDoctor, 1, 3, "", strings.Repeat("y", maxReviewComment+1), "n", "", "too long"},
		{"missing authorName", models.ReviewTargetDoctor, 1, 3, "t", "", "  ", "", "authorName"},
		{"bad email", models.ReviewTargetDoctor, 1, 3, "t", "", "n", "not-an-email", "authorEmail"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			msg := validateReviewInput(tc.targetType, tc.targetID, tc.rating, tc.title, tc.comment, tc.authorName, tc.authorEmail)
			if msg == "" {
				t.Fatalf("expected error containing %q, got valid", tc.wantSubstr)
			}
			if !strings.Contains(msg, tc.wantSubstr) {
				t.Errorf("error %q does not contain %q", msg, tc.wantSubstr)
			}
		})
	}
}
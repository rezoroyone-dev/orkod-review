package handlers

import (
	"encoding/json"
	"strings"
	"testing"

	"PranicServer/models"
)

func TestPublicDoctorFromModel_PopulatesPublicFields(t *testing.T) {
	d := &models.Doctor{
		ID:              7,
		Title:           "Dr.",
		Specialty:       "Orthopedics",
		About:           "  Specializes in joint care.  ",
		Certifications:  "MBBS, MD",
		YearsExperience: 12,
		WorkingHours:    "Mon-Fri 9:00-17:00",
		PhotoURL:        "https://cdn.example/a.jpg",
		IsVerified:      true,
		IsAcceptingNew:  true,
	}
	d.Person = models.Person{ID: 3, FirstName: "  Adam  ", LastName: "  Smith  ", City: " Cairo "}

	got := publicDoctorFromModel(d)

	if got.ID != 7 {
		t.Errorf("ID = %d, want 7", got.ID)
	}
	if got.FirstName != "Adam" || got.LastName != "Smith" {
		t.Errorf("names = %q %q, want Adam Smith (trimmed)", got.FirstName, got.LastName)
	}
	if got.City != "Cairo" {
		t.Errorf("City = %q, want Cairo (trimmed)", got.City)
	}
	if got.About != "Specializes in joint care." {
		t.Errorf("About = %q, want trimmed", got.About)
	}
	if got.Specialty != "Orthopedics" || got.YearsExperience != 12 {
		t.Errorf("specialty/years = %q/%d, unexpected", got.Specialty, got.YearsExperience)
	}
	if !got.Verified || !got.IsAcceptingNew {
		t.Error("Verified/IsAcceptingNew should be true")
	}
	if got.RatingCount != 0 {
		t.Errorf("RatingCount = %d, want 0 before aggregation", got.RatingCount)
	}
}

// TestPublicDoctor_DoesNotExposePrivateFields is the core privacy contract:
// the public projection JSON must never contain any PII or staff-only fields.
func TestPublicDoctor_DoesNotExposePrivateFields(t *testing.T) {
	d := &models.Doctor{
		ID:             42,
		Title:          "Prof.",
		Specialty:      "Neurology",
		LicenseNumber:  "SECRET-LIC-100",
		PhotoURL:       "https://cdn.example/p.jpg",
		WorkingHours:   "Sat 10:00-14:00",
		IsVerified:     true,
		IsAcceptingNew: false,
	}
	d.Person = models.Person{
		ID:           99,
		FirstName:    "Jane",
		LastName:     "Doe",
		Phone:        "+201001234567",
		Email:        "jane.doe@private.example",
		Address:      "12 Hidden Street",
		BirthDate:    "1980-01-01",
		FolderNumber: "P-0001",
		City:         "Giza",
	}

	got := publicDoctorFromModel(d)
	raw, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	s := string(raw)

	// Private fields that must never appear.
	for _, forbidden := range []string{
		"email", "phone", "address", "birthDate", "birth_date",
		"folderNumber", "folder_number", "licenseNumber", "license_number",
		"personID", "password", "bloodGroup",
	} {
		if strings.Contains(strings.ToLower(s), strings.ToLower(forbidden)) {
			t.Errorf("public doctor JSON leaks private field %q: %s", forbidden, s)
		}
	}

	// Public fields that must appear.
	for _, expected := range []string{"id", "specialty", "firstName", "lastName", "city", "verified"} {
		if !strings.Contains(s, `"`+expected+`"`) {
			t.Errorf("public doctor JSON missing expected field %q: %s", expected, s)
		}
	}
}
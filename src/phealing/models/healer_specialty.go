package models

import "time"

// HealerSpecialty links a healer to a condition body-area they can heal
// (e.g. "heart", "back", "stress"). Specialties are assigned by admin and
// drive the fair-assignment booking flow: a visitor picks a specialty, then
// the system chooses the healer with the fewest completed sessions.
type HealerSpecialty struct {
	ID        uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	HealerID  uint32    `json:"healerID" gorm:"column:healer_id;not null;uniqueIndex:idx_healer_specialty"`
	Specialty string    `json:"specialty" gorm:"column:specialty;size:64;not null;uniqueIndex:idx_healer_specialty"`
	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName sets the table name
func (HealerSpecialty) TableName() string {
	return "healer_specialties"
}
package models

import (
	"time"
)

// Treatment is the database table
type Treatment struct {
	ID         uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	PersonID   uint32    `json:"personID" gorm:"column:person_id;index"`
	Healers    []Healer  `json:"healers" gorm:"many2many:treatments_healers"`
	Nature     uint32    `json:"nature" gorm:"not null;index"`
	Diagnostic uint32    `json:"diagnostic" gorm:"not null"`
	Status     string    `json:"status" gorm:"not null;index"`
	Comment    string    `json:"comment"`
	StartDate  time.Time `json:"startDate" gorm:"column:start_date;not null;index"`
	StartTime  string    `json:"startTime" gorm:"column:start_time;not null"`
	TotalCost  float32   `json:"totalCost" gorm:"column:total_cost;not null"`
	Payed      float32   `json:"payed" gorm:"not null"`
	Mode       string    `json:"mode"`
}

// TreatmentHealer join table for the manytomany relation between Healer and Treatment tables
type TreatmentHealer struct {
	HealerID    uint32 `json:"healerID"    gorm:"column:healer_id;not null;index"`
	TreatmentID uint32 `json:"treatmentID" gorm:"column:treatment_id;not null;index"`
}

// TableName sets the table name
func (TreatmentHealer) TableName() string {
	return "treatments_healers"
}

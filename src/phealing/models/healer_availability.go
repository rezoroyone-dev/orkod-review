package models

import (
	"time"
)

// HealerAvailability represents the working hours or slots for a healer
type HealerAvailability struct {
	ID        uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	HealerID  uint32    `json:"healerID" gorm:"column:healer_id;not null"`
	DayOfWeek int       `json:"dayOfWeek" gorm:"column:day_of_week;not null"`
	StartTime string    `json:"startTime" gorm:"column:start_time;not null"`
	EndTime   string    `json:"endTime" gorm:"column:end_time;not null"`
	IsActive  bool      `json:"isActive" gorm:"column:is_active;not null;default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName sets the table name
func (HealerAvailability) TableName() string {
	return "healer_availabilities"
}

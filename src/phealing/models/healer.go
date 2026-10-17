package models

// Healer is the database table
type Healer struct {
	ID        uint32     `json:"id" gorm:"primaryKey;autoIncrement"`
	PersonID  uint32     `json:"personID" gorm:"column:person_id;uniqueIndex;not null;index"`
	Person    Person     `json:"person" gorm:"foreignKey:PersonID"`
	Level     Level      `json:"level" gorm:"column:level;not null;default:1"`
	Schedules []Schedule `json:"schedules" gorm:"many2many:schedules_healers"`
	// Virtual fields for API - mirror Person data for easier frontend access
	FirstName string `json:"firstName" gorm:"-"`
	LastName  string `json:"lastName" gorm:"-"`
}

package models

import (
	"time"
)

// ContactMessage is the database table for contact us messages
type ContactMessage struct {
	ID        uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"not null"`
	Email     string    `json:"email" gorm:"not null"`
	Subject   string    `json:"subject" gorm:"not null"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	CreatedAt time.Time `json:"createdAt" gorm:"index"`
	Read      bool      `json:"read" gorm:"default:false"`
}

// TableName sets the table name
func (ContactMessage) TableName() string {
	return "contact_messages"
}

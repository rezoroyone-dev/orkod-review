package models

import "time"

// Donation records a donation made through the public site. Donations are
// hidden by default and only become public once an admin approves them AND the
// donor opted in with IsPublic AND the global "donations visible" setting is
// enabled.
type Donation struct {
	ID         uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name       string    `json:"name" gorm:"column:name;size:120"`
	Amount     float64   `json:"amount" gorm:"column:amount;not null"`
	Message    string    `json:"message" gorm:"column:message;type:text"`
	IsApproved bool      `json:"isApproved" gorm:"column:is_approved;not null;default:false"`
	IsPublic   bool      `json:"isPublic" gorm:"column:is_public;not null;default:false"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName sets the table name
func (Donation) TableName() string {
	return "donations"
}
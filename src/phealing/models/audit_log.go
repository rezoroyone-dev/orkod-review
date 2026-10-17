package models

import (
	"time"
)

// AuditLog represents a log of an action performed by a user
type AuditLog struct {
	ID        uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint32    `json:"userID" gorm:"column:user_id"`
	UserName  string    `json:"userName" gorm:"column:user_name"`
	Action    string    `json:"action" gorm:"column:action;not null"`
	Target    string    `json:"target" gorm:"column:target"`
	TargetID  uint32    `json:"targetID" gorm:"column:target_id"`
	Details   string    `json:"details" gorm:"type:text"`
	CreatedAt time.Time `json:"createdAt" gorm:"index"`
}

// TableName sets the table name
func (AuditLog) TableName() string {
	return "audit_logs"
}

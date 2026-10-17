package utilities

import (
	"PranicServer/models"
	"time"

	"gorm.io/gorm"
)

// RecordAudit saves an action to the audit log
func RecordAudit(db *gorm.DB, user *models.SuperUser, action, target string, targetID uint32, details string) {
	if db == nil {
		return
	}

	userName := "System"
	userID := uint32(0)

	if user != nil {
		userName = user.UserName
		userID = user.ID
	}

	log := models.AuditLog{
		UserID:    userID,
		UserName:  userName,
		Action:    action,
		Target:    target,
		TargetID:  targetID,
		Details:   details,
		CreatedAt: time.Now(),
	}
	db.Create(&log)
}

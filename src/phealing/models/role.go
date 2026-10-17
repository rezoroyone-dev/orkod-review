package models

import (
	"gorm.io/gorm"
)

// Role represents a user role
type Role struct {
	ID          uint32       `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string       `json:"name" gorm:"uniqueIndex;not null"`
	Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions"`
}

// Permission represents a specific action that can be performed
type Permission struct {
	ID   uint32 `json:"id" gorm:"primaryKey;autoIncrement"`
	Name string `json:"name" gorm:"uniqueIndex;not null"`
}

// RolePermission join table
type RolePermission struct {
	RoleID       uint32 `gorm:"primaryKey"`
	PermissionID uint32 `gorm:"primaryKey"`
}

// TableName sets the table name
func (RolePermission) TableName() string {
	return "role_permissions"
}

// CheckPermission checks if a role has a specific permission
func (r *Role) CheckPermission(db *gorm.DB, permissionName string) bool {
	var count int64
	db.Table("role_permissions").
		Joins("join permissions on permissions.id = role_permissions.permission_id").
		Where("role_permissions.role_id = ? and permissions.name = ?", r.ID, permissionName).
		Count(&count)
	return count > 0
}

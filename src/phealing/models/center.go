package models

import (
	"gorm.io/gorm"
)

// Center is the database table
type Center struct {
	ID          uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	ManagerName string    `json:"managerName" gorm:"column:manager_name"`
	Name        string    `json:"name" gorm:"column:name;uniqueIndex:uq_CenterName;not null"`
	Phone       string    `json:"phone" gorm:"column:phone;not null"`
	Email       string    `json:"email"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	Photo       string    `json:"photo" gorm:"column:photo"`
	Schedules   []Schedule `json:"schedules" gorm:"foreignKey:CenterID"`
}

// TableName sets the table name
func (Center) TableName() string {
	return "centers"
}

// FindCenterByID ...
func FindCenterByID(db *gorm.DB, id uint32) (Center, error) {
	var center Center
	err := db.Where("id = ?", id).First(&center).Error
	return center, err
}

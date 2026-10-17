package models

import "time"

// Doctor is a medical professional profile for the public doctor directory.
//
// Privacy/security contract:
//   - Public endpoints MUST only expose fields allowed for anonymous visitors
//     (see handlers.PublicDoctor). LicenseNumber and Person are private.
//   - PersonID links the profile to a Person record so the doctor can also be
//     managed as staff through the existing people/user system.
type Doctor struct {
	ID              uint32     `json:"id" gorm:"primaryKey;autoIncrement"`
	PersonID        uint32     `json:"personID" gorm:"column:person_id;uniqueIndex;not null;index"`
	Person          Person     `json:"person" gorm:"foreignKey:PersonID"`
	Title           string     `json:"title" gorm:"column:title"`
	Specialty       string     `json:"specialty" gorm:"column:specialty;index;not null"`
	About           string     `json:"about" gorm:"column:about;type:text"`
	Certifications  string     `json:"certifications" gorm:"column:certifications;type:text"`
	YearsExperience int        `json:"yearsExperience" gorm:"column:years_experience;default:0"`
	LicenseNumber   string     `json:"-" gorm:"column:license_number"` // private - never exposed publicly
	PhotoURL        string     `json:"photoUrl" gorm:"column:photo_url"`
	WorkingHours    string     `json:"workingHours" gorm:"column:working_hours"`
	IsAcceptingNew  bool       `json:"isAcceptingNew" gorm:"column:is_accepting_new;default:true"`
	IsVerified      bool       `json:"verified" gorm:"column:is_verified;default:false"`
	IsActive        bool       `json:"isActive" gorm:"column:is_active;not null;default:true"`
	CreatedAt       time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName sets the table name
func (Doctor) TableName() string {
	return "doctors"
}
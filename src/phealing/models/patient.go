package models

import "time"

// Patient is a lightweight patient account for the self-service portal
// Patients can view their own appointments, treatment history, and manage bookings
type Patient struct {
	ID                uint32     `json:"id" gorm:"primaryKey;autoIncrement"`
	PersonID          uint32     `json:"personID" gorm:"column:person_id;uniqueIndex;not null"`
	Person            Person     `json:"person" gorm:"foreignKey:PersonID"`
	Email             string     `json:"email" gorm:"column:email;uniqueIndex;not null"`
	PasswordHash      string     `json:"-" gorm:"column:password_hash"`
	RefreshToken      string     `json:"refreshToken" gorm:"column:refresh_token"`
	IsActive          bool       `json:"isActive" gorm:"column:is_active;default:true"`
	EmailVerified     bool       `json:"emailVerified" gorm:"column:email_verified;default:false"`
	VerificationToken string     `json:"verificationToken" gorm:"column:verification_token"`
	CreatedAt         time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt         time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	LastLoginAt       *time.Time `json:"lastLoginAt" gorm:"column:last_login_at;type:timestamptz"`
}

// TableName sets the table name
func (Patient) TableName() string {
	return "patients"
}

// PasswordReset tracks password reset requests for patients
type PatientPasswordReset struct {
	ID        uint32     `json:"id" gorm:"primaryKey;autoIncrement"`
	PatientID uint32     `json:"patientID" gorm:"column:patient_id;not null;index"`
	Patient   Patient    `json:"patient" gorm:"foreignKey:PatientID"`
	Token     string     `json:"token" gorm:"column:token;uniqueIndex;not null"`
	Expiry    time.Time  `json:"expiry" gorm:"column:expiry;not null"`
	UsedAt    *time.Time `json:"usedAt" gorm:"column:used_at;type:timestamptz"`
	CreatedAt time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName sets the table name
func (PatientPasswordReset) TableName() string {
	return "patient_password_resets"
}
package models

import "time"

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeAppointmentReminder NotificationType = "appointment_reminder"
	NotificationTypeBookingConfirmation NotificationType = "booking_confirmation"
	NotificationTypeBookingCancellation NotificationType = "booking_cancellation"
	NotificationTypePasswordReset       NotificationType = "password_reset"
	NotificationTypeEmailVerification   NotificationType = "email_verification"
)

// NotificationChannel represents how the notification was sent
type NotificationChannel string

const (
	ChannelEmail NotificationChannel = "email"
	ChannelSMS   NotificationChannel = "sms"
	ChannelBoth  NotificationChannel = "both"
)

// NotificationLog tracks all sent notifications for audit and retry purposes
type NotificationLog struct {
	ID           uint32           `json:"id" gorm:"primaryKey;autoIncrement"`
	ScheduleID   *uint32          `json:"scheduleID" gorm:"column:schedule_id;index"`           // Optional: linked schedule
	Schedule     *Schedule        `json:"schedule" gorm:"foreignKey:ScheduleID"`
	PatientID    *uint32          `json:"patientID" gorm:"column:patient_id;index"`             // Optional: linked patient
	Patient      *Patient         `json:"patient" gorm:"foreignKey:PatientID"`
	UserID       *uint32          `json:"userID" gorm:"column:user_id;index"`                   // Optional: linked user
	User         *SuperUser       `json:"user" gorm:"foreignKey:UserID"`
	Type         NotificationType `json:"type" gorm:"column:type;not null"`
	Channel      NotificationChannel `json:"channel" gorm:"column:channel;not null"`
	Recipient    string           `json:"recipient" gorm:"column:recipient;not null"`           // Email or phone
	Subject      string           `json:"subject" gorm:"column:subject"`
	Body         string           `json:"body" gorm:"column:body;type:text"`
	Status       string           `json:"status" gorm:"column:status;default:'pending'"`        // pending, sent, failed
	ErrorMessage string           `json:"errorMessage" gorm:"column:error_message;type:text"`
	SentAt       *time.Time       `json:"sentAt" gorm:"column:sent_at;type:timestamptz"`
	CreatedAt    time.Time        `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName sets the table name
func (NotificationLog) TableName() string {
	return "notification_logs"
}

// EmailTemplate stores customizable email templates
type EmailTemplate struct {
	ID          uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"column:name;uniqueIndex;not null"`
	Subject     string    `json:"subject" gorm:"column:subject;not null"`
	Body        string    `json:"body" gorm:"column:body;type:text;not null"`
	Description string    `json:"description" gorm:"column:description;type:text"`
	IsActive    bool      `json:"isActive" gorm:"column:is_active;default:true"`
	CreatedAt   time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName sets the table name
func (EmailTemplate) TableName() string {
	return "email_templates"
}
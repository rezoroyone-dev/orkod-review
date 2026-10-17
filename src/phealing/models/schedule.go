package models

import (
	"time"
)

// Booking lifecycle statuses. A new booking starts as pending and staff move it
// through confirmed/completed/cancelled. Cancelled bookings are excluded from
// availability and conflict checks.
const (
	ScheduleStatusPending   = "pending"
	ScheduleStatusConfirmed = "confirmed"
	ScheduleStatusCompleted = "completed"
	ScheduleStatusCancelled = "cancelled"
)

// Schedule is the database table
type Schedule struct {
	ID              uint32           `json:"id" gorm:"primaryKey;autoIncrement"`
	Healers         []Healer         `json:"healers" gorm:"many2many:schedules_healers"`
	CalendarID      uint32           `json:"calendarID,string" gorm:"column:calendar_id;default:1"`
	CenterID        int              `json:"centerID" gorm:"column:center_id;default:-1"`
	Center          Center           `json:"center"`
	StartDate       time.Time        `json:"start" gorm:"column:start_date;type:timestamptz;not null"`
	EndDate         time.Time        `json:"end" gorm:"column:end_date;type:timestamptz;not null"`
	Title           string           `json:"title" gorm:"not null"`
	Busy            bool             `json:"busy" gorm:"default:false"`
	IsLocal         bool             `json:"isLocal" gorm:"column:is_local;not null"`
	Category        string           `json:"category" gorm:"default:'time'"`
	DueDateClass    string           `json:"dueDateClass" gorm:"column:due_date_class"`
	Attendees       []Person         `json:"attendees" gorm:"many2many:persons_schedules"`
	Meditations     []Meditation     `json:"meditations" gorm:"many2many:schedules_meditations"`
	SicknessNatures []SicknessNature `json:"sicknessNatures" gorm:"many2many:schedules_sickness_natures"`
	BgColor         string           `json:"bgColor" gorm:"column:bg_color;default:'green'"`
	Color           string           `json:"color" gorm:"column:color;default:'white'"`
	// Recurrence fields
	RecurrenceType     string     `json:"recurrenceType" gorm:"column:recurrence_type;default:''"`              // "daily","weekly","biweekly","monthly" or ""
	RecurrenceInterval int        `json:"recurrenceInterval" gorm:"column:recurrence_interval;default:0"`       // number of occurrences
	RecurrenceEndDate  *time.Time `json:"recurrenceEndDate" gorm:"column:recurrence_end_date;type:timestamptz"` // optional hard stop
	RecurrenceGroupID  uint32     `json:"recurrenceGroupId" gorm:"column:recurrence_group_id;default:0"`        // links all occurrences together
	// Session notes for tracking treatment progress
	SessionNotes string `json:"sessionNotes" gorm:"column:session_notes;type:text"` // Notes recorded by healer during/after session
	// Reminder tracking
	ReminderSent bool `json:"reminderSent" gorm:"column:reminder_sent;default:false"` // Whether reminder was sent
	// Booking lifecycle + consent captured when the booking was made.
	Status       string `json:"status" gorm:"column:status;default:'pending'"`          // pending|confirmed|completed|cancelled
	ConsentGiven bool   `json:"consentGiven" gorm:"column:consent_given;default:false"` // Whether the client consented to being contacted
}

// SchedulesBgColors represents the background colors for schedules
var SchedulesBgColors []string = []string{"red", "blue", "green", "magenta", "orange", "purple", "black"}

// ScheduleHealer join table for the manytomany relation between Healer and Schedule tables
type ScheduleHealer struct {
	HealerID   uint32 `json:"healerID"   gorm:"column:healer_id;not null"`
	ScheduleID uint32 `json:"scheduleID" gorm:"column:schedule_id;not null"`
}

// TableName sets the table name
func (ScheduleHealer) TableName() string {
	return "schedules_healers"
}

// PersonSchedule join table for the manytomany relation between Person and Schedule tables
type PersonSchedule struct {
	PersonID   uint32 `json:"personID"   gorm:"column:person_id;not null"`
	ScheduleID uint32 `json:"scheduleID" gorm:"column:schedule_id;not null"`
}

// TableName sets the table name
func (PersonSchedule) TableName() string {
	return "persons_schedules"
}

// ScheduleMeditation join table for the manytomany relation between Schedule and Meditation tables
type ScheduleMeditation struct {
	ScheduleID   uint32 `json:"scheduleID"   gorm:"column:schedule_id;not null"`
	MeditationID uint32 `json:"meditationID" gorm:"column:meditation_id;not null"`
}

// TableName sets the table name
func (ScheduleMeditation) TableName() string {
	return "schedules_meditations"
}

// ScheduleSicknessNature join table for the manytomany relation between Schedule and SicknessNature tables
type ScheduleSicknessNature struct {
	SicknessNatureID uint32 `json:"sicknessNatureID" gorm:"column:sickness_nature_id;not null"`
	ScheduleID       uint32 `json:"scheduleID"       gorm:"column:schedule_id;not null"`
}

// TableName sets the table name
func (ScheduleSicknessNature) TableName() string {
	return "schedules_sickness_natures"
}

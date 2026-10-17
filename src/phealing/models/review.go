package models

import "time"

// ReviewTargetType identifies what a review refers to.
const (
	ReviewTargetDoctor = "doctor"
	ReviewTargetHealer = "healer"
)

// Review is a public rating/review for a doctor or a healer (practitioner).
//
// Ownership & moderation:
//   - PatientID (when set) records who wrote the review so the author can
//     delete or edit their own review later.
//   - Public list endpoints only return IsApproved == true.
//   - AuthorEmail is private and never exposed through the API.
type Review struct {
	ID         uint32     `json:"id" gorm:"primaryKey;autoIncrement"`
	TargetType string     `json:"targetType" gorm:"column:target_type;not null;index:idx_reviews_target"` // doctor | healer
	TargetID   uint32     `json:"targetId" gorm:"column:target_id;not null;index:idx_reviews_target"`
	Rating     uint8      `json:"rating" gorm:"column:rating;not null"` // 1..5
	Title      string     `json:"title" gorm:"column:title"`
	Comment    string     `json:"comment" gorm:"column:comment;type:text"`
	AuthorName string     `json:"authorName" gorm:"column:author_name"`
	AuthorEmail string    `json:"-" gorm:"column:author_email;index"`
	PatientID  *uint32    `json:"-" gorm:"column:patient_id;index"`
	IsApproved bool       `json:"isApproved" gorm:"column:is_approved;default:false"`
	CreatedAt  time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName sets the table name
func (Review) TableName() string {
	return "reviews"
}
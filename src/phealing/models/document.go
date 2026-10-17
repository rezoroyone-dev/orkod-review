package models

import (
	"time"
)

// Document is the database table
type Document struct {
	ID        uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	FileName  string    `json:"fileName" gorm:"column:file_name"`
	PersonID  uint32    `json:"personID" gorm:"column:person_id;not null"`
	Person    Person    `json:"person" gorm:"foreignKey:PersonID"`
	Path      string    `json:"path"`
	CreatedOn time.Time `json:"createdOn" gorm:"column:created_on;default:current_timestamp"`

	// Document Search / Auto-Tagging
	FileType     string `json:"fileType" gorm:"column:file_type"`               // MIME type (pdf, jpg, png, etc.)
	FileSize     int64  `json:"fileSize" gorm:"column:file_size"`               // File size in bytes
	ExtractedText string `json:"extractedText" gorm:"column:extracted_text;type:text"` // OCR-extracted text for search
	AutoTags     string `json:"autoTags" gorm:"column:auto_tags;type:text"`     // Auto-generated tags (comma-separated)
	ManualTags   string `json:"manualTags" gorm:"column:manual_tags;type:text"` // User-defined tags (comma-separated)
	Description  string `json:"description" gorm:"column:description;type:text"` // User-defined description
	OCRProcessed bool   `json:"ocrProcessed" gorm:"column:ocr_processed;default:false"` // Whether OCR has been run
}

// DocumentTag stores individual tags for easier querying
type DocumentTag struct {
	ID         uint32    `json:"id" gorm:"primaryKey;autoIncrement"`
	DocumentID uint32    `json:"documentID" gorm:"column:document_id;not null;index"`
	Document   Document  `json:"document" gorm:"foreignKey:DocumentID"`
	Tag        string    `json:"tag" gorm:"column:tag;not null;index"`           // Tag name
	IsAutoTag  bool      `json:"isAutoTag" gorm:"column:is_auto_tag;default:false"` // Auto-generated or manual
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName sets the table name
func (DocumentTag) TableName() string {
	return "document_tags"
}

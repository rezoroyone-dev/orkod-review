package models

// SicknessNature is the database table (categories of illnesses)
type SicknessNature struct {
	ID          uint32 `json:"id" gorm:"primaryKey;autoIncrement"`
	Description string `json:"description" gorm:"column:description"`
}

// Diagnostic is the sickness nature
type Diagnostic struct {
	ID               uint32 `json:"id" gorm:"primaryKey;autoIncrement"`
	Description      string `json:"description" gorm:"not null"`
	HealingFrequency string `json:"healingFrequency" gorm:"not null"`
	Protocol         string `json:"protocol" gorm:"not null"`
}

// TableName sets the table name
func (SicknessNature) TableName() string {
	return "sickness_natures"
}

// JSONSicknessNature is the struct
type JSONSicknessNature struct {
	ID          uint32       `json:"id"`
	Description string       `json:"description"`
	Items       []Diagnostic `json:"items"`
}

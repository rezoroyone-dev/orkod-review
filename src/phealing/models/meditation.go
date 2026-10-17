package models

// Meditation is the database table
type Meditation struct {
	ID        int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string     `json:"name" gorm:"column:name;uniqueIndex:uq_meditation_name;not null"`
	Path      string     `json:"path" gorm:"column:path;uniqueIndex:uq_meditation_path"`
	MedType   int        `json:"medType" gorm:"column:med_type;default:0"` // 0 => LINK, 1 => FILE
	Comment   string     `json:"comment"`
	Schedules []Schedule `json:"schedules" gorm:"many2many:schedules_meditations"`
}

// TableName sets the table name
func (Meditation) TableName() string {
	return "meditations"
}

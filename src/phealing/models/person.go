package models

// Person is the database table
// Note: The combination of FirstName and LastName has a case-insensitive unique constraint
// enforced by a database migration (uq_firstName_lastName_case_insensitive index)
type Person struct {
	ID           uint32      `json:"id" gorm:"primaryKey;autoIncrement"`
	FirstName    string      `json:"firstName" gorm:"column:first_name;not null"`
	LastName     string      `json:"lastName" gorm:"column:last_name;not null"`
	IsStaff      bool        `json:"isStaff" gorm:"column:is_staff;not null"`
	IsActive     bool        `json:"isActive" gorm:"column:is_active;not null"`
	Phone        string      `json:"phone" gorm:"column:phone;not null;index"`
	Email        string      `json:"email"`
	BloodGroup   string      `json:"bloodGroup" gorm:"column:blood_group"`
	City         string      `json:"city"`
	CivileStatus string      `json:"civilState" gorm:"column:civil_state"`
	BirthDate    string      `json:"birthDate" gorm:"column:birth_date"`
	Address      string      `json:"address"`
	FolderNumber string      `json:"folderNumber" gorm:"column:folder_number"`
	Schedules    []Schedule  `json:"schedules" gorm:"many2many:persons_schedules"`
	Treatments   []Treatment `gorm:"foreignKey:PersonID"`
	Weight       string      `json:"weight" gorm:"column:weight"`
	Height       string      `json:"height" gorm:"column:height"`
}

// TableName sets the table name
func (Person) TableName() string {
	return "persons"
}

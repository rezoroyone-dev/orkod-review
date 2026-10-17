package models

// Setting is a simple key/value store for global public-site switches (for
// example whether the donations feed is visible to visitors).
type Setting struct {
	Key   string `json:"key" gorm:"column:key;primaryKey"`
	Value string `json:"value" gorm:"column:value;type:text;not null"`
}

// Well-known setting keys.
const (
	SettingDonationsVisible = "donations_visible"
	SettingSessionPrice      = "session_price"
)

// TableName sets the table name
func (Setting) TableName() string {
	return "settings"
}
package models

import "time"

// SuperUser is the database table
type SuperUser struct {
	ID           uint32 `json:"id"            gorm:"primaryKey;autoIncrement"`
	UserName     string `json:"userName"      gorm:"column:user_name;uniqueIndex"`
	PassWord     string `json:"passWord,omitempty" gorm:"column:pass_word"`
	RefreshToken string `json:"refreshToken"  gorm:"column:refresh_token"`
	IsActive     bool   `json:"isActive"      gorm:"column:is_active;not null;default:true"`
	Roles        []Role `json:"roles"         gorm:"many2many:user_roles"`
	PersonID     uint32 `json:"personID"      gorm:"column:person_id;index"`
	Person       Person `json:"person"`

	// Two-Factor Authentication
	TOTPSecret     string `json:"totpSecret"     gorm:"column:totp_secret"`          // TOTP secret key
	TOTPEnabled    bool   `json:"totpEnabled"    gorm:"column:totp_enabled;default:false"` // Whether 2FA is enabled
	TOTPVerifiedAt *time.Time `json:"totpVerifiedAt" gorm:"column:totp_verified_at;type:timestamptz"` // When 2FA was verified

	// Password Reset
	PasswordResetToken  string     `json:"passwordResetToken"  gorm:"column:password_reset_token"`
	PasswordResetExpiry *time.Time `json:"passwordResetExpiry" gorm:"column:password_reset_expiry;type:timestamptz"`

	// Virtual fields for API requests - not stored in super_users table
	FirstName string   `json:"firstName" gorm:"-"`
	LastName  string   `json:"lastName"  gorm:"-"`
	Role      Role     `json:"role"      gorm:"-"`
	RoleIDs   []uint32 `json:"roleIDs"   gorm:"-"`
}

// TableName sets the table name
func (SuperUser) TableName() string {
	return "super_users"
}

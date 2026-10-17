package database

import (
	"PranicServer/models"
	"errors"
	"log"
	"os"
	"time"

	"gorm.io/gorm"
)

// MigrateDB :Migrate the schema
func MigrateDB(db *gorm.DB) {
	// dropAllTables is controlled by the DROP_ALL_TABLES env var.
	// It must be explicitly set to "true" to take effect — never enabled by default.
	dropAllTables := os.Getenv("DROP_ALL_TABLES") == "true"

	if dropAllTables {
		db.Migrator().DropTable(
			&models.Doctor{},
			&models.Review{},
			&models.HealerSpecialty{},
			&models.Donation{},
			&models.Setting{},
			&models.DocumentTag{},
			&models.NotificationLog{},
			&models.EmailTemplate{},
			&models.PatientPasswordReset{},
			&models.Patient{},
			&models.ScheduleSicknessNature{},
			&models.SicknessNature{},
			&models.PersonSchedule{},
			&models.ScheduleHealer{},
			&models.TreatmentHealer{},
			&models.ScheduleMeditation{},
			&models.Schedule{},
			&models.Treatment{},
			&models.Document{},
			&models.Healer{},
			&models.HealerAvailability{},
			&models.RolePermission{},
			&models.Role{},
			&models.Permission{},
			&models.SuperUser{},
			&models.Center{},
			&models.Person{},
			&models.Meditation{},
			&models.AuditLog{},
			&models.ContactMessage{},
		)
	}

	db.AutoMigrate(&models.Person{})

	// Apply case-insensitive unique constraint migration
	err := MigrateCaseInsensitiveUniqueConstraint(db)
	if err != nil {
		// Log the error but don't fail the entire migration
		// This allows the application to continue working even if the constraint migration fails
		log.Printf("Warning: Failed to apply case-insensitive unique constraint migration: %v\n", err)
	}
	db.AutoMigrate(&models.Permission{})
	db.AutoMigrate(&models.Role{})

	// Ensure redundant columns are removed if they were accidentally created
	if db.Migrator().HasTable(&models.SuperUser{}) && db.Migrator().HasColumn(&models.SuperUser{}, "first_name") {
		db.Migrator().DropColumn(&models.SuperUser{}, "first_name")
		db.Migrator().DropColumn(&models.SuperUser{}, "last_name")
	}
	if db.Migrator().HasTable(&models.Schedule{}) && db.Migrator().HasColumn(&models.Schedule{}, "healer_id") {
		db.Migrator().DropColumn(&models.Schedule{}, "healer_id")
	}
	if db.Migrator().HasTable(&models.Treatment{}) && db.Migrator().HasColumn(&models.Treatment{}, "healer_id") {
		db.Migrator().DropColumn(&models.Treatment{}, "healer_id")
	}

	// Ensure refresh_token column exists (added for JWT refresh token support)
	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "refresh_token") {
		db.Migrator().AddColumn(&models.SuperUser{}, "refresh_token")
	}

	// Ensure totp_secret column exists
	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "totp_secret") {
		db.Migrator().AddColumn(&models.SuperUser{}, "totp_secret")
		db.Migrator().AddColumn(&models.SuperUser{}, "totp_enabled")
		db.Migrator().AddColumn(&models.SuperUser{}, "totp_verified_at")
	}

	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "totp_enabled") {
		db.Migrator().AddColumn(&models.SuperUser{}, "totp_enabled")
	}

	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "totp_verified_at") {
		db.Migrator().AddColumn(&models.SuperUser{}, "totp_verified_at")
	}

	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "password_reset_token") {
		db.Migrator().AddColumn(&models.SuperUser{}, "password_reset_token")
	}
	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "password_reset_expiry") {
		db.Migrator().AddColumn(&models.SuperUser{}, "password_reset_expiry")
	}

	// Ensure is_active column exists and backfill existing users as active
	if db.Migrator().HasTable(&models.SuperUser{}) && !db.Migrator().HasColumn(&models.SuperUser{}, "is_active") {
		db.Migrator().AddColumn(&models.SuperUser{}, "is_active")
		// Backfill: all existing users should be active
		db.Exec("UPDATE super_users SET is_active = true WHERE is_active = false OR is_active IS NULL")
	}

	db.AutoMigrate(&models.SuperUser{})
	db.AutoMigrate(&models.Healer{})
	db.AutoMigrate(&models.HealerAvailability{})
	db.AutoMigrate(&models.Center{})
	db.AutoMigrate(&models.Meditation{})
	db.AutoMigrate(&models.Schedule{})
	db.AutoMigrate(&models.PersonSchedule{})
	db.AutoMigrate(&models.ScheduleHealer{})
	db.AutoMigrate(&models.TreatmentHealer{})
	db.AutoMigrate(&models.Treatment{})
	db.AutoMigrate(&models.Document{})
	db.AutoMigrate(&models.ScheduleMeditation{})
	db.AutoMigrate(&models.SicknessNature{})
	db.AutoMigrate(&models.ScheduleSicknessNature{})
	db.AutoMigrate(&models.AuditLog{})
	db.AutoMigrate(&models.ContactMessage{})

	// New models for features
	db.AutoMigrate(&models.Patient{})
	db.AutoMigrate(&models.PatientPasswordReset{})
	db.AutoMigrate(&models.NotificationLog{})
	db.AutoMigrate(&models.EmailTemplate{})
	db.AutoMigrate(&models.DocumentTag{})

	// Public-site models (specialty booking, doctor directory, reviews,
	// donations and global settings). Doctor has a foreign key to Person, which
	// is migrated above.
	db.AutoMigrate(&models.Setting{})
	db.AutoMigrate(&models.Doctor{})
	db.AutoMigrate(&models.Review{})
	db.AutoMigrate(&models.Donation{})
	db.AutoMigrate(&models.HealerSpecialty{})
}

// CleanupAuditLogs removes audit logs older than 2 years
func CleanupAuditLogs(db *gorm.DB) {
	if db == nil {
		return
	}
	twoYearsAgo := time.Now().AddDate(-2, 0, 0)
	db.Where("created_at < ?", twoYearsAgo).Delete(&models.AuditLog{})
}

// CreateDefaultMeditations generates and insert default meditations data into database
func CreateDefaultMeditations(db *gorm.DB) error {
	if db == nil {
		return errors.New("can not connect to database")
	}

	var count int64
	err := db.Model(&models.Meditation{}).Count(&count).Error
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	meditations := []models.Meditation{
		{Name: "Twin hearts meditation", MedType: 0, Path: "https://youtu.be/unetHhb9qp8", Comment: "Les Coeurs Jumeaux se rapportent au chakra du coeur qui est le centre du coeur émotionnel et au chakra de la couronne qui est le centre du coeur divin"},
	}

	for index := range meditations {
		err := db.Save(&meditations[index]).Error
		if err != nil {
			return err
		}
	}

	return nil
}

package database

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

// MigrateCaseInsensitiveUniqueConstraint migrates the Person table to have a case-insensitive unique constraint
// on the combination of first_name and last_name columns
func MigrateCaseInsensitiveUniqueConstraint(db *gorm.DB) error {
	if db == nil {
		return errors.New("can not connect to database")
	}

	// Check if the database is PostgreSQL
	dialector := db.Dialector.Name()
	if dialector != "postgres" {
		return fmt.Errorf("this migration is only supported for PostgreSQL, current dialect: %s", dialector)
	}

	// Drop the existing case-sensitive unique constraint
	err := db.Exec("ALTER TABLE persons DROP CONSTRAINT IF EXISTS uq_firstName_lastName").Error
	if err != nil {
		return fmt.Errorf("failed to drop existing constraint: %w", err)
	}

	// Create a new case-insensitive unique constraint using LOWER() function
	err = db.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS uq_firstName_lastName_case_insensitive 
		ON persons (LOWER(first_name), LOWER(last_name))
	`).Error
	if err != nil {
		return fmt.Errorf("failed to create case-insensitive unique constraint: %w", err)
	}

	return nil
}

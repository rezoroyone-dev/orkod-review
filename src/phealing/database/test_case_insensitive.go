package database

import (
	"log"

	"PranicServer/models"

	"gorm.io/gorm"
)

// TestCaseInsensitiveConstraint tests the case-insensitive unique constraint
func TestCaseInsensitiveConstraint(db *gorm.DB) {
	if db == nil {
		log.Println("Cannot test case-insensitive constraint: database connection is nil")
		return
	}

	// Clean up any existing test data
	db.Where("first_name LIKE ?", "Test%").Delete(&models.Person{})

	// Test 1: Create a person with "Test User"
	person1 := models.Person{
		FirstName: "Test",
		LastName:  "User",
		IsStaff:   false,
		IsActive:  true,
		Phone:     "123456789",
	}

	result1 := db.Create(&person1)
	if result1.Error != nil {
		log.Printf("Failed to create first person: %v", result1.Error)
		return
	}
	log.Printf("Successfully created person: %s %s (ID: %d)", person1.FirstName, person1.LastName, person1.ID)

	// Test 2: Try to create a person with "test user" (should fail due to case-insensitive constraint)
	person2 := models.Person{
		FirstName: "test",
		LastName:  "user",
		IsStaff:   false,
		IsActive:  true,
		Phone:     "987654321",
	}

	result2 := db.Create(&person2)
	if result2.Error != nil {
		log.Printf("Expected constraint violation for case-insensitive duplicate: %v", result2.Error)
	} else {
		log.Printf("ERROR: Case-insensitive constraint failed! Created duplicate person: %s %s (ID: %d)",
			person2.FirstName, person2.LastName, person2.ID)
		return
	}

	// Test 3: Try to create a person with "Test user" (should also fail)
	person3 := models.Person{
		FirstName: "Test",
		LastName:  "user",
		IsStaff:   false,
		IsActive:  true,
		Phone:     "555666777",
	}

	result3 := db.Create(&person3)
	if result3.Error != nil {
		log.Printf("Expected constraint violation for case-insensitive duplicate: %v", result3.Error)
	} else {
		log.Printf("ERROR: Case-insensitive constraint failed! Created duplicate person: %s %s (ID: %d)",
			person3.FirstName, person3.LastName, person3.ID)
		return
	}

	// Test 4: Create a different person (should succeed)
	person4 := models.Person{
		FirstName: "Test",
		LastName:  "User2",
		IsStaff:   false,
		IsActive:  true,
		Phone:     "111222333",
	}

	result4 := db.Create(&person4)
	if result4.Error != nil {
		log.Printf("Failed to create different person: %v", result4.Error)
	} else {
		log.Printf("Successfully created different person: %s %s (ID: %d)",
			person4.FirstName, person4.LastName, person4.ID)
	}

	// Clean up test data
	db.Delete(&person1)
	db.Delete(&person4)

	log.Println("Case-insensitive constraint test completed successfully!")
}

// PrintConstraintInfo prints information about the current constraints on the persons table
func PrintConstraintInfo(db *gorm.DB) {
	if db == nil {
		log.Println("Cannot print constraint info: database connection is nil")
		return
	}

	// Check for unique constraints on the persons table
	var constraints []struct {
		ConstraintName string
		ColumnName     string
		ConstraintType string
	}

	err := db.Raw(`
		SELECT 
			con.conname as constraint_name,
			att.attname as column_name,
			con.contype as constraint_type
		FROM pg_constraint con
		JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
		JOIN pg_class rel ON rel.oid = con.conrelid
		WHERE rel.relname = 'persons' 
		AND con.contype IN ('u', 'p')
		ORDER BY con.conname, att.attnum
	`).Scan(&constraints).Error

	if err != nil {
		log.Printf("Failed to query constraints: %v", err)
		return
	}

	log.Println("Current constraints on persons table:")
	for _, constraint := range constraints {
		constraintType := "Unknown"
		if constraint.ConstraintType == "u" {
			constraintType = "Unique"
		} else if constraint.ConstraintType == "p" {
			constraintType = "Primary Key"
		}
		log.Printf("  - %s (%s): %s", constraint.ConstraintName, constraintType, constraint.ColumnName)
	}

	// Check for indexes
	var indexes []struct {
		IndexName string
		IndexDef  string
	}

	err = db.Raw(`
		SELECT 
			indexname as index_name,
			indexdef as index_definition
		FROM pg_indexes 
		WHERE tablename = 'persons'
		AND indexname LIKE '%case_insensitive%'
		ORDER BY indexname
	`).Scan(&indexes).Error

	if err != nil {
		log.Printf("Failed to query indexes: %v", err)
		return
	}

	log.Println("Case-insensitive indexes on persons table:")
	if len(indexes) == 0 {
		log.Println("  No case-insensitive indexes found")
	} else {
		for _, index := range indexes {
			log.Printf("  - %s: %s", index.IndexName, index.IndexDef)
		}
	}
}

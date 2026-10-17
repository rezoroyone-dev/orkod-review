package auth

import (
	"PranicServer/logger"
	"PranicServer/models"
	"errors"

	"github.com/gofiber/fiber/v3/log"

	"gorm.io/gorm"
)

// SeedRolesAndPermissions ensures default roles and permissions exist
func SeedRolesAndPermissions(db *gorm.DB) {
	permissions := []string{
		"manage_users",
		"manage_roles",
		"manage_healers",
		"manage_schedules",
		"manage_centers",
		"manage_meditations",
		"view_reports",
		"book_session",
		"set_availability",
		"manage_inbox",
		"view_audit_logs",
	}

	for _, pName := range permissions {
		var p models.Permission
		if err := db.Where("name = ?", pName).First(&p).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				db.Create(&models.Permission{Name: pName})
			}
		}
	}

	roles := map[string][]string{
		"admin":     {"manage_users", "manage_roles", "manage_healers", "manage_schedules", "manage_centers", "manage_meditations", "view_reports", "book_session", "set_availability", "manage_inbox", "view_audit_logs"},
		"healer":    {"manage_schedules", "book_session", "set_availability"},
		"secretary": {"manage_healers", "manage_schedules", "book_session"},
		"patient":   {"book_session"},
	}

	for rName, pNames := range roles {
		var role models.Role
		if err := db.Where("name = ?", rName).First(&role).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				role = models.Role{Name: rName}
				db.Create(&role)
			}
		}

		for _, pName := range pNames {
			var p models.Permission
			db.Where("name = ?", pName).First(&p)

			var rp models.RolePermission
			if err := db.Where("role_id = ? AND permission_id = ?", role.ID, p.ID).First(&rp).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					db.Model(&role).Association("Permissions").Append(&p)
				}
			}
		}
	}
}

// SeedAdminUser ensures a default admin user exists
func SeedAdminUser(db *gorm.DB, adminPassword string) {
	var adminRole models.Role
	db.Where("name = ?", "admin").First(&adminRole)

	var superUser models.SuperUser
	err := db.Table("super_users").Where("user_name = ?", "admin").First(&superUser).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		panic(err)
	}

	if superUser.ID <= 0 {
		// Create Person first
		adminPerson := models.Person{
			FirstName: "Admin",
			LastName:  "Admin",
			IsStaff:   true,
			IsActive:  true,
		}
		db.Create(&adminPerson)

		superUser.UserName = "admin"
		superUser.PassWord = adminPassword
		if superUser.PassWord == "" {
			log.Fatal("FATAL: ADMIN_PASSWORD environment variable is not set. Server cannot start without a configured admin password.")
		}
		superUser.PersonID = adminPerson.ID
		pass, err := GenerateHashFromPassword(superUser.PassWord)
		if err != nil {
			log.Fatal("Error generating default user password, after initial database setup", err)
		}
		superUser.PassWord = pass
		err = db.Save(&superUser).Error
		logger.CatchError(err)

		// Assign admin role
		db.Model(&superUser).Association("Roles").Append(&adminRole)
	} else {
		// Ensure admin role is assigned
		var count int64
		db.Table("user_roles").Where("super_user_id = ? AND role_id = ?", superUser.ID, adminRole.ID).Count(&count)
		if count == 0 {
			db.Model(&superUser).Association("Roles").Append(&adminRole)
		}
	}
}

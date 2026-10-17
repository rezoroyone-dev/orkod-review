package handlers

import (
	"PranicServer/auth"
	"PranicServer/database"
	"PranicServer/models"
	"PranicServer/utilities"
	"fmt"

	"github.com/gofiber/fiber/v3"
)

// GetRoles returns all roles with their permissions
func GetRoles(c fiber.Ctx) error {
	db := database.GetDB(c)
	var roles []models.Role
	db.Preload("Permissions").Find(&roles)
	return c.JSON(roles)
}

// GetPermissions returns all available permissions
func GetPermissions(c fiber.Ctx) error {
	db := database.GetDB(c)
	var permissions []models.Permission
	db.Find(&permissions)
	return c.JSON(permissions)
}

// CreateRole creates a new role
func CreateRole(c fiber.Ctx) error {
	db := database.GetDB(c)
	role := new(models.Role)
	if err := c.Bind().Body(role); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	db.Create(&role)

	// Invalidate all permission cache since a new role with permissions may affect users
	auth.InvalidateAllPermissionCache()

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Create", "Role", role.ID, fmt.Sprintf("Created role: %s", role.Name))

	return c.JSON(role)
}

// UpdateRole updates an existing role
func UpdateRole(c fiber.Ctx) error {
	db := database.GetDB(c)
	id := c.Params("id")
	var role models.Role
	if err := db.First(&role, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role not found"})
	}

	if role.Name == "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin role is read-only"})
	}

	updateData := new(models.Role)
	if err := c.Bind().Body(updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	role.Name = updateData.Name
	db.Save(&role)

	// Update permissions (many-to-many) - lookup existing permissions by ID to avoid duplicates
	var existingPermissions []models.Permission
	for _, p := range updateData.Permissions {
		if p.ID > 0 {
			var existingPerm models.Permission
			if db.Where("id = ?", p.ID).First(&existingPerm).Error == nil {
				existingPermissions = append(existingPermissions, existingPerm)
			}
		}
	}
	db.Model(&role).Association("Permissions").Replace(existingPermissions)

	// Invalidate all permission cache since role permissions changed
	auth.InvalidateAllPermissionCache()

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Update", "Role", role.ID, fmt.Sprintf("Updated role: %s", role.Name))

	return c.JSON(role)
}

// DeleteRole deletes a role
func DeleteRole(c fiber.Ctx) error {
	db := database.GetDB(c)
	id := c.Params("id")
	var role models.Role
	if err := db.First(&role, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role not found"})
	}

	if role.Name == "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Admin role cannot be deleted"})
	}

	db.Delete(&role)

	// Invalidate all permission cache since a role was deleted
	auth.InvalidateAllPermissionCache()

	authUser := c.Locals("user").(*models.SuperUser)
	utilities.RecordAudit(db, authUser, "Delete", "Role", role.ID, fmt.Sprintf("Deleted role: %s", role.Name))

	return c.SendStatus(204)
}

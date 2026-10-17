package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// Result is the response data sent to client with healer info collected from two tables
type result struct {
	ID        uint32       `json:"id" gorm:"column:id"`
	PersonID  uint32       `json:"personID" gorm:"column:person_id"`
	Level     models.Level `json:"level" gorm:"column:level;DEFAULT:1"`
	FirstName string       `json:"firstName" gorm:"column:first_name"`
	LastName  string       `json:"lastName" gorm:"column:last_name"`
	Phone     string       `json:"phone" gorm:"column:phone"`
}

// DeleteHealer ....
func DeleteHealer(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	id := c.Params("id")

	var healer models.Healer
	err := db.Where("id = ?", id).First(&healer).Error

	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	// check first for any relatioed table entries before delete
	ok, err := okToDeleteHealer(db, healer)
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if ok {
		err = db.Where("id = ?", id).Delete(&healer).Error

		if err != nil {
			log.Debug(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	} else {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "SQL error,Failed to delete healer as it has other related entries in other tables"})
	}
	return c.JSON(fiber.Map{"id #" + id: "deleted"})
}

// okToDeleteHealer performs pre delete validation checks, if healer has entries in any of these tables: Treatment, Documents, schedule etc...
func okToDeleteHealer(db *gorm.DB, healer models.Healer) (bool, error) {
	// Treatments are now linked via the treatments_healers join table
	var treatmentHealer models.TreatmentHealer
	err := db.Where("healer_id = ?", healer.ID).First(&treatmentHealer).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}

	// Schedules are now linked via the schedule_healers join table
	var scheduleHealer models.ScheduleHealer
	err = db.Where("healer_id = ?", healer.ID).First(&scheduleHealer).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}

	if treatmentHealer.HealerID > 0 || scheduleHealer.HealerID > 0 {
		return false, nil
	}
	return true, nil
}

// CreateHealer ....
func CreateHealer(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var newHealer models.Healer
	if err := c.Bind().Body(&newHealer); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing newHealer information: " + err.Error()})
	}

	if err := db.Create(&newHealer).Error; err != nil {
		log.Debug(err)
		fmt.Println("error storing healer data in Database: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: storing healer data in Database:" + err.Error()})
	}
	var createdHealer result

	selectStatment := "healers.id,healers.level, persons.id as person_id, persons.first_name, persons.last_name, persons.phone"
	joinStatment := "INNER JOIN healers on healers.person_id = persons.id"
	err := db.Table("persons").Select(selectStatment).Joins(joinStatment).Where("healers.id = ?", newHealer.ID).Scan(&createdHealer).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(createdHealer)
}

// GetHealer ...
func GetHealer(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		log.Debug("ERROR: Can not acess database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}
	var userInfo struct {
		ID uint32 `json:"id"`
	}
	if err := c.Bind().Body(&userInfo); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing Healer ID: " + err.Error()})
	}

	var healer result
	selectStatment := "healers.id,healers.level, persons.id as person_id, persons.first_name, persons.last_name, persons.phone"
	joinStatment := "INNER JOIN healers on healers.person_id = persons.id"
	err := db.Table("persons").Select(selectStatment).Joins(joinStatment).Where("healers.id = ?", userInfo.ID).Scan(&healer).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(healer)
}

// GetAllHealers ..... supports pagination via ?page=1&limit=50
func GetAllHealers(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	page := fiber.Query[int](c, "page", 1)
	limit := fiber.Query[int](c, "limit", 200) // healers list is typically small; default 200
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 200
	}
	offset := (page - 1) * limit

	selectStatment := "healers.id,healers.level, persons.id as person_id, persons.first_name, persons.last_name, persons.phone"
	joinStatment := "INNER JOIN healers on healers.person_id = persons.id"

	var total int64
	db.Table("persons").Joins(joinStatment).Count(&total)

	var results []result
	err := db.Table("persons").Select(selectStatment).Joins(joinStatment).Order("healers.id DESC").Limit(limit).Offset(offset).Scan(&results).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":  results,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// FindHealers .....
func FindHealers(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	type QueryInfo struct {
		Query string `json:"query"`
	}
	var queryInfo QueryInfo

	if err := c.Bind().Body(&queryInfo); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Error parsing search query: " + err.Error()})
	}

	if len(queryInfo.Query) == 0 {
		log.Debug("Empy query value for queryInfo.Query")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "empy query"})
	}
	query := queryInfo.Query + "%"

	var results []result

	if err := db.Table("persons").Select("healers.id as id, healers.level, persons.id as person_id,persons.first_name,persons.last_name,persons.phone").Joins("inner join healers on healers.person_id = persons.id").Where("first_name ILIKE ?", query).Or("last_name ILIKE ?", query).Scan(&results).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(results)
}

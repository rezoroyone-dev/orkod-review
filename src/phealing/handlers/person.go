package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"errors"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// DeletePerson ....
func DeletePerson(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}
	id := c.Params("id")
	var person models.Person
	err := db.Where("id = ?", id).First(&person).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	ok, err := okToDelete(db, person)
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if ok {
		db.Unscoped().Delete(person)
	} else {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "SQL error,Failed to delete person as it has other related entries in other tables",
		})
	}
	return c.JSON(fiber.Map{"id #" + id: "deleted"})
}

// okToDelete performs pre delete validation checks, if person has entries in any of these tables: Treatment, Documents, schedule,Healer etc...
func okToDelete(db *gorm.DB, person models.Person) (bool, error) {
	var treatment models.Treatment
	var document models.Document
	var healer models.Healer

	err := db.Where("person_id = ?", person.ID).First(&treatment).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	// persons_schedules is a join table
	var count int64
	db.Table("persons_schedules").Where("person_id = ?", person.ID).Count(&count)
	if count > 0 {
		return false, nil
	}

	err = db.Where("person_id = ?", person.ID).First(&document).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}

	err = db.Where("person_id = ?", person.ID).First(&healer).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}

	if treatment.ID > 0 || document.ID > 0 || healer.ID > 0 {
		return false, nil
	}
	return true, nil
}

// UpdatePerson ....
func UpdatePerson(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}
	var person models.Person
	id := c.Params("id")

	if err := db.Where("id = ?", id).First(&person).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	if err := c.Bind().Body(&person); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unable to bind incoming user information: " + err.Error(),
		})
	}

	// Checking if same user exists before based on firstName and lastName
	var existingPerson models.Person
	firstName := person.FirstName
	lastName := person.LastName

	err := db.Where("first_name ILIKE ? AND last_name ILIKE ? AND id != ?", firstName, lastName, id).First(&existingPerson).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if existingPerson.ID > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "person will not be updated as an existing one has the same first and last name",
		})
	}

	err = db.Save(&person).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(person)
}

// CreatePerson ....
func CreatePerson(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}
	var person models.Person

	if err := c.Bind().Body(&person); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ERROR: parsing person data: " + err.Error(),
		})
	}

	// Checking if same user exists before based on firstName and lastName
	var existingPerson models.Person
	firstName := person.FirstName
	lastName := person.LastName

	err := db.Model(&models.Person{}).Where("first_name ILIKE ? AND last_name ILIKE ?", firstName, lastName).First(&existingPerson).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if existingPerson.ID > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "New person will not be added as an existing one has the same first and last name",
		})
	}

	if creationError := db.Create(&person).Error; creationError != nil {
		log.Debug(creationError)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ERROR: storing person data in Database:" + creationError.Error(),
		})
	}
	return c.JSON(person)
}

// GetPerson ...
func GetPerson(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		log.Debug("ERROR: Can not access database, please try again later")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}
	id := c.Params("id")
	var person models.Person
	if err := db.Where("id = ?", id).First(&person).Error; err != nil {
		log.Debug("Error fetching person:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(person)
}

// GetPersons ..... supports pagination via ?page=1&limit=50
func GetPersons(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	page := fiber.Query[int](c, "page", 1)
	limit := fiber.Query[int](c, "limit", 50)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 500 {
		limit = 50
	}
	offset := (page - 1) * limit

	var persons []models.Person
	var total int64
	db.Model(&models.Person{}).Count(&total)
	if err := db.Limit(limit).Offset(offset).Find(&persons).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":  persons,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// Search .....
func Search(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ERROR: Can not access database, please try again later",
		})
	}

	type QueryInfo struct {
		Query string `json:"query"`
	}
	var queryInfo QueryInfo

	if err := c.Bind().Body(&queryInfo); err != nil {
		log.Debug("Error parsing search query: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Error parsing search query: " + err.Error(),
		})
	}

	if len(queryInfo.Query) == 0 {
		log.Debug("empty query")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "empty query"})
	}
	query := queryInfo.Query + "%"
	var persons []models.Person
	if err := db.Where("first_name ILIKE ?", query).Or("last_name ILIKE ?", query).Find(&persons).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(persons)
}

package test

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/models"
	"PranicServer/utilities"
	"errors"
	"math/rand"
	"time"
)

// Result ....
type Result struct {
	ID uint32
	// PersonID      uint32
	FirstName string
	LastName  string
	Phone     string
}

func main2() {
	/*
		t := time.Now()
		rounded := time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), 0, t.Location())
		fmt.Println(t)
		fmt.Println(rounded.Format(time.RFC3339))

		// currentTime := time.Now().Truncate(time.Millisecond)
		// fmt.Println("Time is ", currentTime.Format(time.RFC3339))
		//test()
	*/
}

func testLicenseFromMotherBoardSerial() {
	// mbSerial := ghw.BaseboardInfo.SerialNumber
	// fmt.Println("mBSerial", mbSerial)
}

// PopulateDemoData is a test function to generate and insert demo data into database
func PopulateDemoData() error {
	var err error
	db := database.GetConnection()
	if db == nil {
		return errors.New("Can not connect to Database")
	}

	// Note the use of tx as the database handle once you are within a transaction
	if err = db.Error; err != nil {
		return err
	}

	persons := []models.Person{
		{FirstName: "Sample01", LastName: "Person01", Phone: "0000000001", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample02", LastName: "Person02", Phone: "0000000002", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample03", LastName: "Person03", Phone: "0000000003", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample04", LastName: "Person04", Phone: "0000000004", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample05", LastName: "Person05", Phone: "0000000005", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample06", LastName: "Person06", Phone: "0000000006", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample07", LastName: "Person07", Phone: "0000000007", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample08", LastName: "Person08", Phone: "0000000008", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample09", LastName: "Person09", Phone: "0000000009", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample10", LastName: "Person10", Phone: "0000000010", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample11", LastName: "Person11", Phone: "0000000011", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample12", LastName: "Person12", Phone: "0000000012", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample13", LastName: "Person13", Phone: "0000000013", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample14", LastName: "Person14", Phone: "0000000014", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample15", LastName: "Person15", Phone: "0000000015", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample16", LastName: "Person16", Phone: "0000000016", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample17", LastName: "Person17", Phone: "0000000017", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample18", LastName: "Person18", Phone: "0000000018", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample19", LastName: "Person19", Phone: "0000000019", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample20", LastName: "Person20", Phone: "0000000020", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample21", LastName: "Person21", Phone: "0000000021", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample22", LastName: "Person22", Phone: "0000000022", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample23", LastName: "Person23", Phone: "0000000023", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample24", LastName: "Person24", Phone: "0000000024", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
	}

	for index := range persons {
		if err := db.Create(&persons[index]).Error; err != nil {
			return err
		}
	}

	var person models.Person
	err = db.Model(&models.Person{}).First(&person).Error
	logger.CatchError(err)

	var healer models.Healer
	healer = models.Healer{PersonID: person.ID}
	// db.Model(&healer).Association("Person").Append(&person)
	// err = db.Model(&person).Association("PersonID").Append(healer).Error
	// catchError(err)

	if err := db.Save(&healer).Error; err != nil {
		return err
	}

	var asmaa models.Person = persons[3]

	treatments := []models.Treatment{
		{Healers: []models.Healer{healer}, Diagnostic: 3, Nature: 2, TotalCost: 2000, Payed: 500, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "Local", Comment: "This is a treatment comment"},
		{Healers: []models.Healer{healer}, Diagnostic: 4, Nature: 1, TotalCost: 1500, Payed: 350, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "remote", Comment: "This is a treatment comment 2"},
		{Healers: []models.Healer{healer}, Diagnostic: 5, Nature: 3, TotalCost: 2000, Payed: 2000, PersonID: asmaa.ID, StartTime: "11:30", Status: "OPEN", Mode: "Local", Comment: "This is a treatment comment 3"},
		{Healers: []models.Healer{healer}, Diagnostic: 6, Nature: 2, TotalCost: 3500, Payed: 2580, PersonID: asmaa.ID, StartTime: "11:30", Status: "closed", Mode: "REMOTE", Comment: "This is a treatment comment 4"},
		{Healers: []models.Healer{healer}, Diagnostic: 7, Nature: 2, TotalCost: 1500, Payed: 850, PersonID: asmaa.ID, StartTime: "11:30", Status: "open", Mode: "Local", Comment: "This is a treatment comment 5"},
		{Healers: []models.Healer{healer}, Diagnostic: 8, Nature: 2, TotalCost: 450, Payed: 350, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "remote", Comment: "This is a treatment comment 6"},
		{Healers: []models.Healer{healer}, Diagnostic: 9, Nature: 2, TotalCost: 750, Payed: 340, PersonID: asmaa.ID, StartTime: "11:30", Status: "Open", Mode: "Local", Comment: "This is a treatment comment 7"},
		{Healers: []models.Healer{healer}, Diagnostic: 10, Nature: 4, TotalCost: 820, Payed: 387, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "Remote", Comment: "This is a treatment comment 8"},
		{Healers: []models.Healer{healer}, Diagnostic: 11, Nature: 2, TotalCost: 500, Payed: 500, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "LOCAL", Comment: "This is a treatment comment 9"},
		{Healers: []models.Healer{healer}, Diagnostic: 12, Nature: 2, TotalCost: 2000, Payed: 1780, PersonID: asmaa.ID, StartTime: "11:30", Status: "open", Mode: "Local", Comment: "This is a treatment comment 10"},
		{Healers: []models.Healer{healer}, Diagnostic: 13, Nature: 3, TotalCost: 1525.5, Payed: 728, PersonID: asmaa.ID, StartTime: "11:30", Status: "open", Mode: "remote", Comment: "This is a treatment comment 11"},
		{Healers: []models.Healer{healer}, Diagnostic: 14, Nature: 2, TotalCost: 358.258, Payed: 254, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "Local", Comment: "This is a treatment comment 12"},
		{Healers: []models.Healer{healer}, Diagnostic: 15, Nature: 1, TotalCost: 127.658, Payed: 56, PersonID: asmaa.ID, StartTime: "11:30", Status: "open", Mode: "remote", Comment: "This is a treatment comment 13"},
		{Healers: []models.Healer{healer}, Diagnostic: 16, Nature: 2, TotalCost: 10500.258, Payed: 8000, PersonID: asmaa.ID, StartTime: "11:30", Status: "Closed", Mode: "Local", Comment: "This is a treatment comment 14"},
	}

	healers := []models.Healer{healer}
	schedules := []models.Schedule{
		{Title: "1st Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Luxor" */},
		{Title: "2nd Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Cairo" */},
		{Title: "3rd Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Rabat" */},
		{Title: "4th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "SalÃ©" */},
		{Title: "5th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Egypt" */},
		{Title: "6th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Morocco" */},
		{Title: "7th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Asfi" */},
		{Title: "8th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Assuit" */},
		{Title: "9th Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Luxor" */},
		{Title: "10th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Cairo" */},
		{Title: "11th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Rabat" */},
		{Title: "12th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "SalÃ©" */},
		{Title: "13th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Egypt" */},
		{Title: "14th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Morocco" */},
		{Title: "15th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Asfi" */},
		{Title: "16th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Assuit" */},
		{Title: "17th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Luxor" */},
		{Title: "18th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Cairo" */},
		{Title: "19th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Rabat" */},
		{Title: "20th Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "SalÃ©" */},
		{Title: "21st Scedule", CalendarID: 1, Busy: false, Healers: healers /*  Location: "Egypt" */},
		{Title: "22 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Luxor" */},
		{Title: "23 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Cairo" */},
		{Title: "24 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Rabat" */},
		{Title: "25 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "SalÃ©" */},
		{Title: "26 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Egypt" */},
		{Title: "27 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Morocco" */},
		{Title: "28 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Asfi" */},
		{Title: "29 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Luxor" */},
		{Title: "30 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Cairo" */},
		{Title: "31 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Rabat" */},
		{Title: "32 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "SalÃ©" */},
		{Title: "33 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Egypt" */},
		{Title: "34 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Morocco" */},
		{Title: "35 Scedule", CalendarID: 1, Busy: false, Healers: healers /* Location: "Asfi" */},
	}

	colorIndex := 0
	start := time.Now()
	stIndex := 3
	for index := range schedules {
		schedules[index].StartDate = start
		schedules[index].EndDate = start.Add(30 * time.Minute)
		if stIndex >= (len(persons) - 10) {
			stIndex = 3
		}
		var inc int = 0
		if index%2 == 0 {
			inc = 2
		} else {
			inc = 1
		}
		var number int = rand.Intn(stIndex) + 3
		var attendees []models.Person = persons[number:(number + inc)]
		schedules[index].Attendees = attendees
		if colorIndex >= len(models.SchedulesBgColors) {
			colorIndex = 0
		}
		schedules[index].BgColor = models.SchedulesBgColors[colorIndex]
		// schedules[index].Color = "white"
		if schedules[index].CenterID <= 0 {
			err = db.Model(&models.Schedule{}).Omit("center_id", "center").Save(&schedules[index]).Error
		} else {
			err = db.Save(&schedules[index]).Error
		}
		if err != nil {
			return err
		}
		start = start.Add(4 * time.Hour)
		colorIndex++
		stIndex++
	}

	start = time.Now()
	for index := range treatments {
		treatments[index].StartDate = start.Add(60 * time.Minute)
		// schedule.HealerID = 0
		if err := db.Save(&treatments[index]).Error; err != nil {
			return err
		}
		start = start.Add(1 * time.Hour)
	}

	parentDir := config.GetDataRoot()
	pathSep := utilities.GetPathSeparator()

	meditations := []models.Meditation{
		{Name: "MEDITATION AUTO", MedType: 0, Path: "https://youtu.be/unetHhb9qp8", Comment: "La relaxation la plus profonde et la baisse du stress"},
		{Name: "Twin hearts meditation", MedType: 1, Path: parentDir + pathSep + "mediaFiles/fatiha", Comment: "Les Coeurs Jumeaux se rapportent au chakra du coeur qui est le centre du coeur Ã©motionnel et au chakra de la couronne qui est le centre du coeur divin"},
		{Name: "Meditation G.chakral", MedType: 1, Path: parentDir + pathSep + "mediaFiles/falaq", Comment: "5th Chakra Tone for healing and adjustment"},
	}

	for index := range meditations {
		// meditations[index].ManagerID = person.ID
		err := db.Save(&meditations[index]).Error
		logger.CatchError(err)
	}

	/*
		var personSchedule models.PersonSchedule

		var firstSchedule models.Schedule
		db.Model(&models.Schedule{}).First(&firstSchedule)

		personSchedule = models.PersonSchedule{PersonID: person.ID, ScheduleID: firstSchedule.ID}

		err = db.Create(&personSchedule).Error
		if err != nil {
			return err
		}
	*/
	// db.Model(&schedule.Persons).Preload(column string, conditions ...interface{})

	centers := []models.Center{
		{Name: "First Center", City: "Rabat", Address: "Success street", ManagerName: person.FirstName + " " + person.LastName, Email: "test@mail.com", Phone: "00212564564564", Photo: "public/images/Chakras.jpg"},
		{Name: "Second Center", City: "Rabat", ManagerName: person.FirstName + " " + person.LastName, Phone: "+21222500037", Email: "pranic@gEmail.com", Address: "rue lune rabat"},
		{Name: "Third Center", City: "Luxor", ManagerName: person.FirstName + " " + person.LastName, Phone: "+21222500037", Email: "pranic@gEmail.com", Address: "rue lune rabat", Photo: "public/images/Chakras.jpg"},
		{Name: "Fourth Center", City: "Cairo", ManagerName: person.FirstName + " " + person.LastName, Phone: "+21222500037", Email: "pranic@gEmail.com", Address: "rue lune rabat"},
		{Name: "Fifth Center", City: "Casablanca", ManagerName: person.FirstName + " " + person.LastName, Phone: "+21222500037", Email: "pranic@gEmail.com", Address: "rue lune rabat", Photo: "public/images/Chakras.jpg"},
	}

	for index := range centers {
		// centers[index].ManagerID = person.ID
		err := db.Save(&centers[index]).Error
		logger.CatchError(err)
	}
	/*
		// using a struct then select query to map to this struct after this construct the main struct with Manager sub struct injected and send the results back to front end
		type centerOut struct {
			//gorm.Model
			ID        uint32 `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
			ManagerID uint32 `json:"manager_id" gorm:"column:manager_id;not null"`
			Name      string `json:"name" gorm:"column:name;unique_index:uq_CenterName;not null"`
			Phone     string `json:"phone" gorm:"column:phone;not null"`
			Email     string `json:"email"`
			Address   string `json:"address"`
			City      string `json:"city"`
			Photo     string `json:"photo" gorm:"column:photo"`

			ManagerFirstName string `json:"managerFirstName" gorm:"column:manager_first_name;not null"`
			ManagerLastName  string `json:"managerLastName" gorm:"column:manager_last_name;not null"`
		}
		var cenOut centerOut
		err = db.Raw("SELECT * from centers,persons WHERE centers.manager_id = persons.id and centers.id =?", centers[0].ID).Scan(&cenOut).Error
		catchError(err)
		log.Debug(cenOut)

		centerManager := models.Person{ID: cenOut.ManagerID, FirstName: cenOut.ManagerFirstName, LastName: cenOut.ManagerLastName}
		center := models.Center{ID: cenOut.ID, Manager: centerManager, Name: cenOut.Name, City: cenOut.City, Email: cenOut.Email, Address: cenOut.Address, ManagerID: cenOut.ManagerID, Phone: cenOut.Phone, Photo: cenOut.Photo}

		log.Debug(center)
	*/
	return nil
}

/* // PopulateDemoData is a test function to generate and insert demo data into database
func PopulateDemoData() error {
	db := database.GetConnection()
	if db == nil {
		return errors.New("Can not connect to Database")
	}

	// Note the use of tx as the database handle once you are within a transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	persons := []models.Person{
		{FirstName: "Sample25", LastName: "Person25", Phone: "0000000025", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample26", LastName: "Person26", Phone: "0000000026", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample27", LastName: "Person27", Phone: "0000000027", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
		{FirstName: "Sample28", LastName: "Person28", Phone: "0000000028", Address: "Sample City", BirthDate: "01-01-1990", BloodGroup: "O+"},
	}

	for _, person := range persons {
		if err := tx.Create(&person).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	var person models.Person
	tx.Model(&models.Person{}).First(&person)

	var healer models.Healer
	// healer = models.Healer{PersonID: person.ID}
	// tx.Model(&healer).Association("Person").Append(&person)
	tx.Model(&healer).Association("PersonID").Append(person.ID)
	if err := tx.Save(&healer).Error; err != nil {
		tx.Rollback()
		return err
	}

	schedules := []models.Schedule{
		{Title: "First Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "2nd Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "3rd Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "4th Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "5th Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "6th Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
		{Title: "7th Scedule", CalendarID: 1, Busy: false, HealerID: healer.ID, Location: "Luxor"},
	}

	start := time.Now()
	for _, schedule := range schedules {
		schedule.StartDate = start
		schedule.EndDate = start.Add(30 * time.Minute)
		tx.Model(&schedule).Association("Attendees").Append(&persons)
		// schedule.Attendees = persons
		if err := tx.Create(&schedule).Error; err != nil {
			tx.Rollback()
			return err
		}
		start = start.Add(1 * time.Hour)
	}

	var personSchedule models.PersonSchedule

	var firstSchedule models.Schedule
	tx.Model(&models.Schedule{}).First(&firstSchedule)

	personSchedule = models.PersonSchedule{PersonID: person.ID, ScheduleID: firstSchedule.ID}

	err := tx.Create(&personSchedule).Error
	if err != nil {
		tx.Rollback()
		return err
	}
	// db.Model(&schedule.Persons).Preload(column string, conditions ...interface{})
	return tx.Commit().Error
}
*/

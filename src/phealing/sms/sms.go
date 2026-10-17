package sms

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/models"
	"PranicServer/services"
	"PranicServer/utilities"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
)

var jsonFileName string = config.GetDataRoot() + utilities.GetPathSeparator() + "smsTemplates.json"

// SMS is the patientsSchedules
type SMS struct {
	//gorm.Model
	ScheduleID      uint32    `json:"scheduleID" gorm:"column:schedule_id"`
	PatientsPhones  string    `json:"patientsPhones" gorm:"column:patients_phones"` // phones splitted by comma
	PatientsNames   string    `json:"patientsNames" gorm:"column:patients_names"`   // full names splitted by comma
	HealerPhone     string    `json:"healerPhone" gorm:"column:healer_phone"`
	StartDate       time.Time `json:"startDate" gorm:"column:start_date"`
	CenterName      string    `json:"centerName" gorm:"column:center_name"`
	CenterAddress   string    `json:"centerAddress" gorm:"column:center_address"`
	HealerName      string    `json:"healerName" gorm:"column:healer_name"`
	Meditations     string    `json:"meditations" gorm:"column:meditations"`
	SicknessNatures string    `json:"sicknessNatures" gorm:"column:sickness_natures"`
	Message         string    `json:"message" gorm:"column:message"`
}

// TableName sets the table name
func (SMS) TableName() string {
	return "sms"
}

// Template is the SMS template
type Template struct {
	ID   uint32 `json:"id"`
	Lang string `json:"lang"`
	Text string `json:"text"`
}

// GetServerIP returns server IP Address to be used in the SMS APP
func GetServerIP(c fiber.Ctx) error {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to get server IP, Make sure you are connected to local network or the internet")
	if err != nil {
		return nil
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	strAddr := localAddr.IP.To4().String()

	return c.JSON(strAddr)
}

// GetAllSMS collects all sms messages to be sent to the mobile app
func GetAllSMS(c fiber.Ctx) error {
	var err error
	db := database.GetConnection()
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	oneDay := 24 * time.Hour
	start := time.Now()
	year, month, day := start.Date()
	hour := start.Hour()
	minute := start.Minute() + 5

	start = time.Date(year, month, day, hour, minute, 0, 0, start.Location())

	end := time.Now().Add(oneDay)
	end = time.Date(end.Year(), end.Month(), end.Day(), 8, 0, 0, 0, start.Location())

	var msgs []SMS
	msgs, err = getSmsSchedulesByRange(start, end)
	logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to collect schedules for SMS clients")
	if err != nil {
		return nil
	}

	sms, err := getDefaultTemplate()
	if err != nil {
		log.Debug("Failed to get Default template text " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	for i := 0; i < len(msgs); i++ {
		var timeStamp string = msgs[i].StartDate.Local().Format("15:04 02-01-2006")
		msgs[i].Message = strings.ReplaceAll(sms.Text, "<TIME>", timeStamp)
	}
	return c.JSON(msgs)
}

// getPatientsSchedulesByRange returns the Patients schedules for a specific range
func getSmsSchedulesByRange(startDate time.Time, endDate time.Time) ([]SMS, error) {
	var err error = nil
	var schedules []SMS
	db := database.GetConnection()
	if db == nil {
		err = errors.New("ERROR: Can not acess database, please try again later")
		return schedules, err
	}

	var query string = `  select
	schedules.id as schedules_id,
	schedules.start_date,
	string_agg(patients.phone, ',') as patients_phones,
	string_agg(patients.patient_name,',') as patients_names,  
	healer.healer_name,
	healer.healer_phone,
	centers.name as center_name,
	centers.address as center_address,
	med.meditations as meditations,
	snature.natures as sickness_natures
	from schedules
	left join (
		select
			schedules.id as sched_id, persons.id as person_id, persons.phone, concat(persons.first_name, ' ' , persons.last_name) as patient_name
		from
			persons, schedules, persons_schedules
		where
			( persons_schedules.person_id = persons.id
			and persons_schedules.schedule_id = schedules.id )
		order by
			sched_id ) as patients on
		patients.sched_id = schedules.id
	left join centers on
		schedules.center_id = centers.id
	left join (
		select
			string_agg(concat(meditations.name, ' ', meditations.path), ' , ') as meditations , schedules_meditations.schedule_id as schedules_meditations_schedule_id
		from
			meditations, schedules, schedules_meditations
		where
			( meditations.id = schedules_meditations.meditation_id
			and schedules_meditations.schedule_id = schedules.id )
		group by schedules_meditations_schedule_id ) as med on med.schedules_meditations_schedule_id = schedules.id
			left join (
		select 	healers.id as healer_id,concat(persons.first_name, ' ' , persons.last_name) as healer_name, persons.phone as healer_phone
		from healers,persons
		where healers.person_id = persons.id 
		) as healer on	schedules.healer_id = healer.healer_id
		left join (
		select
			string_agg(sickness_natures.id::text , ',' ) as natures , schedules_sickness_natures.schedule_id as schedules_sickness_natures_schedule_id
		from
			sickness_natures, schedules, schedules_sickness_natures
		where
			( sickness_natures.id = schedules_sickness_natures.sickness_nature_id 
			and schedules_sickness_natures.schedule_id = schedules.id )
		group by schedules_sickness_natures_schedule_id 
		) as snature on snature.schedules_sickness_natures_schedule_id = schedules.id	
	where start_date >= ? AND end_date <= ?
	group by
		schedules.id,
		schedules.start_date,
		centers.name,
		centers.address,
		med.meditations,
		healer.healer_name,
		healer.healer_phone,
		snature.natures
	order by
		schedules.id asc
	`
	err = db.Raw(query, startDate, endDate).Find(&schedules).Error
	if err != nil {
		return nil, err
	}

	sms, err := getDefaultTemplate()
	if err != nil {
		return nil, err
	}
	var lang string = sms.Lang
	var sickNature models.JSONSicknessNature

	for i := 0; i < len(schedules); i++ {
		var sickNatures string = ""
		naturesIDList := strings.Split(schedules[i].SicknessNatures, ",")
		if len(naturesIDList) == 1 && naturesIDList[0] == "" {
			continue
		}
		for j := 0; j < len(naturesIDList); j++ {
			id, err := strconv.Atoi(naturesIDList[j])
			if err != nil {
				return schedules, err
			}
			sickNature, err = services.GetSicknessNature(uint32(id), lang)
			if err != nil {
				return schedules, err
			}
			if sickNature.Description != "" {
				if sickNatures != "" {
					sickNatures += ", " + sickNature.Description
				} else {
					sickNatures += sickNature.Description
				}
			}

		}
		schedules[i].SicknessNatures = sickNatures
	}

	return schedules, err
}

func getDefaultTemplate() (Template, error) {
	var template Template = Template{}
	var err error

	type SmsTemplates struct {
		UsedLanguage string     `json:"usedLanguage"`
		Templates    []Template `json:"templates"`
	}

	var smsTemplates SmsTemplates

	smsTemplatesFile, err := os.Open(jsonFileName)
	if err != nil {
		log.Debug("Error opening SMS Templates JSON file " + err.Error())
		return template, err
	}

	defer smsTemplatesFile.Close()

	bytesFileContent, err := ioutil.ReadAll(smsTemplatesFile)

	if err != nil {
		log.Debug("Error reading SMS Templates JSON file " + err.Error())
		return template, err
	}

	err = json.Unmarshal(bytesFileContent, &smsTemplates)

	if err != nil {
		log.Debug("Error Parsing SMS Templates JSON file into templates structur" + err.Error())
		return template, nil
	}

	var usedLang string = smsTemplates.UsedLanguage
	if usedLang == "" { // no default template was selected so we just exit without noise
		return template, nil
	}

	var templates []Template = smsTemplates.Templates

	for i := 0; i < len(templates); i++ {
		var lang string = templates[i].Lang
		if usedLang == lang {
			template = templates[i]
		}
	}
	return template, nil
}

// GetSmsTemplates returns the JSON representation of the SMS Templates file smsTemplates.json
func GetSmsTemplates(c fiber.Ctx) error {
	var err error

	type Template struct {
		ID   uint32 `json:"id"`
		Lang string `json:"lang"`
		Text string `json:"text"`
	}
	type SmsTemplates struct {
		UsedLanguage string     `json:"usedLanguage"`
		Templates    []Template `json:"templates"`
	}

	var smsTemplates SmsTemplates

	smsTemplatesFile, err := os.Open(jsonFileName)
	if err != nil {
		log.Debug("Error opening SMS Templates JSON file " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer smsTemplatesFile.Close()

	bytesFileContent, err := ioutil.ReadAll(smsTemplatesFile)

	if err != nil {
		log.Debug("Error reading SMS Templates JSON file " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	err = json.Unmarshal(bytesFileContent, &smsTemplates)

	if err != nil {
		log.Debug("Error Parsing SMS Templates JSON file into templates structur" + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(smsTemplates)
}

// SaveSmsTemplates Writes the SMS Templates file smsTemplates.json based on the incoming JSON representation from client
func SaveSmsTemplates(c fiber.Ctx) error {
	var err error

	type Template struct {
		ID   uint32 `json:"id"`
		Lang string `json:"lang"`
		Text string `json:"text"`
	}

	type SmsTemplates struct {
		UsedLanguage string     `json:"usedLanguage"`
		Templates    []Template `json:"templates"`
	}

	var smsTemplates SmsTemplates

	if err := c.Bind().Body(&smsTemplates); err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing smsTemplates: " + err.Error()})
	}

	jsonString, err := json.Marshal(&smsTemplates)

	if err != nil {
		log.Debug("Error decoding SMS Templates " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	err = ioutil.WriteFile(jsonFileName, jsonString, os.ModePerm)
	if err != nil {
		log.Debug("Error Wrtiting SMS Templates JSON file " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(smsTemplates)
}

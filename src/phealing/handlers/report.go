package handlers

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/export"
	"PranicServer/logger"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"time"

	"github.com/gofiber/fiber/v3"
)

// GetTreatmentsReportData returns table data for treatments report
func GetTreatmentsReportData(c fiber.Ctx) error {

	// TreatmentsTableEntry is the response structure for treatment report table
	type TreatmentsTableEntry struct {
		// gorm.Model
		ID uint32 `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
		// PersonID     uint32      `json:"personId" gorm:"column:personID"
		Nature     uint32 `json:"nature" gorm:"required;Not Null"` // treatment nature de soin, description
		Diagnostic uint32 `json:"diagnostic" gorm:"required;Not Null"`
		Status     string `json:"status" gorm:"required;Not Null"` // closed open inprogress
		// Comment    string    `json:"comment"`
		StartDate time.Time `json:"startDate" gorm:"column:start_date;required;Not Null"`
		// StartTime  string    `json:"startTime" gorm:"column:startTime;required;Not Null"`
		TotalCost float32 `json:"totalCost" gorm:"column:total_cost;required;Not Null"`
		Payed     float32 `json:"payed" gorm:"required;Not Null"`
		// Mode       uint32      `json:"mode"`
		// HealerID   uint32      `json:"healerID" gorm:"column:healerID;required;Not Null"`

		PatientFN string `json:"patientFN" gorm:"column:patient_fn"`
		PatientLN string `json:"patientLN" gorm:"column:patient_ln"`

		HealerFN string `json:"healerFN" gorm:"column:healer_fn"`
		HealerLN string `json:"healerLN" gorm:"column:healer_ln"`
	}

	var err error
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	type QueryData struct {
		HealerID  int    `json:"healerID"  `
		Status    string `json:"status"    `
		StartDate string `json:"startDate" `
		EndDate   string `json:"endDate"   `
	}

	var queryData QueryData
	if err := c.Bind().Body(&queryData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing Treatments report query parameters:\n" + err.Error()})
	}
	healerID := queryData.HealerID
	status := queryData.Status
	startDate := queryData.StartDate
	endDate := queryData.EndDate

	var tableData []TreatmentsTableEntry
	var queryStr string
	// SQLite support was removed; always use PostgreSQL query
	if true {
		queryStr = "SELECT A.id, A.status , A.total_cost, A.payed, A.start_date,A.nature,A.diagnostic,"
		queryStr += " STRING_AGG(COALESCE(B.healer_fn, '') || ' ' || COALESCE(B.healer_ln, ''), ', ') as healer_fn,"
		queryStr += " C.first_name as patient_fn, C.last_name as patient_ln"
		queryStr += "     FROM treatments A"
		queryStr += " LEFT OUTER JOIN treatments_healers TH on A.id = TH.treatment_id"
		queryStr += " LEFT OUTER JOIN (SELECT healers.id, persons.first_name as healer_fn, persons.last_name as healer_ln FROM healers JOIN persons ON healers.person_id = persons.id) B ON TH.healer_id = B.id"
		queryStr += " LEFT OUTER JOIN persons C ON C.id = A.person_id"
		queryStr += " WHERE A.start_date >= ? AND A.start_date <= ?"
		if !strings.EqualFold(status, "All") {
			queryStr += " AND UPPER(A.status) LIKE UPPER(?)"
		}
		if healerID != -1 {
			queryStr += " AND EXISTS (SELECT 1 FROM treatments_healers WHERE treatment_id = A.id AND healer_id = ?)"
		}
		queryStr += " GROUP BY A.id, C.first_name, C.last_name"
	}

	if !strings.EqualFold(status, "All") && healerID != -1 { // -1 is for the case when no user is selected
		err = db.Raw(queryStr, startDate, endDate, status, healerID).Scan(&tableData).Error
	} else if strings.EqualFold(status, "All") && healerID == -1 { // if both were not set
		err = db.Raw(queryStr, startDate, endDate).Scan(&tableData).Error
	} else if !strings.EqualFold(status, "All") && healerID == -1 { // if only status was set
		err = db.Raw(queryStr, startDate, endDate, status).Scan(&tableData).Error
	} else if strings.EqualFold(status, "All") && healerID != -1 { // if only healerID was set
		err = db.Raw(queryStr, startDate, endDate, healerID).Scan(&tableData).Error
	}
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		return c.JSON(tableData)
	}
}

// GetPatientsReportData returns table data for Patients report
func GetPatientsReportData(c fiber.Ctx) error {

	// PatientsTableEntry is the response structure for Patients report table
	type PatientsTableEntry struct {
		FirstName string `json:"firstName" gorm:"column:first_name"`
		LastName  string `json:"lastName" gorm:"column:last_name"`
		Phone     string `json:"phone" gorm:"column:phone"`
	}
	var err error
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	var tableData []PatientsTableEntry
	err = db.Table("persons").Select("first_name,last_name,phone").Where("persons.id NOT in (select person_id from healers)").Scan(&tableData).Error
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	} else {
		return c.JSON(tableData)
	}
}

// ExportToExcel exports data to excel file and sends back the file to client
func ExportToExcel(c fiber.Ctx) error {
	type QueryData struct {
		Cels [][]string `json:"cels"`
	}

	var data QueryData
	if err := c.Bind().Body(&data); err != nil {
		logger.CatchJSONError(fiber.StatusBadRequest, c, err, "error parsing report data")
		return nil
	}

	var filePath = config.GetDataRoot() + "/uploadedFiles/Report.xlsx"
	if err := export.CreateExcelFile(data.Cels, filePath); err != nil {
		logger.CatchJSONError(fiber.StatusInternalServerError, c, err, "Failed to generate Excel report")
		return nil
	}
	return c.JSON(fiber.Map{"message": "Report generated successfully, go ahead and downlod it now"})
}

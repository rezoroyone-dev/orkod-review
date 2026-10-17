package export

import (
	"PranicServer/utilities"
	"strconv"
	"strings"

	"github.com/360EntSecGroup-Skylar/excelize"
)

// abc are the upper case characts from A to Z
const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

func toCharStrConst(i int) string {
	return abc[i-1 : i]
}

func main() {
	/* var cels [][]string = [][]string{
		{"firstName", "lastName", "phone"},
		{"Sample", "Person", ""},
		{"Sample2", "Person", "5555555555"},
		{"", "Person", ""},
		{"", "Person", "0021264585255"},
	}
	var filePath = "tmp/Report.xlsx"
	CreateExcelFile(cels, filePath) */
}

// CreateExcelFile generates an Excel file from provided two dim. array of strings and saves the file to filePath
func CreateExcelFile(cels [][]string, filePath string) (err error) {
	var numberOfColumns int = len(cels[0])
	var numberOfRows int = len(cels)
	// fmt.Println("numberOfColumns ", numberOfColumns)
	// fmt.Println("numberOfRows ", numberOfRows)

	// for i := 1; i <= 26; i++ {
	// 	fmt.Println(i, toCharStrConst(i))
	// }

	f := excelize.NewFile()

	abcIndex := 1
	numberIndex := 1
	for i := 0; i < numberOfRows; i++ {
		for j := 0; j < numberOfColumns; j++ {
			celValueString := cels[i][j]
			// fmt.Println(toCharStrConst(abcIndex)+strconv.Itoa(numberIndex), cels[i][j])
			isNumber, value := utilities.IsNumeric(celValueString)
			if !isNumber || strings.HasPrefix(celValueString, "0") || strings.HasPrefix(celValueString, "+") { // chzcking to see if the value is a phone number so it will be treated as a string NOT a number
				f.SetCellStr("Sheet1", toCharStrConst(abcIndex)+strconv.Itoa(numberIndex), celValueString)
			} else {
				f.SetCellValue("Sheet1", toCharStrConst(abcIndex)+strconv.Itoa(numberIndex), value)
			}
			// if err != nil {
			// 	return err
			// }
			abcIndex++
		}
		abcIndex = 1
		numberIndex++
	}

	err = f.SaveAs(filePath)
	if err != nil {
		return err
	}
	return nil
}

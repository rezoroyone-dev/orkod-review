package utilities

import (
	"math/rand"
	"mime/multipart"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
)

// GenerateNextUniqueFileName generates a unique File name based on Date time and random number from 0 to 1000, returns the full path of file name
func GenerateNextUniqueFileName(rootDir string, c fiber.Ctx) (string, error) {
	var fileName string
	var fileFullName string = ""
	var counter int = 1

	t := time.Now() //.Truncate(time.Millisecond)
	// removing milliSeconds from current time to avoid conversion errors in the front end Moment library
	currentTime := time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), 0, t.Location())
	// fmt.Printf("Time is YYYY-MM-DD=%d-%d-%d", currentTime.Year(), currentTime.Month(), currentTime.Day())
	// pathSep := GetPathSeparator()
	pathSep := "/"
	parentDir := rootDir + pathSep + strconv.Itoa(currentTime.Year()) + pathSep + strconv.Itoa(int(currentTime.Month())) + pathSep + strconv.Itoa(currentTime.Day()) + pathSep

	_, err := os.Stat(parentDir)
	if err != nil {
		err := os.MkdirAll(parentDir, os.ModeDir)
		if err != nil {
			return "", err
		}
	}

	for counter <= 2000 { // looping untill we can find a unique file name for a maximmum of 2000 tries
		t := time.Now()
		randomNumber := strconv.Itoa(rand.Intn(1000))
		fileName = strconv.Itoa(t.Year()) + strconv.Itoa(int(t.Month())) + strconv.Itoa(t.Day()) + randomNumber + strconv.Itoa(t.Hour()) + strconv.Itoa(t.Minute()) + strconv.Itoa(t.Second())
		fileFullName = parentDir + fileName

		if !isFileExists(fileFullName) {
			break
		}
		counter++
	}
	// fmt.Println("Number of tries ", counter)
	return fileFullName, nil
}

// check if file exists
func isFileExists(fileFullName string) bool {
	var exists bool = true
	fileInfo, err := os.Stat(fileFullName)
	if os.IsExist(err) {
		exists = true
	}
	if os.IsNotExist(err) || fileInfo.IsDir() {
		exists = false
	}
	return exists
}

// StoreFile stores files received from a client post form request to the server file system
func StoreFile(file *multipart.FileHeader, serverFullFileName string, c fiber.Ctx) error {
	err := c.SaveFile(file, serverFullFileName)
	if err != nil {
		return err
	}
	return nil
}

// GetPathSeparator returns a string representation of path separator "/" or "\" based on the OS
func GetPathSeparator() string {
	return string(os.PathSeparator)
}

// IsNumeric checks if provided string is a number and returns a boolean and the value as a float base 64
func IsNumeric(s string) (bool, float64) {
	val, err := strconv.ParseFloat(s, 64)
	return (err == nil), val
}

// GetPathWithoutLeadingDots returns path without leading dots
func GetPathWithoutLeadingDots(basePath string) string {
	for strings.HasPrefix(basePath, ".") {
		basePath = strings.TrimPrefix(basePath, ".")
	}
	return basePath
}

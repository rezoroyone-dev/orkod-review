package license

import (
	"PranicServer/config"
	"PranicServer/database"
	"PranicServer/logger"
	"PranicServer/utilities"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"github.com/jaypipes/ghw"
)

// IsLicenseOK represents the license status, expired or still valid
var IsLicenseOK bool = false
var expirationDate string = ""

var pathSep string = utilities.GetPathSeparator()

const passPhrase string = "MAROC-_-PER@/ptc+1980*"

var parentDir string
var licenseFile string
var licenseRequestFile string

// License cache variables
var (
	licenseCache struct {
		isValid    bool
		expiration string
		timestamp  time.Time
		mu         sync.RWMutex
	}
	cacheTTL = time.Hour // Cache TTL: 1 hour
)

func init() {
	parentDir = config.GetDataRoot() + pathSep + "licenseFiles" + pathSep
	licenseFile = parentDir + "license.dat"
	licenseRequestFile = parentDir + "licenseRequest.dat"

	// Initialize cache timestamp to trigger first-time check
	licenseCache.timestamp = time.Time{}
}

// getCachedLicense checks the cache first, returns cached value if valid
func getCachedLicense() (isValid bool, expiration string, isCached bool) {
	licenseCache.mu.RLock()
	defer licenseCache.mu.RUnlock()

	// Check if cache is valid
	if time.Since(licenseCache.timestamp) < cacheTTL && !licenseCache.timestamp.IsZero() {
		return licenseCache.isValid, licenseCache.expiration, true
	}
	return false, "", false
}

// setCachedLicense updates the license cache
func setCachedLicense(isValid bool, expiration string) {
	licenseCache.mu.Lock()
	defer licenseCache.mu.Unlock()

	licenseCache.isValid = isValid
	licenseCache.expiration = expiration
	licenseCache.timestamp = time.Now()
}

// UploadLicenseFile uploads license file to server, as ./licenseFiles/license.dat
func UploadLicenseFile(c fiber.Ctx) error {
	db := database.GetConnection()
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusBadRequest).JSON(
			fiber.Map{"error": fmt.Sprintf("get form err: %s", err.Error())})
	}
	files := form.File["files"]

	_, err = os.Stat(parentDir)
	if err != nil {
		if err := os.MkdirAll(parentDir, os.ModeDir); err != nil {
			log.Debug(err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Error occured while creating file path %s: %s", parentDir, err.Error())})
		}
	}

	for _, file := range files {
		if file.Filename == "" {
			continue
		}
		filename := filepath.Base(file.Filename)
		if err := c.SaveFile(file, parentDir+filename); err != nil {
			log.Debug(err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Error occured while uploading license file: %s", err.Error())})
		}
	}
	if len(files) > 0 {
		isExpired, _ := IsExpired() // Capture both return values, but only use the first one
		if isExpired {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": "Error: License File is uploaded but it is not valid"})
		} else {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "License File is uploaded successfully and it is valid"})
		}
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Client Error: Nothing was uploaded!!!"})
	}
}

/*Status returns license status as a string
 */
func Status(c fiber.Ctx) error {
	type License struct {
		Status         string `json:"status"`
		ExpirationDate string `json:"expirationDate"`
	}
	var license License

	if !IsLicenseOK {
		license.Status = "expired"
	} else {
		license.Status = "OK"
		license.ExpirationDate = expirationDate
	}
	return c.JSON(license)
}

// CheckLicense small license check based on last boolean state only (uses cache)
func CheckLicense(c fiber.Ctx) error {
	// Try to get from cache first
	if isCached, expiration, ok := getCachedLicense(); ok {
		if !isCached {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "license is expired"})
		}
		// Update the global variables for backward compatibility
		IsLicenseOK = isCached
		expirationDate = expiration
		return c.Next()
	}

	// Cache miss - perform actual check
	if !IsLicenseOK {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "license is expired"})
	}
	return c.Next()
}

// PerformLicenseChecks heavy license checks, to be carried out every 24 hours
// Uses caching to avoid repeated expensive checks
func PerformLicenseChecks() {
	log.Debug("Performing license validation checks...")

	// Check if we have a valid cache
	if isCached, _, ok := getCachedLicense(); ok {
		log.Debugf("Using cached license status: valid=%v", isCached)
		IsLicenseOK = isCached
		return
	}

	// Perform full license check
	isExpired, licenseFileFound := IsExpired()
	var isValid bool

	if !licenseFileFound {
		log.Debug("License file not found. Running in unlicensed mode.")
		isValid = true // Allow the app to run if license file is missing
	} else if isExpired {
		log.Debug("License is expired or not valid.")
		isValid = false
	} else {
		isValid = true
		log.Debug("License is OK.")
	}

	// Update global state
	IsLicenseOK = isValid

	// Update cache
	setCachedLicense(isValid, expirationDate)
}

func IsExpired() (bool, bool) {
	isExpired := false
	licenseFileFound := true

	diskUID := getDiskUID()

	fileInfo, err := os.Stat(licenseFile)
	if os.IsNotExist(err) || fileInfo.IsDir() {
		// fmt.Println("Error: License File does not exist " + err.Error())
		log.Error("License File does not exist: " + err.Error())
		licenseFileFound = false
		isExpired = true // Effectively expired if file not found
		return isExpired, licenseFileFound
	}

	uid, start, end := readLicenseFile(licenseFile)

	if len(uid) == 0 || len(start) == 0 || len(end) == 0 || uid != diskUID {
		isExpired = true
	}
	expirationDate = end

	t := time.Now()
	currentTime := time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), 0, t.Location())

	startTime, err := time.Parse("02-01-2006 15:04", start+" 00:00")
	if err != nil {
		log.Debug("Error: " + err.Error())
	}

	expirationTime, err := time.Parse("02-01-2006 15:04", end+" 23:59")
	if err != nil {
		log.Debug("Error: " + err.Error())
	}

	if startTime.After(expirationTime) {
		isExpired = true
	}

	if currentTime.After(expirationTime) || currentTime.Before(startTime) {
		isExpired = true
	}

	IsLicenseOK = !isExpired

	return isExpired, licenseFileFound
}

func getDiskUID() string {
	block, err := ghw.Block()
	if err != nil {
		log.Fatal("Error getting hardware info", err)
	}

	var diskUID string = ""

	for _, disk := range block.Disks {
		storageController := disk.StorageController
		driveType := disk.DriveType

		if storageController == ghw.STORAGE_CONTROLLER_UNKNOWN || driveType == ghw.DRIVE_TYPE_UNKNOWN {
			continue
		}
		diskSerial := disk.SerialNumber
		diskModel := disk.Model
		diskUID = diskModel + "-" + diskSerial

		break
	}

	if len(diskUID) > 0 {
		return diskUID
	}

	return diskUID
}

func createHash(key string) []byte {
	hash := sha256.Sum256([]byte(key))
	return hash[:]
}

func encrypt(data []byte, passphrase string) []byte {
	block, err := aes.NewCipher([]byte(createHash(passphrase)))
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	ciphertext := gcm.Seal(nonce, nonce, data, nil)
	return ciphertext
}

func decrypt(data []byte, passphrase string) []byte {
	key := []byte(createHash(passphrase))
	block, err := aes.NewCipher(key)
	if err != nil {
		logger.CatchError(err)
		panic(err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	nonceSize := gcm.NonceSize()
	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	return plaintext
}

func encryptToFile(filename string, data []byte, passphrase string) {
	f, err := os.Create(filename)
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	defer f.Close()
	f.Write(encrypt(data, passphrase))
}

func decryptFile(filename string, passphrase string) []byte {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		logger.CatchError(err)
		panic(err.Error())
	}
	return decrypt(data, passphrase)
}

func readLicenseFile(licenseFile string) (diskUID string, startTime string, endTime string) {
	var uID, start, end string
	var decrypted []byte = decryptFile(licenseFile, passPhrase)
	strOutput := string(decrypted)
	for _, line := range strings.Split(strings.TrimSuffix(strOutput, "\n"), "\n") {
		tmpLine := strings.Split(strings.TrimSpace(line), "=")
		switch tmpLine[0] {
		case "uID":
			uID = tmpLine[1]

		case "start":
			start = tmpLine[1]

		case "end":
			end = tmpLine[1]
		}
	}
	return uID, start, end
}

func createLicenseRequestFile() {
	diskUID := getDiskUID()
	contents := "uID=" + diskUID
	encryptToFile(licenseRequestFile, []byte(contents), passPhrase)
}

func CreateLicenseRequest(c fiber.Ctx) error {
	createLicenseRequestFile()
	return c.JSON(fiber.Map{"message": "License request file created"})
}

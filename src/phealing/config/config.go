package config

import (
	"PranicServer/utilities"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"github.com/joho/godotenv"
)

// LogFile,ConfigParams
var (
	logFile      io.Writer
	configParams *ParamsStruct
)

// ParamsStruct is the App configuration properties struct type
type ParamsStruct struct {
	AppRoot         string `json:"AppRoot"`
	HTTPS_ENABLED   string `json:"HTTPS_ENABLED"`
	HTTPPort        string `json:"HttpPort"`
	HTTPSPort       string `json:"HttpsPort"`
	TLSKeyLocation  string `json:"TLSKeyLocation"`
	TLSCertLocation string `json:"TLSCertLocation"`
	DbUser          string `json:"DatabaseUser"`
	DbPassword      string `json:"DatabasePassword"`
	DbName          string `json:"DatabaseName"`
	DbHost          string `json:"DatabaseHost"`
	DbPort          string `json:"DatabasePort"`
	Debug           string `json:"Debug"`
	AdminPassword   string `json:"AdminPassword"`
	// GormLogLevel: 0=Silent, 1=Error, 2=Warn, 3=Info, 4=Verbose
	GormLogLevel string `json:"GormLogLevel"`
	// EnableDBMigration: controls whether database migrations should run automatically
	EnableDBMigration string `json:"EnableDBMigration"`
}

// init reads configuration file and populate local variables
func init() {
	// Load environment variables from .env file if it exists
	err := godotenv.Load()
	if err != nil {
		log.Debug("No .env file found, relying on system environment variables and config.json")
	}

	configFileName := "./config.json"

	args := os.Args
	// argsWithoutProg := os.Args[1:]

	if len(args) > 1 {
		configArg := args[1]
		argParam := strings.Split(configArg, "=")[0]
		if argParam == "-config" {
			configFileName = strings.Split(configArg, "=")[1]
		} else {
			log.Debug("Invalid option provided, valid option is -config=<configFilePath>")
			return
		}
	}
	fmt.Println("configFileName = ", configFileName)
	//log.Debug("Config.init() invoked")
	file, err := os.ReadFile(configFileName)

	if err != nil {
		fmt.Println("Error reading configuration file: ", err)
		log.Debug(err.Error())
		return
	}

	err = json.Unmarshal(file, &configParams)

	if err != nil {
		log.Error(err.Error())
		return
	}

	// Override with environment variables if present
	overrideWithEnvVars(configParams)

	// if configParams.Debug == "true" {
	// 	fmt.Println("Configuration Parameters")
	// 	fmt.Println(string(file))
	// }

	if configParams.Debug == "true" {
		logFilePath := getLogFilePath()
		if _, err := os.Stat(logFilePath); os.IsNotExist(err) {
			fileLog, fileErr := os.Create(logFilePath)
			if fileErr != nil {
				fmt.Println(fileErr)
				fileLog = os.Stdout
			} else {
				fmt.Println("Writing logs to file " + logFilePath)
			}
			logFile = fileLog
		} else {
			fileLog, fileErr := os.OpenFile(logFilePath, os.O_RDWR|os.O_APPEND, 0600)
			if fileErr != nil {
				fmt.Println(fileErr)
				fileLog = os.Stdout
			} else {
				fmt.Println("Writing logs to file " + logFilePath)
			}
			logFile = fileLog
		}
	} else {
		logFile = os.Stdout
	}
}

func overrideWithEnvVars(params *ParamsStruct) {
	if env := os.Getenv("DB_USER"); env != "" {
		params.DbUser = env
	}
	if env := os.Getenv("DB_PASSWORD"); env != "" {
		params.DbPassword = env
	}
	if env := os.Getenv("DB_NAME"); env != "" {
		params.DbName = env
	}
	if env := os.Getenv("DB_HOST"); env != "" {
		params.DbHost = env
	}
	if env := os.Getenv("DB_PORT"); env != "" {
		params.DbPort = env
	}
	if env := os.Getenv("ADMIN_PASSWORD"); env != "" {
		params.AdminPassword = env
	}
	if env := os.Getenv("DEBUG"); env != "" {
		params.Debug = env
	}
	if env := os.Getenv("GORM_LOG_LEVEL"); env != "" {
		params.GormLogLevel = env
	}
	if env := os.Getenv("ENABLE_DB_MIGRATION"); env != "" {
		params.EnableDBMigration = env
	}
}

func getLogFilePath() string {
	pathSep := utilities.GetPathSeparator()
	t := time.Now()
	datePostfix := strconv.Itoa(t.Day()) + "-" + strconv.Itoa(int(t.Month())) + "-" + strconv.Itoa(t.Year())
	logFilePath := GetDataRoot() + pathSep + "logs" + pathSep + "serverLog_" + datePostfix + ".log"
	return logFilePath
}

// GetLogFile initializes and returns the logFile writer
func GetLogFile() io.Writer {
	if logFile == nil {
		log.Debug("logFile is nil")
	}
	return logFile
}

// GetConfigParams initializes and returns the app Configuration parameters from configuration JSON File
func GetConfigParams() *ParamsStruct {
	if configParams == nil {
		log.Debug("configParams are nil")
	}
	return configParams
}

// GetDataRoot returns the App Data Root folder, which resides underneath the AppRoot folder
func GetDataRoot() string {
	return configParams.AppRoot + utilities.GetPathSeparator() + "dataRoot"
}

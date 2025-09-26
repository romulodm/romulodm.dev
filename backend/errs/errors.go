package errs

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

var DEFAULT_LANGUAGE = "en-us"

type ErrorMessages map[string]map[string]string

var errorMessages ErrorMessages

func init() {
	err := loadErrorMessages()
	if err != nil {
		log.Fatalf("Error loading error messages: %v", err)
	}
}

func loadErrorMessages() error {
	filePath, err := filepath.Abs("errs/errors.json")
	if err != nil {
		return err
	}

	fileContent, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var errorMessagesJSON map[string]map[string]string
	if err := json.Unmarshal(fileContent, &errorMessagesJSON); err != nil {
		return err
	}

	errorMessages = make(ErrorMessages)
	for k, v := range errorMessagesJSON {
		errorMessages[k] = v
	}

	return nil
}

func GetErrorMessage(language string, errorCode string) string {
	if languageMessages, ok := errorMessages[language]; ok {

		if message, ok := languageMessages[errorCode]; ok {
			return message
		}
	}

	return "Internal server error to find error message."
}

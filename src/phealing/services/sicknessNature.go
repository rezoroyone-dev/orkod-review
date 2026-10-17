package services

import (
	"PranicServer/models"
	"PranicServer/resources"
	"encoding/json"
)

// GetSicknessNaturesByLang returns the sickness nature by language
func GetSicknessNaturesByLang(lang string) ([]models.JSONSicknessNature, error) {
	var sicknessNatures []models.JSONSicknessNature
	var err error
	var data []byte

	switch lang {
	case "en":
		data, err = resources.ReadFile("/data/sicknessNature/sicknessNatures_en.json")
	case "fr":
		data, err = resources.ReadFile("/data/sicknessNature/sicknessNatures_fr.json")
	case "ar":
		data, err = resources.ReadFile("/data/sicknessNature/sicknessNatures_ar.json")
	default:
		data, err = resources.ReadFile("/data/sicknessNature/sicknessNatures_en.json")
	}
	if err != nil {
		return sicknessNatures, err
	}
	err = json.Unmarshal(data, &sicknessNatures)
	if err != nil {
		return sicknessNatures, err
	}
	return sicknessNatures, nil
}

// GetSicknessNature returns a single sickness nature by its ID and language
func GetSicknessNature(id uint32, lang string) (models.JSONSicknessNature, error) {
	var sicknessNature models.JSONSicknessNature
	var err error

	sicknessNatures, err := GetSicknessNaturesByLang(lang)
	if err != nil {
		return sicknessNature, err
	}

	for i := 0; i < len(sicknessNatures); i++ {
		if sicknessNatures[i].ID == id {
			return sicknessNatures[i], nil
		}
	}
	return sicknessNature, nil
}

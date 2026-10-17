package handlers

import (
	"PranicServer/database"
	"PranicServer/models"
	"errors"
	"net/mail"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3/log"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

const (
	maxReviewTitle   = 120
	maxReviewComment = 2000
)

// PublicReview is the safe projection of a review (author email stays private).
type PublicReview struct {
	ID         uint32 `json:"id"`
	TargetType string `json:"targetType"`
	TargetID   uint32 `json:"targetId"`
	TargetName string `json:"targetName"`
	Rating     uint8  `json:"rating"`
	Title      string `json:"title"`
	Comment    string `json:"comment"`
	AuthorName string `json:"authorName"`
	CreatedAt  string `json:"createdAt"`
}

// validateReviewInput validates a review submission.
// Returns an error message (empty when valid). Standalone for unit tests.
func validateReviewInput(targetType string, targetID uint32, rating uint8, title, comment, authorName, authorEmail string) string {
	if targetType != models.ReviewTargetDoctor && targetType != models.ReviewTargetHealer {
		return "targetType must be \"doctor\" or \"healer\""
	}
	if targetID == 0 {
		return "targetId is required"
	}
	if rating < 1 || rating > 5 {
		return "rating must be between 1 and 5"
	}
	if strings.TrimSpace(title) == "" && strings.TrimSpace(comment) == "" {
		return "title or comment is required"
	}
	if len(title) > maxReviewTitle {
		return "title is too long"
	}
	if len(comment) > maxReviewComment {
		return "comment is too long"
	}
	if strings.TrimSpace(authorName) == "" {
		return "authorName is required"
	}
	if strings.TrimSpace(authorEmail) != "" {
		if _, err := mail.ParseAddress(strings.TrimSpace(authorEmail)); err != nil {
			return "authorEmail is not a valid email address"
		}
	}
	return ""
}

// targetExists verifies that a review target exists in the DB.
func targetExists(db *gorm.DB, targetType string, targetID uint32) (bool, error) {
	var count int64
	switch targetType {
	case models.ReviewTargetDoctor:
		err := db.Table("doctors").Where("id = ?", targetID).Count(&count).Error
		return count > 0, err
	case models.ReviewTargetHealer:
		err := db.Table("healers").Where("id = ?", targetID).Count(&count).Error
		return count > 0, err
	default:
		return false, nil
	}
}

// resolveTargetName returns a public display name for a review target.
func resolveTargetName(db *gorm.DB, targetType string, targetID uint32) (string, error) {
	switch targetType {
	case models.ReviewTargetDoctor:
		return doctorNameForTarget(db, targetID)
	case models.ReviewTargetHealer:
		return healerDisplayName(db, targetID)
	default:
		return "", ErrTargetNotFound
	}
}

// healerDisplayName returns "FirstName LastName" for a healer (via Person).
func healerDisplayName(db *gorm.DB, id uint32) (string, error) {
	var healer models.Healer
	if err := db.Preload("Person").First(&healer, id).Error; err != nil {
		return "", err
	}
	name := strings.TrimSpace(strings.Join([]string{healer.FirstName, healer.LastName}, " "))
	if name == "" {
		name = "Practitioner"
	}
	return name, nil
}

// CreateReview creates a review. Reviews are auto-approved for V1 so the
// feature is immediately useful; moderation endpoints exist to remove abuse.
func CreateReview(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	var req struct {
		TargetType  string `json:"targetType"`
		TargetID    uint32 `json:"targetId"`
		Rating      uint8  `json:"rating"`
		Title       string `json:"title"`
		Comment     string `json:"comment"`
		AuthorName  string `json:"authorName"`
		AuthorEmail string `json:"authorEmail"`
	}
	if err := c.Bind().Body(&req); err != nil {
		log.Debugf("CreateReview BodyParser error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "error parsing review: " + err.Error()})
	}

	if msg := validateReviewInput(req.TargetType, req.TargetID, req.Rating, req.Title, req.Comment, req.AuthorName, req.AuthorEmail); msg != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": msg})
	}

	exists, err := targetExists(db, req.TargetType, req.TargetID)
	if err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to validate review target"})
	}
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "review target not found"})
	}

	// Moderately strict duplicate prevention: one review per email + target.
	if strings.TrimSpace(req.AuthorEmail) != "" {
		var count int64
		if err := db.Table("reviews").
			Where("target_type = ? AND target_id = ? AND LOWER(author_email) = LOWER(?)",
				req.TargetType, req.TargetID, strings.TrimSpace(req.AuthorEmail)).
			Count(&count).Error; err == nil && count > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "You have already submitted a review for this profile"})
		}
	}

	review := models.Review{
		TargetType:  req.TargetType,
		TargetID:    req.TargetID,
		Rating:      req.Rating,
		Title:       strings.TrimSpace(req.Title),
		Comment:     strings.TrimSpace(req.Comment),
		AuthorName:  strings.TrimSpace(req.AuthorName),
		AuthorEmail: strings.ToLower(strings.TrimSpace(req.AuthorEmail)),
		IsApproved:  true, // auto-approve for V1; admins can moderate
	}
	if err := db.Create(&review).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error storing review: " + err.Error()})
	}

	targetName, _ := resolveTargetName(db, review.TargetType, review.TargetID)
	return c.Status(fiber.StatusCreated).JSON(PublicReview{
		ID:         review.ID,
		TargetType: review.TargetType,
		TargetID:   review.TargetID,
		TargetName: targetName,
		Rating:     review.Rating,
		Title:      review.Title,
		Comment:    review.Comment,
		AuthorName: review.AuthorName,
		CreatedAt:  review.CreatedAt.Format("2006-01-02"),
	})
}

// GetReviews returns approved reviews for a target.
// Query params: ?targetType=doctor&targetId=7
func GetReviews(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	targetType := c.Query("targetType")
	targetID, err := strconv.ParseUint(c.Query("targetId"), 10, 32)
	if err != nil || targetID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "targetType and targetId query params are required"})
	}
	if targetType != models.ReviewTargetDoctor && targetType != models.ReviewTargetHealer {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "targetType must be \"doctor\" or \"healer\""})
	}

	var reviews []models.Review
	if err := db.Where("target_type = ? AND target_id = ? AND is_approved = ?", targetType, uint32(targetID), true).
		Order("created_at DESC").Find(&reviews).Error; err != nil {
		log.Debug(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load reviews"})
	}

	targetName, _ := resolveTargetName(db, targetType, uint32(targetID))

	payload := make([]PublicReview, 0, len(reviews))
	for _, r := range reviews {
		payload = append(payload, PublicReview{
			ID:         r.ID,
			TargetType: r.TargetType,
			TargetID:   r.TargetID,
			TargetName: targetName,
			Rating:     r.Rating,
			Title:      r.Title,
			Comment:    r.Comment,
			AuthorName: r.AuthorName,
			CreatedAt:  r.CreatedAt.Format("2006-01-02"),
		})
	}
	return c.JSON(payload)
}

// ModerateReview lets an admin approve/reject a review.
func ModerateReview(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil || id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid review id"})
	}

	var req struct {
		IsApproved *bool `json:"isApproved"`
	}
	if err := c.Bind().Body(&req); err != nil || req.IsApproved == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "isApproved is required"})
	}

	var review models.Review
	if err := db.First(&review, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "review not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.Model(&review).Update("is_approved", *req.IsApproved).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"id": id, "isApproved": *req.IsApproved})
}

// DeleteReview removes a review (admin).
func DeleteReview(c fiber.Ctx) error {
	db := database.GetDB(c)
	if db == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ERROR: Can not access database, please try again later"})
	}

	strID := c.Params("id")
	id, err := strconv.ParseUint(strID, 10, 32)
	if err != nil || id == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid review id"})
	}

	var review models.Review
	if err := db.First(&review, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "review not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := db.Delete(&review).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"id": id, "status": "deleted"})
}
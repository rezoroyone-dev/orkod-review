package services

import (
	"PranicServer/models"
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3/log"

	"gorm.io/gorm"
)

// NotificationService handles all notification operations
type NotificationService struct {
	db *gorm.DB
}

// NewNotificationService creates a new notification service
func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{db: db}
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	UseTLS   bool
}

// GetSMTPConfig loads SMTP configuration from environment
func GetSMTPConfig() *SMTPConfig {
	return &SMTPConfig{
		Host:     getEnvOrDefault("SMTP_HOST", "smtp.gmail.com"),
		Port:     getEnvOrDefault("SMTP_PORT", "587"),
		Username: os.Getenv("SMTP_USERNAME"),
		Password: os.Getenv("SMTP_PASSWORD"),
		From:     getEnvOrDefault("SMTP_FROM", "noreply@pranichealing.com"),
		UseTLS:   os.Getenv("SMTP_USE_TLS") != "false",
	}
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// SendEmail sends an email using SMTP
func (s *NotificationService) SendEmail(to, subject, body string) error {
	config := GetSMTPConfig()

	if config.Username == "" || config.Password == "" {
		log.Debug("SMTP credentials not configured, skipping email send")
		return fmt.Errorf("SMTP not configured")
	}

	// Build email message
	msg := fmt.Sprintf("From: %s\r\n", config.From)
	msg += fmt.Sprintf("To: %s\r\n", to)
	msg += fmt.Sprintf("Subject: %s\r\n", subject)
	msg += "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"
	msg += body

	// Connect to SMTP server
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)

	var auth smtp.Auth
	if config.Username != "" {
		auth = smtp.PlainAuth("", config.Username, config.Password, config.Host)
	}

	// Use TLS if configured
	if config.UseTLS {
		return s.sendEmailWithTLS(addr, auth, config.From, []string{to}, []byte(msg))
	}

	return smtp.SendMail(addr, auth, config.From, []string{to}, []byte(msg))
}

// sendEmailWithTLS sends email with TLS encryption
func (s *NotificationService) sendEmailWithTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
	config := GetSMTPConfig()

	// TLS configuration
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.Host,
	}

	// Connect to the SMTP server
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}

	client, err := smtp.NewClient(conn, config.Host)
	if err != nil {
		return fmt.Errorf("failed to create client: %v", err)
	}
	defer client.Close()

	// Authenticate
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("failed to authenticate: %v", err)
		}
	}

	// Set sender and recipient
	if err := client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	for _, addr := range to {
		if err := client.Rcpt(addr); err != nil {
			return fmt.Errorf("failed to set recipient: %v", err)
		}
	}

	// Send email body
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %v", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("failed to write message: %v", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close writer: %v", err)
	}

	return client.Quit()
}

// LogNotification logs a notification to the database
func (s *NotificationService) LogNotification(scheduleID, patientID, userID *uint32, notifType models.NotificationType, channel models.NotificationChannel, recipient, subject, body, status, errorMsg string) error {
	log := &models.NotificationLog{
		ScheduleID:   scheduleID,
		PatientID:    patientID,
		UserID:       userID,
		Type:         notifType,
		Channel:      channel,
		Recipient:    recipient,
		Subject:      subject,
		Body:         body,
		Status:       status,
		ErrorMessage: errorMsg,
	}

	if status == "sent" {
		now := time.Now()
		log.SentAt = &now
	}

	return s.db.Create(log).Error
}

// SendAppointmentReminder sends a reminder for an upcoming appointment
func (s *NotificationService) SendAppointmentReminder(schedule *models.Schedule) error {
	// Load attendees with their contact info
	var scheduleWithDetails models.Schedule
	if err := s.db.Preload("Attendees").Preload("Healers").Preload("Center").First(&scheduleWithDetails, schedule.ID).Error; err != nil {
		return fmt.Errorf("failed to load schedule details: %v", err)
	}

	// Get email template
	tmpl, err := s.GetEmailTemplate("appointment_reminder")
	if err != nil {
		// Use default template
		tmpl = &models.EmailTemplate{
			Subject: "Appointment Reminder - {{.Date}}",
			Body: `<p>Dear {{.PatientName}},</p>
<p>This is a friendly reminder of your upcoming appointment:</p>
<ul>
<li><strong>Date:</strong> {{.Date}}</li>
<li><strong>Time:</strong> {{.Time}}</li>
<li><strong>Location:</strong> {{.Center}}</li>
<li><strong>Healer:</strong> {{.Healer}}</li>
</ul>
<p>Please arrive 10 minutes early. If you need to reschedule, please contact us.</p>
<p>Best regards,<br>Pranic Healing Center</p>`,
		}
	}

	var lastError error
	sentCount := 0

	// Send to all attendees
	for _, attendee := range scheduleWithDetails.Attendees {
		if attendee.Email == "" {
			continue
		}

		// Prepare template data
		data := map[string]interface{}{
			"PatientName": fmt.Sprintf("%s %s", attendee.FirstName, attendee.LastName),
			"Date":        scheduleWithDetails.StartDate.Format("Monday, January 2, 2006"),
			"Time":        scheduleWithDetails.StartDate.Format("3:04 PM"),
			"Center":      scheduleWithDetails.Center.Name,
			"Healer":      s.getHealerNames(scheduleWithDetails.Healers),
		}

		subject, body, err := s.renderTemplate(tmpl, data)
		if err != nil {
			log.Debugf("Failed to render template for attendee %d: %v", attendee.ID, err)
			continue
		}

		err = s.SendEmail(attendee.Email, subject, body)
		status := "sent"
		errorMsg := ""
		if err != nil {
			status = "failed"
			errorMsg = err.Error()
			lastError = err
		} else {
			sentCount++
		}

		// Log notification
		scheduleID := schedule.ID
		s.LogNotification(&scheduleID, nil, nil, models.NotificationTypeAppointmentReminder, models.ChannelEmail, attendee.Email, subject, body, status, errorMsg)
	}

	// Mark reminder as sent
	if sentCount > 0 {
		s.db.Model(schedule).Update("reminder_sent", true)
	}

	return lastError
}

// SendBookingConfirmation sends a confirmation after a booking is created
func (s *NotificationService) SendBookingConfirmation(schedule *models.Schedule, attendeeEmails []string) error {
	// Load schedule details
	var scheduleWithDetails models.Schedule
	if err := s.db.Preload("Healers").Preload("Center").First(&scheduleWithDetails, schedule.ID).Error; err != nil {
		return fmt.Errorf("failed to load schedule details: %v", err)
	}

	tmpl, err := s.GetEmailTemplate("booking_confirmation")
	if err != nil {
		tmpl = &models.EmailTemplate{
			Subject: "Booking Confirmed - {{.Date}}",
			Body: `<p>Dear Patient,</p>
<p>Your appointment has been successfully booked!</p>
<ul>
<li><strong>Date:</strong> {{.Date}}</li>
<li><strong>Time:</strong> {{.Time}}</li>
<li><strong>Location:</strong> {{.Center}}</li>
<li><strong>Healer:</strong> {{.Healer}}</li>
</ul>
<p>Please arrive 10 minutes before your scheduled time.</p>
<p>We look forward to seeing you!</p>
<p>Best regards,<br>Pranic Healing Center</p>`,
		}
	}

	var lastError error
	for _, email := range attendeeEmails {
		if email == "" {
			continue
		}

		data := map[string]interface{}{
			"Date":   scheduleWithDetails.StartDate.Format("Monday, January 2, 2006"),
			"Time":   scheduleWithDetails.StartDate.Format("3:04 PM"),
			"Center": scheduleWithDetails.Center.Name,
			"Healer": s.getHealerNames(scheduleWithDetails.Healers),
		}

		subject, body, err := s.renderTemplate(tmpl, data)
		if err != nil {
			log.Debugf("Failed to render template: %v", err)
			continue
		}

		err = s.SendEmail(email, subject, body)
		status := "sent"
		errorMsg := ""
		if err != nil {
			status = "failed"
			errorMsg = err.Error()
			lastError = err
		}

		scheduleID := schedule.ID
		s.LogNotification(&scheduleID, nil, nil, models.NotificationTypeBookingConfirmation, models.ChannelEmail, email, subject, body, status, errorMsg)
	}

	return lastError
}

// SendPasswordResetEmail sends a password reset link
func (s *NotificationService) SendPasswordResetEmail(email, resetToken, resetURL string) error {
	tmpl, err := s.GetEmailTemplate("password_reset")
	if err != nil {
		tmpl = &models.EmailTemplate{
			Subject: "Password Reset Request",
			Body: `<p>Hello,</p>
<p>You have requested to reset your password.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{.ResetURL}}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you did not request this, please ignore this email.</p>
<p>Best regards,<br>Pranic Healing Center</p>`,
		}
	}

	data := map[string]interface{}{
		"ResetURL": fmt.Sprintf("%s?token=%s", resetURL, resetToken),
	}

	subject, body, err := s.renderTemplate(tmpl, data)
	if err != nil {
		return err
	}

	err = s.SendEmail(email, subject, body)
	status := "sent"
	errorMsg := ""
	if err != nil {
		status = "failed"
		errorMsg = err.Error()
	}

	s.LogNotification(nil, nil, nil, models.NotificationTypePasswordReset, models.ChannelEmail, email, subject, body, status, errorMsg)
	return err
}

// GetEmailTemplate retrieves an email template by name
func (s *NotificationService) GetEmailTemplate(name string) (*models.EmailTemplate, error) {
	var tmpl models.EmailTemplate
	err := s.db.Where("name = ? AND is_active = ?", name, true).First(&tmpl).Error
	if err != nil {
		return nil, err
	}
	return &tmpl, nil
}

// renderTemplate renders an email template with data
func (s *NotificationService) renderTemplate(tmpl *models.EmailTemplate, data map[string]interface{}) (string, string, error) {
	// Parse subject
	subjectTmpl, err := template.New("subject").Parse(tmpl.Subject)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse subject template: %v", err)
	}
	var subjectBuf bytes.Buffer
	if err := subjectTmpl.Execute(&subjectBuf, data); err != nil {
		return "", "", fmt.Errorf("failed to execute subject template: %v", err)
	}

	// Parse body
	bodyTmpl, err := template.New("body").Parse(tmpl.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse body template: %v", err)
	}
	var bodyBuf bytes.Buffer
	if err := bodyTmpl.Execute(&bodyBuf, data); err != nil {
		return "", "", fmt.Errorf("failed to execute body template: %v", err)
	}

	return subjectBuf.String(), bodyBuf.String(), nil
}

// getHealerNames returns a comma-separated list of healer names
func (s *NotificationService) getHealerNames(healers []models.Healer) string {
	if len(healers) == 0 {
		return "To be assigned"
	}
	names := make([]string, len(healers))
	for i, h := range healers {
		names[i] = fmt.Sprintf("%s %s", h.FirstName, h.LastName)
	}
	return strings.Join(names, ", ")
}

// CheckAndSendReminders checks for upcoming appointments and sends reminders
func (s *NotificationService) CheckAndSendReminders() error {
	// Find schedules starting in the next 24 hours that haven't had reminders sent
	now := time.Now()
	reminderWindow := now.Add(24 * time.Hour)

	var schedules []models.Schedule
	err := s.db.Where("start_date > ? AND start_date <= ? AND reminder_sent = ?", now, reminderWindow, false).
		Find(&schedules).Error
	if err != nil {
		return fmt.Errorf("failed to query upcoming schedules: %v", err)
	}

	log.Debugf("Found %d schedules needing reminders", len(schedules))

	var lastError error
	for _, schedule := range schedules {
		if err := s.SendAppointmentReminder(&schedule); err != nil {
			log.Debugf("Failed to send reminder for schedule %d: %v", schedule.ID, err)
			lastError = err
		}
	}

	return lastError
}

// SeedDefaultEmailTemplates seeds default email templates
func SeedDefaultEmailTemplates(db *gorm.DB) error {
	templates := []models.EmailTemplate{
		{
			Name:        "appointment_reminder",
			Subject:     "Appointment Reminder - {{.Date}}",
			Body:        `<p>Dear {{.PatientName}},</p><p>This is a friendly reminder of your upcoming appointment:</p><ul><li><strong>Date:</strong> {{.Date}}</li><li><strong>Time:</strong> {{.Time}}</li><li><strong>Location:</strong> {{.Center}}</li><li><strong>Healer:</strong> {{.Healer}}</li></ul><p>Please arrive 10 minutes early. If you need to reschedule, please contact us.</p><p>Best regards,<br>Pranic Healing Center</p>`,
			Description: "Sent 24 hours before an appointment",
			IsActive:    true,
		},
		{
			Name:        "booking_confirmation",
			Subject:     "Booking Confirmed - {{.Date}}",
			Body:        `<p>Dear Patient,</p><p>Your appointment has been successfully booked!</p><ul><li><strong>Date:</strong> {{.Date}}</li><li><strong>Time:</strong> {{.Time}}</li><li><strong>Location:</strong> {{.Center}}</li><li><strong>Healer:</strong> {{.Healer}}</li></ul><p>Please arrive 10 minutes before your scheduled time.</p><p>We look forward to seeing you!</p><p>Best regards,<br>Pranic Healing Center</p>`,
			Description: "Sent when a booking is created",
			IsActive:    true,
		},
		{
			Name:        "booking_cancellation",
			Subject:     "Appointment Cancelled - {{.Date}}",
			Body:        `<p>Dear {{.PatientName}},</p><p>Your appointment on {{.Date}} at {{.Time}} has been cancelled.</p><p>If you would like to reschedule, please book a new appointment.</p><p>Best regards,<br>Pranic Healing Center</p>`,
			Description: "Sent when a booking is cancelled",
			IsActive:    true,
		},
		{
			Name:        "password_reset",
			Subject:     "Password Reset Request",
			Body:        `<p>Hello,</p><p>You have requested to reset your password.</p><p>Click the link below to reset your password:</p><p><a href="{{.ResetURL}}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>Pranic Healing Center</p>`,
			Description: "Sent when a user requests a password reset",
			IsActive:    true,
		},
		{
			Name:        "email_verification",
			Subject:     "Verify Your Email Address",
			Body:        `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="{{.VerificationURL}}">Verify Email</a></p><p>This link will expire in 24 hours.</p><p>Best regards,<br>Pranic Healing Center</p>`,
			Description: "Sent when a new patient account is created",
			IsActive:    true,
		},
	}

	for _, tmpl := range templates {
		var existing models.EmailTemplate
		if err := db.Where("name = ?", tmpl.Name).First(&existing).Error; err != nil {
			// Template doesn't exist, create it
			if err := db.Create(&tmpl).Error; err != nil {
				return fmt.Errorf("failed to create template %s: %v", tmpl.Name, err)
			}
			log.Debugf("Created email template: %s", tmpl.Name)
		}
	}

	return nil
}

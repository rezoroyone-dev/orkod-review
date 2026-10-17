package services

import (
	"bytes"
	"crypto/rand"
	"encoding/base32"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

// TOTPService handles Two-Factor Authentication operations
type TOTPService struct {
	Issuer string // Application name shown in authenticator apps
}

// NewTOTPService creates a new TOTP service
func NewTOTPService(issuer string) *TOTPService {
	if issuer == "" {
		issuer = "Pranic Healing"
	}
	return &TOTPService{Issuer: issuer}
}

// GenerateSecret generates a new TOTP secret for a user
// Returns the secret (to store) and a provisioning URI for QR code generation
func (s *TOTPService) GenerateSecret(username string) (secret string, provisioningURI string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.Issuer,
		AccountName: username,
		SecretSize:  32,
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP secret: %v", err)
	}

	return key.Secret(), key.URL(), nil
}

// ValidateCode validates a TOTP code against a secret
func (s *TOTPService) ValidateCode(secret, code string) (bool, error) {
	// Clean up the code (remove spaces, dashes)
	code = strings.ReplaceAll(code, " ", "")
	code = strings.ReplaceAll(code, "-", "")

	valid, err := totp.ValidateCustom(code, secret, time.Now(), totp.ValidateOpts{
		Skew:      1, // Allow 1 step (30 seconds) skew for clock differences
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		return false, fmt.Errorf("failed to validate TOTP code: %v", err)
	}

	return valid, nil
}

// GenerateQRCode generates a base64-encoded QR code image for the provisioning URI
func (s *TOTPService) GenerateQRCode(provisioningURI string) (string, error) {
	// Generate QR code locally using go-qrcode library
	// This creates a 300x300 pixel QR code with medium error correction
	qr, err := qrcode.Encode(provisioningURI, qrcode.Medium, 300)
	if err != nil {
		return "", fmt.Errorf("failed to generate QR code: %v", err)
	}

	// Convert to base64 data URI for frontend display
	var buf bytes.Buffer
	buf.WriteString("data:image/png;base64,")
	encoder := base64.NewEncoder(base64.StdEncoding, &buf)
	encoder.Write(qr)
	encoder.Close()

	return buf.String(), nil
}

// GenerateBackupCodes generates a set of backup codes for account recovery
func (s *TOTPService) GenerateBackupCodes(count int) ([]string, error) {
	if count <= 0 {
		count = 10
	}

	codes := make([]string, count)
	for i := 0; i < count; i++ {
		code, err := generateBackupCode()
		if err != nil {
			return nil, fmt.Errorf("failed to generate backup code: %v", err)
		}
		codes[i] = code
	}

	return codes, nil
}

// generateBackupCode generates a single backup code
func generateBackupCode() (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	
	// Generate a code like "ABCD-EFGH" for easy reading
	encoded := base32.StdEncoding.EncodeToString(bytes)
	code := encoded[:8]
	
	// Format as XXXX-XXXX
	return fmt.Sprintf("%s-%s", code[:4], code[4:8]), nil
}

// GenerateRecoveryToken generates a secure token for password reset or email verification
func GenerateRecoveryToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate recovery token: %v", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
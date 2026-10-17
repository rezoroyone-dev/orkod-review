package main

import (
	"fmt"

	"github.com/gofiber/fiber/v3/log"

	"PranicServer/services"
)

func main_test() {
	// Test the TOTP service with local QR code generation
	totpService := services.NewTOTPService("Test App")

	// Generate a test secret and provisioning URI
	secret, provisioningURI, err := totpService.GenerateSecret("testuser@example.com")
	if err != nil {
		log.Fatalf("Failed to generate TOTP secret: %v", err)
	}

	fmt.Printf("Generated Secret: %s\n", secret)
	fmt.Printf("Provisioning URI: %s\n", provisioningURI)

	// Generate QR code
	qrCodeData, err := totpService.GenerateQRCode(provisioningURI)
	if err != nil {
		log.Fatalf("Failed to generate QR code: %v", err)
	}

	fmt.Printf("QR Code Data URI Length: %d characters\n", len(qrCodeData))
	fmt.Printf("QR Code Data URI (first 100 chars): %s...\n", qrCodeData[:100])

	// Test validation
	valid, err := totpService.ValidateCode(secret, "123456")
	if err != nil {
		log.Debugf("Validation error: %v", err)
	} else {
		fmt.Printf("Validation test (with wrong code): %v\n", valid)
	}

	fmt.Println("✅ TOTP service test completed successfully!")
}

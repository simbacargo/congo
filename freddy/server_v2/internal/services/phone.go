package services

import "strings"

// NormalizePhone mirrors fuel_app.services.normalize_phone: digits only,
// keeping the trailing 9 so +243 / 0-prefixed / bare local numbers compare
// equal.
func NormalizePhone(value string) string {
	var b strings.Builder
	for _, r := range value {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	if len(digits) >= 9 {
		return digits[len(digits)-9:]
	}
	return digits
}

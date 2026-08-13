package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"freddy/server_v2/internal/dj"
	"strings"
)

// GenerateReceiptCode mirrors fuel_app.models.generate_receipt_code:
// 8 random bytes → 16 uppercase hex chars; checksum = first 4 hex chars of
// sha256(raw) uppercased; formatted LCI-XXXX-XXXXXXXXXXXX-CKSM.
func GenerateReceiptCode() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	raw := strings.ToUpper(hex.EncodeToString(b[:]))
	sum := sha256.Sum256([]byte(raw))
	checksum := strings.ToUpper(hex.EncodeToString(sum[:])[:4])
	return fmt.Sprintf("LCI-%s-%s-%s", raw[:4], raw[4:], checksum)
}

// GenerateDisbursementReference mirrors Disbursement.save():
// DSB-{church_id}-{8 uppercase hex}. Django interpolates the UUID object,
// which str()s to the dashed form.
func GenerateDisbursementReference(churchID dj.UUID) string {
	var b [4]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	raw := strings.ToUpper(hex.EncodeToString(b[:]))
	if churchID != "" {
		return fmt.Sprintf("DSB-%s-%s", churchID, raw)
	}
	return "DSB-" + raw
}

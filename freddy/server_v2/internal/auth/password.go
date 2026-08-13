// Package auth implements Django-compatible password hashing and Knox-
// compatible API tokens so the Go and Django servers can share the database.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"math/big"
	"strconv"
	"strings"

	"golang.org/x/crypto/pbkdf2"
)

// djangoIterations matches Django 5.1's PBKDF2PasswordHasher.iterations, the
// value used when writing new hashes (verification honors whatever iteration
// count is embedded in the stored hash).
const djangoIterations = 870000

const saltAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// CheckPassword verifies a plaintext password against a Django
// "pbkdf2_sha256$<iterations>$<salt>$<base64digest>" hash.
func CheckPassword(password, encoded string) bool {
	parts := strings.SplitN(encoded, "$", 4)
	if len(parts) != 4 || parts[0] != "pbkdf2_sha256" {
		return false
	}
	iterations, err := strconv.Atoi(parts[1])
	if err != nil || iterations <= 0 {
		return false
	}
	want, err := base64.StdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	got := pbkdf2.Key([]byte(password), []byte(parts[2]), iterations, len(want), sha256.New)
	return subtle.ConstantTimeCompare(got, want) == 1
}

// MakePassword hashes a plaintext password in Django's format so accounts
// created or updated by the Go server remain usable by the Django server.
func MakePassword(password string) string {
	salt := randomString(22, saltAlphabet)
	dk := pbkdf2.Key([]byte(password), []byte(salt), djangoIterations, sha256.New().Size(), sha256.New)
	return fmt.Sprintf("pbkdf2_sha256$%d$%s$%s",
		djangoIterations, salt, base64.StdEncoding.EncodeToString(dk))
}

// RandomPassword mirrors the AgentForm behavior of assigning an unguessable
// password when none is supplied for a new user.
func RandomPassword() string { return randomString(32, saltAlphabet) }

func randomString(n int, alphabet string) string {
	out := make([]byte, n)
	max := big.NewInt(int64(len(alphabet)))
	for i := range out {
		idx, err := rand.Int(rand.Reader, max)
		if err != nil {
			panic(err)
		}
		out[i] = alphabet[idx.Int64()]
	}
	return string(out)
}

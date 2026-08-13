package auth

import (
	"crypto/rand"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"freddy/server_v2/internal/dj"
	"time"

	"freddy/server_v2/internal/models"
	"freddy/server_v2/internal/store"
)

// Knox parameters as configured in server/server/settings.py (REST_KNOX) and
// knox 5.0.4 defaults.
const (
	tokenChars         = 64 // AUTH_TOKEN_CHARACTER_LENGTH
	tokenKeyLength     = 15 // CONSTANTS.TOKEN_KEY_LENGTH
	TokenTTL           = 24 * time.Hour
	minRefreshInterval = 60 * time.Second // MIN_REFRESH_INTERVAL
)

var ErrInvalidToken = errors.New("invalid token")

func hashToken(token string) string {
	sum := sha512.Sum512([]byte(token))
	return hex.EncodeToString(sum[:])
}

// CreateToken issues a knox-compatible token for the user and returns the
// raw token (shown once) plus its expiry.
func CreateToken(db *store.DB, userID dj.UUID, now time.Time) (raw string, expiry time.Time, err error) {
	b := make([]byte, tokenChars/2)
	if _, err = rand.Read(b); err != nil {
		return "", time.Time{}, err
	}
	raw = hex.EncodeToString(b)
	expiry = now.Add(TokenTTL)
	err = db.CreateAuthToken(models.AuthToken{
		Digest:   hashToken(raw),
		TokenKey: raw[:tokenKeyLength],
		UserID:   userID,
		Created:  dj.NewTime(now),
		Expiry:   dj.NewTime(expiry),
	})
	if err != nil {
		return "", time.Time{}, err
	}
	return raw, expiry, nil
}

// VerifyToken replicates knox.auth.TokenAuthentication.authenticate_credentials:
// candidate lookup by token_key, expired-token cleanup, constant-time digest
// compare, auto-refresh, and the is_active check. Returns the user and the
// matched token.
func VerifyToken(db *store.DB, raw string, now time.Time) (models.User, models.AuthToken, error) {
	var none models.User
	var noneTok models.AuthToken
	if len(raw) < tokenKeyLength {
		return none, noneTok, ErrInvalidToken
	}
	candidates, err := db.TokensByKey(raw[:tokenKeyLength])
	if err != nil {
		return none, noneTok, err
	}
	for _, tok := range candidates {
		// knox deletes the user's other expired tokens, then this one if stale.
		_ = db.DeleteExpiredUserTokens(tok.UserID, tok.Digest, dj.NewTime(now))
		if tok.Expiry.Valid && tok.Expiry.Time.Before(now) {
			_ = db.DeleteToken(tok.Digest)
			continue
		}
		digest := hashToken(raw)
		if subtle.ConstantTimeCompare([]byte(digest), []byte(tok.Digest)) != 1 {
			continue
		}
		// AUTO_REFRESH: bump expiry to now+TTL, throttled to one write per
		// MIN_REFRESH_INTERVAL.
		if tok.Expiry.Valid {
			newExpiry := now.Add(TokenTTL)
			if newExpiry.Sub(tok.Expiry.Time) > minRefreshInterval {
				_ = db.UpdateTokenExpiry(tok.Digest, dj.NewTime(newExpiry))
				tok.Expiry = dj.NewTime(newExpiry)
			}
		}
		user, err := db.UserByID(tok.UserID)
		if err != nil {
			return none, noneTok, ErrInvalidToken
		}
		if !user.IsActive {
			return none, noneTok, errors.New("User inactive or deleted.")
		}
		return user, tok, nil
	}
	return none, noneTok, ErrInvalidToken
}

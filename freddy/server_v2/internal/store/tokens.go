package store

import (
	"database/sql"
	"errors"
	"freddy/server_v2/internal/dj"

	"freddy/server_v2/internal/models"
)

// CreateAuthToken inserts a knox_authtoken row.
func (db *DB) CreateAuthToken(t models.AuthToken) error {
	_, err := db.Exec(
		`INSERT INTO knox_authtoken (digest, token_key, user_id, created, expiry) VALUES (?, ?, ?, ?, ?)`,
		t.Digest, t.TokenKey, t.UserID, t.Created, t.Expiry,
	)
	return err
}

// TokensByKey returns candidate tokens matching the 15-char token_key prefix,
// mirroring knox's lookup.
func (db *DB) TokensByKey(tokenKey string) ([]models.AuthToken, error) {
	rows, err := db.Query(
		`SELECT digest, token_key, user_id, created, expiry FROM knox_authtoken WHERE token_key = ?`,
		tokenKey,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.AuthToken
	for rows.Next() {
		var t models.AuthToken
		if err := rows.Scan(&t.Digest, &t.TokenKey, &t.UserID, &t.Created, &t.Expiry); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (db *DB) DeleteToken(digest string) error {
	_, err := db.Exec(`DELETE FROM knox_authtoken WHERE digest = ?`, digest)
	return err
}

func (db *DB) DeleteUserTokens(userID dj.UUID) error {
	_, err := db.Exec(`DELETE FROM knox_authtoken WHERE user_id = ?`, userID)
	return err
}

// DeleteExpiredUserTokens mirrors knox's per-request cleanup of a user's
// stale tokens (except the one being checked).
func (db *DB) DeleteExpiredUserTokens(userID dj.UUID, exceptDigest string, now dj.DjangoTime) error {
	_, err := db.Exec(
		`DELETE FROM knox_authtoken WHERE user_id = ? AND digest != ? AND expiry IS NOT NULL AND expiry < ?`,
		userID, exceptDigest, now,
	)
	return err
}

func (db *DB) UpdateTokenExpiry(digest string, expiry dj.DjangoTime) error {
	_, err := db.Exec(`UPDATE knox_authtoken SET expiry = ? WHERE digest = ?`, expiry, digest)
	return err
}

// ErrNotFound is returned by single-row lookups.
var ErrNotFound = errors.New("not found")

func isNoRows(err error) bool { return errors.Is(err, sql.ErrNoRows) }

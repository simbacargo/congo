package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

// LatestRateSince returns the newest cached rate fetched at/after cutoff.
func (db *DB) LatestRateSince(cutoff dj.DjangoTime) (models.ExchangeRateCache, error) {
	row := db.QueryRow(`SELECT id, usd_to_cdf, source, fetched_at FROM fuel_app_exchangeratecache
		WHERE fetched_at >= ? ORDER BY fetched_at DESC LIMIT 1`, cutoff)
	r := models.ExchangeRateCache{USDToCDF: dj.Dec{Places: 4}}
	err := row.Scan(&r.ID, &r.USDToCDF, &r.Source, &r.FetchedAt)
	if isNoRows(err) {
		return r, ErrNotFound
	}
	return r, err
}

// LatestRate returns the newest cached rate regardless of age.
func (db *DB) LatestRate() (models.ExchangeRateCache, error) {
	row := db.QueryRow(`SELECT id, usd_to_cdf, source, fetched_at FROM fuel_app_exchangeratecache
		ORDER BY fetched_at DESC LIMIT 1`)
	r := models.ExchangeRateCache{USDToCDF: dj.Dec{Places: 4}}
	err := row.Scan(&r.ID, &r.USDToCDF, &r.Source, &r.FetchedAt)
	if isNoRows(err) {
		return r, ErrNotFound
	}
	return r, err
}

func (db *DB) InsertRate(rate dj.Dec, source string, fetchedAt dj.DjangoTime) error {
	_, err := db.Exec(`INSERT INTO fuel_app_exchangeratecache (usd_to_cdf, source, fetched_at) VALUES (?, ?, ?)`,
		rate, source, fetchedAt)
	return err
}

package services

import (
	"encoding/json"
	"freddy/server_v2/internal/dj"
	"net/http"
	"time"

	"github.com/shopspring/decimal"

	"freddy/server_v2/internal/store"
)

const RateCacheMinutes = 30

// FallbackRate mirrors services.FALLBACK_RATE.
var FallbackRate = decimal.RequireFromString("2800.00")

// Rates fetches and caches the USD→CDF exchange rate exactly like
// fuel_app.services.get_usd_to_cdf_rate.
type Rates struct {
	DB     *store.DB
	APIURL string
	Client *http.Client
	Now    func() time.Time
}

func NewRates(db *store.DB, apiURL string) *Rates {
	return &Rates{
		DB:     db,
		APIURL: apiURL,
		Client: &http.Client{Timeout: 5 * time.Second},
		Now:    time.Now,
	}
}

// USDToCDF returns the current rate: 30-minute DB cache, then live fetch,
// then last-known-rate, then the hardcoded fallback.
func (r *Rates) USDToCDF() dj.Dec {
	now := r.Now().UTC()
	cutoff := dj.NewTime(now.Add(-RateCacheMinutes * time.Minute))
	if cached, err := r.DB.LatestRateSince(cutoff); err == nil {
		return cached.USDToCDF
	}

	if rate, ok := r.fetch(); ok {
		_ = r.DB.InsertRate(rate, "open.er-api.com", dj.NewTime(now))
		return rate
	}

	if last, err := r.DB.LatestRate(); err == nil {
		return last.USDToCDF
	}
	return dj.Dec4(FallbackRate)
}

func (r *Rates) fetch() (dj.Dec, bool) {
	resp, err := r.Client.Get(r.APIURL)
	if err != nil {
		return dj.Dec{}, false
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return dj.Dec{}, false
	}
	var payload struct {
		Rates map[string]json.Number `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return dj.Dec{}, false
	}
	raw, ok := payload.Rates["CDF"]
	if !ok {
		return dj.Dec{}, false
	}
	d, err := decimal.NewFromString(raw.String())
	if err != nil {
		return dj.Dec{}, false
	}
	return dj.Dec4(d), true
}

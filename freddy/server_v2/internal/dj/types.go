// Package dj holds scalar types matching Django's SQLite storage formats
// (dashless hex UUIDs, naive-UTC datetime strings, NUMERIC-affinity decimals)
// and DRF's JSON rendering of them.
package dj

import (
	"crypto/rand"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

// ─── UUID ────────────────────────────────────────────────────────────────────

// UUID is a Django UUIDField value. Stored on disk as 32 lowercase hex chars
// (no dashes); rendered in JSON and URLs in canonical dashed form.
type UUID string // canonical dashed lowercase form, or "" for null/absent

func NewUUID() UUID {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10
	h := hex.EncodeToString(b[:])
	return UUID(h[0:8] + "-" + h[8:12] + "-" + h[12:16] + "-" + h[16:20] + "-" + h[20:32])
}

// ParseUUID accepts dashed or dashless hex and returns the canonical form.
func ParseUUID(s string) (UUID, error) {
	t := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(s), "-", ""))
	if len(t) != 32 {
		return "", fmt.Errorf("invalid UUID %q", s)
	}
	if _, err := hex.DecodeString(t); err != nil {
		return "", fmt.Errorf("invalid UUID %q", s)
	}
	return UUID(t[0:8] + "-" + t[8:12] + "-" + t[12:16] + "-" + t[16:20] + "-" + t[20:32]), nil
}

// Hex returns the 32-char dashless storage form.
func (u UUID) Hex() string { return strings.ReplaceAll(string(u), "-", "") }

func (u UUID) String() string { return string(u) }
func (u UUID) IsZero() bool   { return u == "" }
func (u UUID) Value() (driver.Value, error) {
	if u == "" {
		return nil, nil
	}
	return u.Hex(), nil
}

func (u *UUID) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*u = ""
		return nil
	case string:
		p, err := ParseUUID(v)
		if err != nil {
			return err
		}
		*u = p
		return nil
	case []byte:
		p, err := ParseUUID(string(v))
		if err != nil {
			return err
		}
		*u = p
		return nil
	}
	return fmt.Errorf("cannot scan %T into UUID", src)
}

func (u UUID) MarshalJSON() ([]byte, error) {
	if u == "" {
		return []byte("null"), nil
	}
	return json.Marshal(string(u))
}

func (u *UUID) UnmarshalJSON(b []byte) error {
	var s *string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == nil || *s == "" {
		*u = ""
		return nil
	}
	p, err := ParseUUID(*s)
	if err != nil {
		return err
	}
	*u = p
	return nil
}

// ─── DjangoTime ──────────────────────────────────────────────────────────────

// djStorageFmt is how Django writes aware datetimes to SQLite with USE_TZ:
// naive UTC, space separator, 6-digit microseconds.
const djStorageFmt = "2006-01-02 15:04:05.000000"

var djParseFmts = []string{
	"2006-01-02 15:04:05.999999",
	"2006-01-02 15:04:05",
	"2006-01-02 15:04:05.999999-07:00",
	time.RFC3339Nano,
	time.RFC3339,
}

// DjangoTime is a timezone-aware datetime stored in Django's SQLite text
// format and serialized in JSON the way DRF does (ISO-8601, Z suffix,
// microseconds only when nonzero).
type DjangoTime struct {
	time.Time
	Valid bool
}

func NewTime(t time.Time) DjangoTime { return DjangoTime{Time: t.UTC(), Valid: true} }

func (t DjangoTime) Value() (driver.Value, error) {
	if !t.Valid {
		return nil, nil
	}
	return t.Time.UTC().Format(djStorageFmt), nil
}

// StorageString is the exact text bound in SQL comparisons.
func (t DjangoTime) StorageString() string { return t.Time.UTC().Format(djStorageFmt) }

func parseDjangoTime(s string) (time.Time, error) {
	for _, f := range djParseFmts {
		if tt, err := time.Parse(f, s); err == nil {
			return tt.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse datetime %q", s)
}

func (t *DjangoTime) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*t = DjangoTime{}
		return nil
	case time.Time:
		*t = NewTime(v)
		return nil
	case string:
		tt, err := parseDjangoTime(v)
		if err != nil {
			return err
		}
		*t = NewTime(tt)
		return nil
	case []byte:
		tt, err := parseDjangoTime(string(v))
		if err != nil {
			return err
		}
		*t = NewTime(tt)
		return nil
	}
	return fmt.Errorf("cannot scan %T into DjangoTime", src)
}

// drfFormat renders a datetime the way DRF's JSON encoder does:
// isoformat() with "+00:00" replaced by "Z"; microseconds shown only if nonzero.
func drfFormat(t time.Time) string {
	t = t.UTC()
	if t.Nanosecond() != 0 {
		return t.Format("2006-01-02T15:04:05.000000") + "Z"
	}
	return t.Format("2006-01-02T15:04:05") + "Z"
}

func (t DjangoTime) MarshalJSON() ([]byte, error) {
	if !t.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(drfFormat(t.Time))
}

func (t *DjangoTime) UnmarshalJSON(b []byte) error {
	var s *string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == nil || *s == "" {
		*t = DjangoTime{}
		return nil
	}
	tt, err := ParseClientDateTime(*s)
	if err != nil {
		return err
	}
	*t = NewTime(tt)
	return nil
}

// ParseClientDateTime accepts the ISO-8601 shapes DRF's DateTimeField accepts
// from clients.
func ParseClientDateTime(s string) (time.Time, error) {
	for _, f := range []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02T15:04:05.999999",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04:05.999999",
		"2006-01-02",
	} {
		if tt, err := time.Parse(f, s); err == nil {
			return tt.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("invalid datetime %q", s)
}

// ─── DjangoDate ──────────────────────────────────────────────────────────────

// DjangoDate is a DateField: stored and serialized as YYYY-MM-DD.
type DjangoDate struct {
	time.Time
	Valid bool
}

func NewDate(t time.Time) DjangoDate {
	return DjangoDate{Time: time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), Valid: true}
}

func (d DjangoDate) Value() (driver.Value, error) {
	if !d.Valid {
		return nil, nil
	}
	return d.Time.Format("2006-01-02"), nil
}

func (d *DjangoDate) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*d = DjangoDate{}
		return nil
	case time.Time:
		*d = NewDate(v)
		return nil
	case string:
		return d.parse(v)
	case []byte:
		return d.parse(string(v))
	}
	return fmt.Errorf("cannot scan %T into DjangoDate", src)
}

func (d *DjangoDate) parse(s string) error {
	if len(s) > 10 {
		s = s[:10]
	}
	tt, err := time.Parse("2006-01-02", s)
	if err != nil {
		return fmt.Errorf("cannot parse date %q", s)
	}
	*d = NewDate(tt)
	return nil
}

func (d DjangoDate) MarshalJSON() ([]byte, error) {
	if !d.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(d.Time.Format("2006-01-02"))
}

func (d *DjangoDate) UnmarshalJSON(b []byte) error {
	var s *string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == nil || *s == "" {
		*d = DjangoDate{}
		return nil
	}
	return d.parse(*s)
}

// ─── Dec ─────────────────────────────────────────────────────────────────────

// Dec is a DecimalField value with a fixed number of decimal places. It scans
// SQLite NUMERIC-affinity values (stored as INTEGER/REAL/TEXT by Django) and
// serializes as a string with exactly Places decimals, matching DRF's
// COERCE_DECIMAL_TO_STRING behavior and Django's read-side quantization
// (ROUND_HALF_EVEN).
type Dec struct {
	D      decimal.Decimal
	Places int32
	Valid  bool
}

func NewDec(d decimal.Decimal, places int32) Dec {
	return Dec{D: d.RoundBank(places), Places: places, Valid: true}
}

func DecFromString(s string, places int32) (Dec, error) {
	d, err := decimal.NewFromString(strings.TrimSpace(s))
	if err != nil {
		return Dec{}, err
	}
	return Dec{D: d, Places: places, Valid: true}, nil
}

// Dec2 / Dec4 build valid decimals with common precisions.
func Dec2(d decimal.Decimal) Dec { return NewDec(d, 2) }
func Dec4(d decimal.Decimal) Dec { return NewDec(d, 4) }

func (d Dec) Value() (driver.Value, error) {
	if !d.Valid {
		return nil, nil
	}
	return d.D.String(), nil
}

// Scan quantizes to d.Places (set Places before scanning via the typed
// column helpers in each store file, or re-round after with WithPlaces).
func (d *Dec) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		d.Valid = false
		d.D = decimal.Zero
		return nil
	case int64:
		d.D = decimal.NewFromInt(v)
	case float64:
		d.D = decimal.NewFromFloat(v)
	case string:
		dd, err := decimal.NewFromString(v)
		if err != nil {
			return err
		}
		d.D = dd
	case []byte:
		dd, err := decimal.NewFromString(string(v))
		if err != nil {
			return err
		}
		d.D = dd
	default:
		return fmt.Errorf("cannot scan %T into Dec", src)
	}
	if d.Places > 0 {
		d.D = d.D.RoundBank(d.Places)
	}
	d.Valid = true
	return nil
}

// WithPlaces returns a copy rounded (half-even) to n places.
func (d Dec) WithPlaces(n int32) Dec {
	return Dec{D: d.D.RoundBank(n), Places: n, Valid: d.Valid}
}

// String renders with exactly Places decimals (DRF style).
func (d Dec) String() string { return d.D.StringFixed(d.Places) }

func (d Dec) MarshalJSON() ([]byte, error) {
	if !d.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(d.String())
}

func (d *Dec) UnmarshalJSON(b []byte) error {
	var raw any
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	switch v := raw.(type) {
	case nil:
		d.Valid = false
		return nil
	case string:
		if strings.TrimSpace(v) == "" {
			d.Valid = false
			return nil
		}
		dd, err := decimal.NewFromString(strings.TrimSpace(v))
		if err != nil {
			return fmt.Errorf("invalid decimal %q", v)
		}
		d.D = dd
	case float64:
		d.D = decimal.NewFromFloat(v)
	default:
		return fmt.Errorf("invalid decimal %v", raw)
	}
	d.Valid = true
	return nil
}

// Float returns a float64 view (for chart payloads that emit numbers).
func (d Dec) Float() float64 {
	f, _ := d.D.Float64()
	return f
}

// ─── nullable scalar helpers ────────────────────────────────────────────────

// NS scans a nullable text column into a plain string ("" for NULL) while
// remembering nullness for faithful writes.
type NS struct {
	S     string
	Valid bool
}

func NewNS(s string) NS { return NS{S: s, Valid: true} }

func (n NS) Value() (driver.Value, error) {
	if !n.Valid {
		return nil, nil
	}
	return n.S, nil
}

func (n *NS) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*n = NS{}
	case string:
		*n = NS{S: v, Valid: true}
	case []byte:
		*n = NS{S: string(v), Valid: true}
	case int64:
		*n = NS{S: strconv.FormatInt(v, 10), Valid: true}
	case float64:
		*n = NS{S: strconv.FormatFloat(v, 'f', -1, 64), Valid: true}
	default:
		return fmt.Errorf("cannot scan %T into NS", src)
	}
	return nil
}

func (n NS) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.S)
}

func (n *NS) UnmarshalJSON(b []byte) error {
	var s *string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == nil {
		*n = NS{}
	} else {
		*n = NS{S: *s, Valid: true}
	}
	return nil
}

// NB is a nullable boolean (Django BooleanField(null=True), stored 0/1/NULL).
type NB struct {
	B     bool
	Valid bool
}

func (n NB) Value() (driver.Value, error) {
	if !n.Valid {
		return nil, nil
	}
	if n.B {
		return int64(1), nil
	}
	return int64(0), nil
}

func (n *NB) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*n = NB{}
	case bool:
		*n = NB{B: v, Valid: true}
	case int64:
		*n = NB{B: v != 0, Valid: true}
	default:
		return fmt.Errorf("cannot scan %T into NB", src)
	}
	return nil
}

func (n NB) MarshalJSON() ([]byte, error) {
	if !n.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(n.B)
}

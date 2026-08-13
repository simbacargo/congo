package store

import (
	"freddy/server_v2/internal/dj"
	"strings"

	"freddy/server_v2/internal/models"
)

const driverCols = `d.id, d.submitted_at, d.score, d.full_name, d.gender, d.phone, d.email,
	d.marital_status, d.commune, d.quartier, d.city_country, d.vehicle_type, d.vehicle_color,
	d.daily_fuel_consumption, d.fuel_type, d.has_health_coverage, d.has_care_access_difficulty,
	d.dependents, d.field_agent, d.consent, d.registration_date, d.created_at`

func scanDriver(s interface{ Scan(...any) error }) (models.Driver, error) {
	var d models.Driver
	err := s.Scan(&d.ID, &d.SubmittedAt, &d.Score, &d.FullName, &d.Gender, &d.Phone, &d.Email,
		&d.MaritalStatus, &d.Commune, &d.Quartier, &d.CityCountry, &d.VehicleType, &d.VehicleColor,
		&d.DailyFuelConsumption, &d.FuelType, &d.HasHealthCoverage, &d.HasCareAccessDifficulty,
		&d.Dependents, &d.FieldAgent, &d.Consent, &d.RegistrationDate, &d.CreatedAt)
	return d, err
}

// DriverFilter mirrors driver_queryset's query-string filters.
type DriverFilter struct {
	Q           string // icontains over full_name/phone/email/quartier
	Commune     string
	VehicleType string
	FuelType    string
	Agent       string
}

func (f DriverFilter) where() (string, []any) {
	var conds []string
	var args []any
	if f.Q != "" {
		like := "%" + strings.ToLower(f.Q) + "%"
		conds = append(conds, `(LOWER(COALESCE(d.full_name,'')) LIKE ? OR LOWER(COALESCE(d.phone,'')) LIKE ?
			OR LOWER(COALESCE(d.email,'')) LIKE ? OR LOWER(COALESCE(d.quartier,'')) LIKE ?)`)
		args = append(args, like, like, like, like)
	}
	for col, val := range map[string]string{
		"d.commune": f.Commune, "d.vehicle_type": f.VehicleType,
		"d.fuel_type": f.FuelType, "d.field_agent": f.Agent,
	} {
		if val != "" {
			conds = append(conds, col+" = ?")
			args = append(args, val)
		}
	}
	if len(conds) == 0 {
		return "", nil
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}

// DriverSortable mirrors services.DRIVER_SORTABLE.
var DriverSortable = map[string]string{
	"name": "full_name", "commune": "commune", "vehicle": "vehicle_type",
	"fuel": "fuel_type", "consumption": "daily_fuel_consumption",
	"agent": "field_agent", "registered": "registration_date",
}

// Drivers lists drivers with filtering, sorting and paging. sortKey is a
// DriverSortable key; desc flips direction.
func (db *DB) Drivers(f DriverFilter, sortKey string, desc bool, limit, offset int) ([]models.Driver, error) {
	col, ok := DriverSortable[sortKey]
	if !ok {
		col = "full_name"
	}
	dir := "ASC"
	if desc {
		dir = "DESC"
	}
	where, args := f.where()
	q := `SELECT ` + driverCols + ` FROM fuel_app_driver d` + where +
		` ORDER BY d.` + col + ` ` + dir
	if limit > 0 {
		q += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Driver
	for rows.Next() {
		d, err := scanDriver(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (db *DB) DriverCount(f DriverFilter) (int64, error) {
	where, args := f.where()
	var n int64
	err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_driver d`+where, args...).Scan(&n)
	return n, err
}

func (db *DB) DriverTotalCount() (int64, error) {
	var n int64
	err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_driver`).Scan(&n)
	return n, err
}

func (db *DB) DriverByID(id dj.UUID) (models.Driver, error) {
	row := db.QueryRow(`SELECT `+driverCols+` FROM fuel_app_driver d WHERE d.id = ?`, id)
	d, err := scanDriver(row)
	if isNoRows(err) {
		return d, ErrNotFound
	}
	return d, err
}

// DriverOptions returns the sorted distinct non-empty values of a filterable
// column (commune, vehicle_type, fuel_type, field_agent).
func (db *DB) DriverOptions(col string) ([]string, error) {
	allowed := map[string]bool{"commune": true, "vehicle_type": true, "fuel_type": true, "field_agent": true}
	if !allowed[col] {
		return nil, nil
	}
	rows, err := db.Query(`SELECT DISTINCT ` + col + ` FROM fuel_app_driver
		WHERE ` + col + ` IS NOT NULL AND ` + col + ` != '' ORDER BY ` + col)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// DriverBreakdown mirrors the drivers page _breakdown(field, limit): counts
// per non-empty value, ordered by count desc.
func (db *DB) DriverBreakdown(f DriverFilter, col string, limit int) ([]GroupTotal, error) {
	allowed := map[string]bool{
		"commune": true, "vehicle_type": true, "fuel_type": true,
		"field_agent": true, "daily_fuel_consumption": true,
	}
	if !allowed[col] {
		return nil, nil
	}
	where, args := f.where()
	if where == "" {
		where = " WHERE "
	} else {
		where += " AND "
	}
	where += `d.` + col + ` IS NOT NULL AND d.` + col + ` != ''`
	q := `SELECT d.` + col + `, COUNT(d.id) FROM fuel_app_driver d` + where +
		` GROUP BY d.` + col + ` ORDER BY COUNT(d.id) DESC`
	if limit > 0 {
		q += ` LIMIT ?`
		args = append(args, limit)
	}
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GroupTotal
	for rows.Next() {
		var g GroupTotal
		if err := rows.Scan(&g.Key, &g.Count); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

// DriverHealthCounts returns yes/no/unknown has_health_coverage counts under
// the active filters.
func (db *DB) DriverHealthCounts(f DriverFilter) (yes, no, unknown int64, err error) {
	where, args := f.where()
	row := db.QueryRow(`SELECT
		COALESCE(SUM(CASE WHEN d.has_health_coverage = 1 THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN d.has_health_coverage = 0 THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN d.has_health_coverage IS NULL THEN 1 ELSE 0 END), 0)
		FROM fuel_app_driver d`+where, args...)
	err = row.Scan(&yes, &no, &unknown)
	return
}

// DriverDistinctAgentCount counts distinct non-empty field_agent values under
// the active filters.
func (db *DB) DriverDistinctAgentCount(f DriverFilter) (int64, error) {
	where, args := f.where()
	if where == "" {
		where = " WHERE "
	} else {
		where += " AND "
	}
	where += `d.field_agent IS NOT NULL AND d.field_agent != ''`
	var n int64
	err := db.QueryRow(`SELECT COUNT(DISTINCT d.field_agent) FROM fuel_app_driver d`+where, args...).Scan(&n)
	return n, err
}

// DriverBySubmittedAt supports the idempotent importer.
func (db *DB) DriverBySubmittedAt(t dj.DjangoTime) (models.Driver, error) {
	row := db.QueryRow(`SELECT `+driverCols+` FROM fuel_app_driver d WHERE d.submitted_at = ?`, t)
	d, err := scanDriver(row)
	if isNoRows(err) {
		return d, ErrNotFound
	}
	return d, err
}

func (db *DB) CreateDriver(d models.Driver) error {
	_, err := db.Exec(`INSERT INTO fuel_app_driver (
		id, submitted_at, score, full_name, gender, phone, email, marital_status,
		commune, quartier, city_country, vehicle_type, vehicle_color,
		daily_fuel_consumption, fuel_type, has_health_coverage, has_care_access_difficulty,
		dependents, field_agent, consent, registration_date, created_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		d.ID, d.SubmittedAt, d.Score, d.FullName, d.Gender, d.Phone, d.Email, d.MaritalStatus,
		d.Commune, d.Quartier, d.CityCountry, d.VehicleType, d.VehicleColor,
		d.DailyFuelConsumption, d.FuelType, d.HasHealthCoverage, d.HasCareAccessDifficulty,
		d.Dependents, d.FieldAgent, d.Consent, d.RegistrationDate, d.CreatedAt)
	return err
}

func (db *DB) UpdateDriver(d models.Driver) error {
	_, err := db.Exec(`UPDATE fuel_app_driver SET
		score = ?, full_name = ?, gender = ?, phone = ?, email = ?, marital_status = ?,
		commune = ?, quartier = ?, city_country = ?, vehicle_type = ?, vehicle_color = ?,
		daily_fuel_consumption = ?, fuel_type = ?, has_health_coverage = ?, has_care_access_difficulty = ?,
		dependents = ?, field_agent = ?, consent = ?, registration_date = ?
		WHERE id = ?`,
		d.Score, d.FullName, d.Gender, d.Phone, d.Email, d.MaritalStatus,
		d.Commune, d.Quartier, d.CityCountry, d.VehicleType, d.VehicleColor,
		d.DailyFuelConsumption, d.FuelType, d.HasHealthCoverage, d.HasCareAccessDifficulty,
		d.Dependents, d.FieldAgent, d.Consent, d.RegistrationDate, d.ID)
	return err
}

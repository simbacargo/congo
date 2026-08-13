package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

// ─── ParentCompany ───────────────────────────────────────────────────────────

const companyCols = `c.id, c.name, c.code, c.logo, c.contact_email, c.contact_phone, c.is_active, c.created_at`

func scanCompany(s interface{ Scan(...any) error }) (models.ParentCompany, error) {
	var c models.ParentCompany
	err := s.Scan(&c.ID, &c.Name, &c.Code, &c.Logo, &c.ContactEmail, &c.ContactPhone, &c.IsActive, &c.CreatedAt)
	return c, err
}

// Companies returns companies ordered by name; activeOnly filters is_active.
func (db *DB) Companies(activeOnly bool) ([]models.ParentCompany, error) {
	q := `SELECT ` + companyCols + ` FROM fuel_app_parentcompany c`
	if activeOnly {
		q += ` WHERE c.is_active = 1`
	}
	q += ` ORDER BY c.name`
	rows, err := db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.ParentCompany
	for rows.Next() {
		c, err := scanCompany(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (db *DB) CompanyByID(id dj.UUID) (models.ParentCompany, error) {
	row := db.QueryRow(`SELECT `+companyCols+` FROM fuel_app_parentcompany c WHERE c.id = ?`, id)
	c, err := scanCompany(row)
	if isNoRows(err) {
		return c, ErrNotFound
	}
	return c, err
}

func (db *DB) CreateCompany(c models.ParentCompany) error {
	_, err := db.Exec(`INSERT INTO fuel_app_parentcompany
		(id, name, code, logo, contact_email, contact_phone, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.Code, c.Logo, c.ContactEmail, c.ContactPhone, c.IsActive, c.CreatedAt)
	return err
}

func (db *DB) UpdateCompany(c models.ParentCompany) error {
	_, err := db.Exec(`UPDATE fuel_app_parentcompany SET
		name = ?, code = ?, logo = ?, contact_email = ?, contact_phone = ?, is_active = ?
		WHERE id = ?`,
		c.Name, c.Code, c.Logo, c.ContactEmail, c.ContactPhone, c.IsActive, c.ID)
	return err
}

// ─── FuelStation ─────────────────────────────────────────────────────────────

const stationCols = `s.id, s.name, s.code, s.company_id, s.address, s.latitude, s.longitude,
	s.is_active, s.created_at, c.name, c.code`

func scanStation(s interface{ Scan(...any) error }) (models.FuelStation, error) {
	var st models.FuelStation
	st.Latitude.Places, st.Longitude.Places = 6, 6
	err := s.Scan(&st.ID, &st.Name, &st.Code, &st.CompanyID, &st.Address, &st.Latitude, &st.Longitude,
		&st.IsActive, &st.CreatedAt, &st.CompanyName, &st.CompanyCode)
	return st, err
}

const stationFrom = ` FROM fuel_app_fuelstation s JOIN fuel_app_parentcompany c ON c.id = s.company_id`

// Stations lists stations ordered by (company name, name).
func (db *DB) Stations(activeOnly bool, companyID dj.UUID) ([]models.FuelStation, error) {
	q := `SELECT ` + stationCols + stationFrom + ` WHERE 1=1`
	var args []any
	if activeOnly {
		q += ` AND s.is_active = 1`
	}
	if companyID != "" {
		q += ` AND s.company_id = ?`
		args = append(args, companyID)
	}
	q += ` ORDER BY c.name, s.name`
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.FuelStation
	for rows.Next() {
		st, err := scanStation(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

func (db *DB) StationByID(id dj.UUID) (models.FuelStation, error) {
	row := db.QueryRow(`SELECT `+stationCols+stationFrom+` WHERE s.id = ?`, id)
	st, err := scanStation(row)
	if isNoRows(err) {
		return st, ErrNotFound
	}
	return st, err
}

func (db *DB) CreateStation(s models.FuelStation) error {
	_, err := db.Exec(`INSERT INTO fuel_app_fuelstation
		(id, name, code, company_id, address, latitude, longitude, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.Name, s.Code, s.CompanyID, s.Address, s.Latitude, s.Longitude, s.IsActive, s.CreatedAt)
	return err
}

func (db *DB) UpdateStation(s models.FuelStation) error {
	_, err := db.Exec(`UPDATE fuel_app_fuelstation SET
		name = ?, code = ?, company_id = ?, address = ?, latitude = ?, longitude = ?, is_active = ?
		WHERE id = ?`,
		s.Name, s.Code, s.CompanyID, s.Address, s.Latitude, s.Longitude, s.IsActive, s.ID)
	return err
}

// ─── Church ──────────────────────────────────────────────────────────────────

const churchCols = `ch.id, ch.name, ch.station_id, ch.contact_person, ch.contact_phone,
	ch.beneficiary_count, ch.is_active, ch.created_at, s.name, c.name`

const churchFrom = ` FROM fuel_app_church ch
	JOIN fuel_app_fuelstation s ON s.id = ch.station_id
	JOIN fuel_app_parentcompany c ON c.id = s.company_id`

func scanChurch(s interface{ Scan(...any) error }) (models.Church, error) {
	var ch models.Church
	err := s.Scan(&ch.ID, &ch.Name, &ch.StationID, &ch.ContactPerson, &ch.ContactPhone,
		&ch.BeneficiaryCount, &ch.IsActive, &ch.CreatedAt, &ch.StationName, &ch.CompanyName)
	return ch, err
}

// Churches lists churches ordered by name (the model default).
func (db *DB) Churches(activeOnly bool, stationID dj.UUID) ([]models.Church, error) {
	q := `SELECT ` + churchCols + churchFrom + ` WHERE 1=1`
	var args []any
	if activeOnly {
		q += ` AND ch.is_active = 1`
	}
	if stationID != "" {
		q += ` AND ch.station_id = ?`
		args = append(args, stationID)
	}
	q += ` ORDER BY ch.name`
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Church
	for rows.Next() {
		ch, err := scanChurch(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, ch)
	}
	return out, rows.Err()
}

func (db *DB) ChurchByID(id dj.UUID) (models.Church, error) {
	row := db.QueryRow(`SELECT `+churchCols+churchFrom+` WHERE ch.id = ?`, id)
	ch, err := scanChurch(row)
	if isNoRows(err) {
		return ch, ErrNotFound
	}
	return ch, err
}

func (db *DB) CreateChurch(ch models.Church) error {
	_, err := db.Exec(`INSERT INTO fuel_app_church
		(id, name, station_id, contact_person, contact_phone, beneficiary_count, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		ch.ID, ch.Name, ch.StationID, ch.ContactPerson, ch.ContactPhone, ch.BeneficiaryCount, ch.IsActive, ch.CreatedAt)
	return err
}

func (db *DB) UpdateChurch(ch models.Church) error {
	_, err := db.Exec(`UPDATE fuel_app_church SET
		name = ?, station_id = ?, contact_person = ?, contact_phone = ?, beneficiary_count = ?, is_active = ?
		WHERE id = ?`,
		ch.Name, ch.StationID, ch.ContactPerson, ch.ContactPhone, ch.BeneficiaryCount, ch.IsActive, ch.ID)
	return err
}

// ─── FuelType ────────────────────────────────────────────────────────────────

// FuelTypes lists fuel types in insertion order (Django has no Meta.ordering
// on FuelType, so SQLite returns rowid order).
func (db *DB) FuelTypes(activeOnly bool) ([]models.FuelType, error) {
	q := `SELECT id, name, code, is_active FROM fuel_app_fueltype`
	if activeOnly {
		q += ` WHERE is_active = 1`
	}
	rows, err := db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.FuelType
	for rows.Next() {
		var ft models.FuelType
		if err := rows.Scan(&ft.ID, &ft.Name, &ft.Code, &ft.IsActive); err != nil {
			return nil, err
		}
		out = append(out, ft)
	}
	return out, rows.Err()
}

func (db *DB) FuelTypeByID(id dj.UUID) (models.FuelType, error) {
	row := db.QueryRow(`SELECT id, name, code, is_active FROM fuel_app_fueltype WHERE id = ?`, id)
	var ft models.FuelType
	err := row.Scan(&ft.ID, &ft.Name, &ft.Code, &ft.IsActive)
	if isNoRows(err) {
		return ft, ErrNotFound
	}
	return ft, err
}

func (db *DB) CreateFuelType(ft models.FuelType) error {
	_, err := db.Exec(`INSERT INTO fuel_app_fueltype (id, name, code, is_active) VALUES (?, ?, ?, ?)`,
		ft.ID, ft.Name, ft.Code, ft.IsActive)
	return err
}

func (db *DB) UpdateFuelType(ft models.FuelType) error {
	_, err := db.Exec(`UPDATE fuel_app_fueltype SET name = ?, code = ?, is_active = ? WHERE id = ?`,
		ft.Name, ft.Code, ft.IsActive, ft.ID)
	return err
}

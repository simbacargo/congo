package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

const disbCols = `d.id, d.reference, d.church_id, d.period_start, d.period_end,
	d.amount_usd, d.amount_cdf, d.status, d.paid_at, d.payment_method, d.notes,
	d.prepared_by_id, d.created_at, d.updated_at, ch.name, s.name, c.name, u.username`

const disbFrom = ` FROM fuel_app_disbursement d
	JOIN fuel_app_church ch ON ch.id = d.church_id
	JOIN fuel_app_fuelstation s ON s.id = ch.station_id
	JOIN fuel_app_parentcompany c ON c.id = s.company_id
	LEFT JOIN authentication_user u ON u.id = d.prepared_by_id`

func scanDisb(s interface{ Scan(...any) error }) (models.Disbursement, error) {
	var d models.Disbursement
	d.AmountUSD.Places, d.AmountCDF.Places = 2, 2
	err := s.Scan(&d.ID, &d.Reference, &d.ChurchID, &d.PeriodStart, &d.PeriodEnd,
		&d.AmountUSD, &d.AmountCDF, &d.Status, &d.PaidAt, &d.PaymentMethod, &d.Notes,
		&d.PreparedByID, &d.CreatedAt, &d.UpdatedAt, &d.ChurchName, &d.StationName, &d.CompanyName,
		&d.PreparedByUsername)
	return d, err
}

// Disbursements lists newest-first, optionally filtered by status and/or
// church.
func (db *DB) Disbursements(status string, churchID dj.UUID, limit, offset int) ([]models.Disbursement, error) {
	q := `SELECT ` + disbCols + disbFrom + ` WHERE 1=1`
	var args []any
	if status != "" {
		q += ` AND d.status = ?`
		args = append(args, status)
	}
	if churchID != "" {
		q += ` AND d.church_id = ?`
		args = append(args, churchID)
	}
	q += ` ORDER BY d.created_at DESC`
	if limit > 0 {
		q += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Disbursement
	for rows.Next() {
		d, err := scanDisb(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (db *DB) DisbursementCount(status string) (int64, error) {
	q := `SELECT COUNT(*) FROM fuel_app_disbursement WHERE 1=1`
	var args []any
	if status != "" {
		q += ` AND status = ?`
		args = append(args, status)
	}
	var n int64
	err := db.QueryRow(q, args...).Scan(&n)
	return n, err
}

// DisbursementTotals mirrors qs.aggregate(total=Sum(amount_usd), count=Count(id)).
func (db *DB) DisbursementTotals(status string) (dj.Dec, int64, error) {
	q := `SELECT COALESCE(SUM(amount_usd), 0), COUNT(id) FROM fuel_app_disbursement WHERE 1=1`
	var args []any
	if status != "" {
		q += ` AND status = ?`
		args = append(args, status)
	}
	d := dj.Dec{Places: 2}
	var n int64
	err := db.QueryRow(q, args...).Scan(&d, &n)
	return d, n, err
}

// PaidDisbursementTotal mirrors kpi_stats' total_disbursed.
func (db *DB) PaidDisbursementTotal() (dj.Dec, error) {
	d := dj.Dec{Places: 2}
	err := db.QueryRow(
		`SELECT COALESCE(SUM(amount_usd), 0) FROM fuel_app_disbursement WHERE status = ?`,
		models.DisbPaid,
	).Scan(&d)
	return d, err
}

func (db *DB) DisbursementByID(id dj.UUID) (models.Disbursement, error) {
	row := db.QueryRow(`SELECT `+disbCols+disbFrom+` WHERE d.id = ?`, id)
	d, err := scanDisb(row)
	if isNoRows(err) {
		return d, ErrNotFound
	}
	return d, err
}

func (db *DB) CreateDisbursement(d models.Disbursement) error {
	_, err := db.Exec(`INSERT INTO fuel_app_disbursement (
		id, reference, church_id, period_start, period_end, amount_usd, amount_cdf,
		status, paid_at, payment_method, notes, prepared_by_id, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		d.ID, d.Reference, d.ChurchID, d.PeriodStart, d.PeriodEnd, d.AmountUSD, d.AmountCDF,
		d.Status, d.PaidAt, d.PaymentMethod, d.Notes, d.PreparedByID, d.CreatedAt, d.UpdatedAt)
	return err
}

func (db *DB) UpdateDisbursement(d models.Disbursement) error {
	_, err := db.Exec(`UPDATE fuel_app_disbursement SET
		church_id = ?, period_start = ?, period_end = ?, amount_usd = ?, amount_cdf = ?,
		status = ?, paid_at = ?, payment_method = ?, notes = ?, updated_at = ?
		WHERE id = ?`,
		d.ChurchID, d.PeriodStart, d.PeriodEnd, d.AmountUSD, d.AmountCDF,
		d.Status, d.PaidAt, d.PaymentMethod, d.Notes, d.UpdatedAt, d.ID)
	return err
}

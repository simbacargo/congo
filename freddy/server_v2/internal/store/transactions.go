package store

import (
	"freddy/server_v2/internal/dj"
	"strings"

	"freddy/server_v2/internal/models"
)

const txCols = `t.id, t.receipt_code, t.station_id, t.church_id, t.agent_id, t.fuel_type_id,
	t.currency_used, t.amount_usd, t.amount_cdf, t.exchange_rate, t.levy_amount_usd, t.levy_amount_cdf,
	t.status, t.notes, t.driver_phone, t.sync_id, t.created_at, t.updated_at,
	s.name, c.name, ch.name, u.username, ft.name`

const txFrom = ` FROM fuel_app_transaction t
	JOIN fuel_app_fuelstation s ON s.id = t.station_id
	JOIN fuel_app_parentcompany c ON c.id = s.company_id
	JOIN fuel_app_church ch ON ch.id = t.church_id
	JOIN authentication_user u ON u.id = t.agent_id
	JOIN fuel_app_fueltype ft ON ft.id = t.fuel_type_id`

func scanTx(s interface{ Scan(...any) error }) (models.Transaction, error) {
	var t models.Transaction
	t.AmountUSD.Places, t.AmountCDF.Places = 2, 2
	t.ExchangeRate.Places, t.LevyAmountUSD.Places, t.LevyAmountCDF.Places = 4, 4, 4
	err := s.Scan(&t.ID, &t.ReceiptCode, &t.StationID, &t.ChurchID, &t.AgentID, &t.FuelTypeID,
		&t.CurrencyUsed, &t.AmountUSD, &t.AmountCDF, &t.ExchangeRate, &t.LevyAmountUSD, &t.LevyAmountCDF,
		&t.Status, &t.Notes, &t.DriverPhone, &t.SyncID, &t.CreatedAt, &t.UpdatedAt,
		&t.StationName, &t.CompanyName, &t.ChurchName, &t.AgentUsername, &t.FuelTypeName)
	return t, err
}

// TxFilter mirrors the query filters shared by the web list, admin API and
// the role scoping applied by the mobile list.
type TxFilter struct {
	Search      string
	CompanyID   dj.UUID
	StationID   dj.UUID
	Status      string
	DateFrom    string // YYYY-MM-DD inclusive
	DateTo      string // YYYY-MM-DD inclusive
	DriverPhone string
	// Role scoping. ScopeNone forces an empty result (agent/manager without
	// an assignment), matching qs.none().
	ScopeStation dj.UUID
	ScopeCompany dj.UUID
	ScopeNone    bool
}

func (f TxFilter) where() (string, []any) {
	var conds []string
	var args []any
	if f.ScopeNone {
		conds = append(conds, "1=0")
	}
	if f.ScopeStation != "" {
		conds = append(conds, "t.station_id = ?")
		args = append(args, f.ScopeStation)
	}
	if f.ScopeCompany != "" {
		conds = append(conds, "s.company_id = ?")
		args = append(args, f.ScopeCompany)
	}
	if f.Search != "" {
		like := "%" + strings.ToLower(f.Search) + "%"
		conds = append(conds, `(LOWER(t.receipt_code) LIKE ? OR LOWER(ch.name) LIKE ?
			OR LOWER(s.name) LIKE ? OR LOWER(u.username) LIKE ?)`)
		args = append(args, like, like, like, like)
	}
	if f.CompanyID != "" {
		conds = append(conds, "s.company_id = ?")
		args = append(args, f.CompanyID)
	}
	if f.StationID != "" {
		conds = append(conds, "t.station_id = ?")
		args = append(args, f.StationID)
	}
	if f.Status != "" {
		conds = append(conds, "t.status = ?")
		args = append(args, f.Status)
	}
	if f.DateFrom != "" {
		conds = append(conds, "substr(t.created_at, 1, 10) >= ?")
		args = append(args, f.DateFrom)
	}
	if f.DateTo != "" {
		conds = append(conds, "substr(t.created_at, 1, 10) <= ?")
		args = append(args, f.DateTo)
	}
	if f.DriverPhone != "" {
		conds = append(conds, "t.driver_phone = ?")
		args = append(args, f.DriverPhone)
	}
	if len(conds) == 0 {
		return "", nil
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}

// Transactions returns rows ordered -created_at with an optional limit/offset
// (limit <= 0 means no limit).
func (db *DB) Transactions(f TxFilter, limit, offset int) ([]models.Transaction, error) {
	where, args := f.where()
	q := `SELECT ` + txCols + txFrom + where + ` ORDER BY t.created_at DESC`
	if limit > 0 {
		q += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Transaction
	for rows.Next() {
		t, err := scanTx(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// TxTotals mirrors qs.aggregate(levy=Sum(levy_amount_usd), count=Count(id)).
type TxTotals struct {
	Levy  dj.Dec
	Count int64
}

func (db *DB) TransactionTotals(f TxFilter) (TxTotals, error) {
	where, args := f.where()
	row := db.QueryRow(`SELECT COALESCE(SUM(t.levy_amount_usd), 0), COUNT(t.id)`+txFrom+where, args...)
	t := TxTotals{Levy: dj.Dec{Places: 4}}
	err := row.Scan(&t.Levy, &t.Count)
	return t, err
}

func (db *DB) TransactionCount(f TxFilter) (int64, error) {
	where, args := f.where()
	var n int64
	err := db.QueryRow(`SELECT COUNT(t.id)`+txFrom+where, args...).Scan(&n)
	return n, err
}

func (db *DB) TransactionByID(id dj.UUID) (models.Transaction, error) {
	row := db.QueryRow(`SELECT `+txCols+txFrom+` WHERE t.id = ?`, id)
	t, err := scanTx(row)
	if isNoRows(err) {
		return t, ErrNotFound
	}
	return t, err
}

func (db *DB) TransactionByReceipt(code string) (models.Transaction, error) {
	row := db.QueryRow(`SELECT `+txCols+txFrom+` WHERE t.receipt_code = ?`, code)
	t, err := scanTx(row)
	if isNoRows(err) {
		return t, ErrNotFound
	}
	return t, err
}

func (db *DB) SyncIDExists(syncID string) (bool, error) {
	var n int
	err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_transaction WHERE sync_id = ?`, syncID).Scan(&n)
	return n > 0, err
}

func (db *DB) CreateTransaction(t models.Transaction) error {
	_, err := db.Exec(`INSERT INTO fuel_app_transaction (
		id, receipt_code, station_id, church_id, agent_id, fuel_type_id,
		currency_used, amount_usd, amount_cdf, exchange_rate, levy_amount_usd, levy_amount_cdf,
		status, notes, driver_phone, sync_id, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.ReceiptCode, t.StationID, t.ChurchID, t.AgentID, t.FuelTypeID,
		t.CurrencyUsed, t.AmountUSD, t.AmountCDF, t.ExchangeRate, t.LevyAmountUSD, t.LevyAmountCDF,
		t.Status, t.Notes, t.DriverPhone, t.SyncID, t.CreatedAt, t.UpdatedAt)
	return err
}

// UpdateTransactionStatusNotes applies the status/notes PATCH (+ auto_now
// updated_at).
func (db *DB) UpdateTransactionStatusNotes(id dj.UUID, status string, notes dj.NS, updatedAt dj.DjangoTime) error {
	_, err := db.Exec(`UPDATE fuel_app_transaction SET status = ?, notes = ?, updated_at = ? WHERE id = ?`,
		status, notes, updatedAt, id)
	return err
}

func (db *DB) UpdateTransactionStatus(id dj.UUID, status string, updatedAt dj.DjangoTime) error {
	_, err := db.Exec(`UPDATE fuel_app_transaction SET status = ?, updated_at = ? WHERE id = ?`,
		status, updatedAt, id)
	return err
}

// ─── aggregates used by dashboards / reports ────────────────────────────────

// GroupTotal is one row of a values().annotate(total=Sum, count=Count) query.
type GroupTotal struct {
	Key   string
	KeyID dj.UUID // optional second key (e.g. company id)
	Total dj.Dec
	Count int64
}

// LevyByCompany mirrors kpi_stats' by_company aggregate (ordered -total).
func (db *DB) LevyByCompany() ([]GroupTotal, error) {
	rows, err := db.Query(`SELECT c.name, c.id, COALESCE(SUM(t.levy_amount_usd), 0), COUNT(t.id)` + txFrom + `
		GROUP BY c.id, c.name ORDER BY SUM(t.levy_amount_usd) DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GroupTotal
	for rows.Next() {
		g := GroupTotal{Total: dj.Dec{Places: 4}}
		if err := rows.Scan(&g.Key, &g.KeyID, &g.Total, &g.Count); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

// LevyByFuel mirrors kpi_stats' by_fuel aggregate.
func (db *DB) LevyByFuel() ([]GroupTotal, error) {
	rows, err := db.Query(`SELECT ft.name, '', COALESCE(SUM(t.levy_amount_usd), 0), COUNT(t.id)` + txFrom + `
		GROUP BY ft.id, ft.name ORDER BY SUM(t.levy_amount_usd) DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []GroupTotal
	for rows.Next() {
		g := GroupTotal{Total: dj.Dec{Places: 4}}
		var ignore string
		if err := rows.Scan(&g.Key, &ignore, &g.Total, &g.Count); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

// LevySumForDate returns Sum(levy_amount_usd) for one calendar date
// (created_at__date=d).
func (db *DB) LevySumForDate(date string) (dj.Dec, error) {
	d := dj.Dec{Places: 4}
	err := db.QueryRow(
		`SELECT COALESCE(SUM(levy_amount_usd), 0) FROM fuel_app_transaction WHERE substr(created_at, 1, 10) = ?`,
		date,
	).Scan(&d)
	return d, err
}

// LevyByDateRange returns per-day sums between from/to (inclusive) in one
// query; missing days simply have no row.
func (db *DB) LevyByDateRange(from, to string) (map[string]dj.Dec, error) {
	rows, err := db.Query(`SELECT substr(created_at, 1, 10), COALESCE(SUM(levy_amount_usd), 0)
		FROM fuel_app_transaction
		WHERE substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?
		GROUP BY substr(created_at, 1, 10)`, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]dj.Dec{}
	for rows.Next() {
		var day string
		d := dj.Dec{Places: 4}
		if err := rows.Scan(&day, &d); err != nil {
			return nil, err
		}
		out[day] = d
	}
	return out, rows.Err()
}

// CountByStatus returns the number of transactions in the given status.
func (db *DB) CountByStatus(status string) (int64, error) {
	var n int64
	err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_transaction WHERE status = ?`, status).Scan(&n)
	return n, err
}

// LevySince aggregates Sum+Count for created_at >= cutoff.
func (db *DB) LevySince(cutoff dj.DjangoTime) (dj.Dec, int64, error) {
	d := dj.Dec{Places: 4}
	var n int64
	err := db.QueryRow(
		`SELECT COALESCE(SUM(levy_amount_usd), 0), COUNT(id) FROM fuel_app_transaction WHERE created_at >= ?`,
		cutoff,
	).Scan(&d, &n)
	return d, n, err
}

// SumAmountUSD mirrors aggregate(total_amount_usd=Sum("amount_usd")).
func (db *DB) SumAmountUSD(f TxFilter) (dj.Dec, error) {
	where, args := f.where()
	d := dj.Dec{Places: 2}
	err := db.QueryRow(`SELECT COALESCE(SUM(t.amount_usd), 0)`+txFrom+where, args...).Scan(&d)
	return d, err
}

// LevyTotal aggregates over all transactions.
func (db *DB) LevyTotal() (dj.Dec, int64, error) {
	d := dj.Dec{Places: 4}
	var n int64
	err := db.QueryRow(`SELECT COALESCE(SUM(levy_amount_usd), 0), COUNT(id) FROM fuel_app_transaction`).Scan(&d, &n)
	return d, n, err
}

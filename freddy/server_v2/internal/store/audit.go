package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

func (db *DB) CreateAuditLog(l models.TransactionAuditLog) error {
	_, err := db.Exec(`INSERT INTO fuel_app_transactionauditlog
		(transaction_id, changed_by_id, field_name, old_value, new_value, changed_at, ip_address)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		l.TransactionID, l.ChangedByID, l.FieldName, l.OldValue, l.NewValue, l.ChangedAt, l.IPAddress)
	return err
}

const auditCols = `a.id, a.transaction_id, a.changed_by_id, a.field_name, a.old_value, a.new_value,
	a.changed_at, a.ip_address, u.username`

func scanAudit(s interface{ Scan(...any) error }) (models.TransactionAuditLog, error) {
	var l models.TransactionAuditLog
	err := s.Scan(&l.ID, &l.TransactionID, &l.ChangedByID, &l.FieldName, &l.OldValue, &l.NewValue,
		&l.ChangedAt, &l.IPAddress, &l.ChangedByUsername)
	return l, err
}

// AuditLogsForTransaction returns a transaction's audit entries, newest first.
func (db *DB) AuditLogsForTransaction(txID dj.UUID) ([]models.TransactionAuditLog, error) {
	rows, err := db.Query(`SELECT `+auditCols+`
		FROM fuel_app_transactionauditlog a
		LEFT JOIN authentication_user u ON u.id = a.changed_by_id
		WHERE a.transaction_id = ? ORDER BY a.changed_at DESC, a.id DESC`, txID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.TransactionAuditLog
	for rows.Next() {
		l, err := scanAudit(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// AuditLogs returns recent audit entries with receipt + company context.
func (db *DB) AuditLogs(limit, offset int) ([]models.TransactionAuditLog, error) {
	q := `SELECT ` + auditCols + `, t.receipt_code, c.name
		FROM fuel_app_transactionauditlog a
		LEFT JOIN authentication_user u ON u.id = a.changed_by_id
		JOIN fuel_app_transaction t ON t.id = a.transaction_id
		JOIN fuel_app_fuelstation s ON s.id = t.station_id
		JOIN fuel_app_parentcompany c ON c.id = s.company_id
		ORDER BY a.changed_at DESC, a.id DESC`
	var args []any
	if limit > 0 {
		q += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}
	rows, err := db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.TransactionAuditLog
	for rows.Next() {
		var l models.TransactionAuditLog
		if err := rows.Scan(&l.ID, &l.TransactionID, &l.ChangedByID, &l.FieldName, &l.OldValue, &l.NewValue,
			&l.ChangedAt, &l.IPAddress, &l.ChangedByUsername, &l.ReceiptCode, &l.CompanyName); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (db *DB) AuditLogCount() (int64, error) {
	var n int64
	err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_transactionauditlog`).Scan(&n)
	return n, err
}

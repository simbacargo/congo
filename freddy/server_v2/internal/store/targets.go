package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

// StationTargets returns the targets for a given year/month keyed by station.
func (db *DB) StationTargets(year, month int) (map[dj.UUID]dj.Dec, error) {
	rows, err := db.Query(
		`SELECT station_id, target_usd FROM fuel_app_stationtarget WHERE year = ? AND month = ?`,
		year, month,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[dj.UUID]dj.Dec{}
	for rows.Next() {
		var id dj.UUID
		d := dj.Dec{Places: 2}
		if err := rows.Scan(&id, &d); err != nil {
			return nil, err
		}
		out[id] = d
	}
	return out, rows.Err()
}

func (db *DB) UpsertStationTarget(t models.StationTarget) error {
	_, err := db.Exec(`INSERT INTO fuel_app_stationtarget (station_id, year, month, target_usd)
		VALUES (?, ?, ?, ?)
		ON CONFLICT (station_id, year, month) DO UPDATE SET target_usd = excluded.target_usd`,
		t.StationID, t.Year, t.Month, t.TargetUSD)
	return err
}

// StationMonthLevy returns Sum(levy_amount_usd) per station for transactions
// on/after the given date (YYYY-MM-DD), used by the dashboard top-stations.
func (db *DB) StationMonthLevy(fromDate string) (map[dj.UUID]dj.Dec, error) {
	rows, err := db.Query(`SELECT station_id, COALESCE(SUM(levy_amount_usd), 0)
		FROM fuel_app_transaction WHERE substr(created_at, 1, 10) >= ?
		GROUP BY station_id`, fromDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[dj.UUID]dj.Dec{}
	for rows.Next() {
		var id dj.UUID
		d := dj.Dec{Places: 4}
		if err := rows.Scan(&id, &d); err != nil {
			return nil, err
		}
		out[id] = d
	}
	return out, rows.Err()
}

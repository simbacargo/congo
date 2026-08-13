package store

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

const userCols = `u.id, u.username, u.firstname, u.lastname, u.email, u.password, u.role,
	u.assigned_station_id, u.managed_company_id, u.is_active, u.is_staff, u.is_superuser,
	u.last_login, u.date_joined`

func scanUser(s interface{ Scan(...any) error }) (models.User, error) {
	var u models.User
	err := s.Scan(&u.ID, &u.Username, &u.Firstname, &u.Lastname, &u.Email, &u.Password, &u.Role,
		&u.AssignedStation, &u.ManagedCompany, &u.IsActive, &u.IsStaff, &u.IsSuperuser,
		&u.LastLogin, &u.DateJoined)
	return u, err
}

func (db *DB) UserByUsername(username string) (models.User, error) {
	row := db.QueryRow(`SELECT `+userCols+` FROM authentication_user u WHERE u.username = ?`, username)
	u, err := scanUser(row)
	if isNoRows(err) {
		return u, ErrNotFound
	}
	return u, err
}

func (db *DB) UserByID(id dj.UUID) (models.User, error) {
	row := db.QueryRow(`SELECT `+userCols+` FROM authentication_user u WHERE u.id = ?`, id)
	u, err := scanUser(row)
	if isNoRows(err) {
		return u, ErrNotFound
	}
	return u, err
}

// Users lists all users ordered like the web agents page (role, username),
// with joined station/company names.
func (db *DB) Users() ([]models.User, error) {
	rows, err := db.Query(`SELECT ` + userCols + `,
		COALESCE(s.name, ''), COALESCE(c.name, '')
		FROM authentication_user u
		LEFT JOIN fuel_app_fuelstation s ON s.id = u.assigned_station_id
		LEFT JOIN fuel_app_parentcompany c ON c.id = u.managed_company_id
		ORDER BY u.role, u.username`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Firstname, &u.Lastname, &u.Email, &u.Password, &u.Role,
			&u.AssignedStation, &u.ManagedCompany, &u.IsActive, &u.IsStaff, &u.IsSuperuser,
			&u.LastLogin, &u.DateJoined, &u.AssignedStationName, &u.ManagedCompanyName); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

// CreateUser inserts a user with the same column defaults Django's model
// declares (the ORM writes every column explicitly, so we must too).
func (db *DB) CreateUser(u models.User) error {
	_, err := db.Exec(`INSERT INTO authentication_user (
		id, username, firstname, lastname, email, password, role,
		assigned_station_id, managed_company_id, is_active, is_staff, is_admin, is_superuser,
		hide_email, last_seen, date_of_birth, country, district, city, language, mobile,
		date_joined, pincode, current_location, current_ip, last_known_device,
		facebook_account, gender, last_login
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, ?, '2000-01-01', NULL, NULL, NULL, NULL, '0', ?, '', '', '', '', '', '', NULL)`,
		u.ID, u.Username, u.Firstname, u.Lastname, u.Email, u.Password, u.Role,
		u.AssignedStation, u.ManagedCompany, u.IsActive, u.IsStaff, u.IsSuperuser,
		u.DateJoined, u.DateJoined,
	)
	return err
}

// UpdateUser updates the fields the agent form/admin API manage.
func (db *DB) UpdateUser(u models.User) error {
	_, err := db.Exec(`UPDATE authentication_user SET
		username = ?, firstname = ?, lastname = ?, email = ?, password = ?, role = ?,
		assigned_station_id = ?, managed_company_id = ?, is_active = ?
		WHERE id = ?`,
		u.Username, u.Firstname, u.Lastname, u.Email, u.Password, u.Role,
		u.AssignedStation, u.ManagedCompany, u.IsActive, u.ID,
	)
	return err
}

func (db *DB) UpdateLastLogin(id dj.UUID, t dj.DjangoTime) error {
	_, err := db.Exec(`UPDATE authentication_user SET last_login = ? WHERE id = ?`, t, id)
	return err
}

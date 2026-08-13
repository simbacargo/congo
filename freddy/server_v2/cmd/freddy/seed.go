package main

import (
	"flag"
	"fmt"
	"freddy/server_v2/internal/dj"
	"time"

	"freddy/server_v2/internal/auth"
	"freddy/server_v2/internal/config"
	"freddy/server_v2/internal/models"
	"freddy/server_v2/internal/store"
)

// runSeed ports manage.py seed_lci: idempotent demo data.
func runSeed(root string, args []string) error {
	cfg := config.Load(root)
	fs := flag.NewFlagSet("seed", flag.ExitOnError)
	fs.StringVar(&cfg.DBPath, "db", cfg.DBPath, "path to db.sqlite3")
	if err := fs.Parse(args); err != nil {
		return err
	}
	db, err := store.Open(cfg.DBPath)
	if err != nil {
		return err
	}
	defer db.Close()

	now := dj.NewTime(time.Now().UTC())

	// Fuel types (keyed on code).
	for _, ft := range []struct{ name, code string }{
		{"Diesel", "DSL"}, {"Petrol", "PTR"}, {"Kerosene", "KRS"},
		{"Gas Oil", "GSO"}, {"Heavy Fuel Oil", "HFO"},
	} {
		var n int
		if err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_fueltype WHERE code = ?`, ft.code).Scan(&n); err != nil {
			return err
		}
		if n == 0 {
			if err := db.CreateFuelType(models.FuelType{ID: dj.NewUUID(), Name: ft.name, Code: ft.code, IsActive: true}); err != nil {
				return err
			}
		}
	}
	fmt.Println("  ✓ Fuel types")

	// Companies (keyed on code).
	getOrCreateCompany := func(code, name, email string) (dj.UUID, error) {
		var id dj.UUID
		err := db.QueryRow(`SELECT id FROM fuel_app_parentcompany WHERE code = ?`, code).Scan(&id)
		if err == nil {
			return id, nil
		}
		c := models.ParentCompany{
			ID: dj.NewUUID(), Name: name, Code: code,
			ContactEmail: dj.NewNS(email), IsActive: true, CreatedAt: now,
		}
		return c.ID, db.CreateCompany(c)
	}
	total, err := getOrCreateCompany("TOTAL", "TotalEnergies Lubumbashi", "lubs@total.com")
	if err != nil {
		return err
	}
	engen, err := getOrCreateCompany("ENGEN", "Engen DRC", "drc@engen.co")
	if err != nil {
		return err
	}
	fmt.Println("  ✓ Companies")

	// Stations (keyed on code).
	getOrCreateStation := func(code, name string, company dj.UUID, address string) (dj.UUID, error) {
		var id dj.UUID
		err := db.QueryRow(`SELECT id FROM fuel_app_fuelstation WHERE code = ?`, code).Scan(&id)
		if err == nil {
			return id, nil
		}
		s := models.FuelStation{
			ID: dj.NewUUID(), Name: name, Code: code, CompanyID: company,
			Address: dj.NewNS(address), IsActive: true, CreatedAt: now,
		}
		s.Latitude.Places, s.Longitude.Places = 6, 6
		return s.ID, db.CreateStation(s)
	}
	st1, err := getOrCreateStation("TOTAL-LUB-01", "Total Lubumbashi Centre", total, "Avenue Lumumba, Lubumbashi")
	if err != nil {
		return err
	}
	st2, err := getOrCreateStation("ENGEN-LUB-01", "Engen Katuba", engen, "Route Kasumbalesa, Katuba")
	if err != nil {
		return err
	}
	fmt.Println("  ✓ Stations")

	// Churches (keyed on name, like the Django seed).
	createChurch := func(name string, station dj.UUID, person, phone string, beneficiaries int64) error {
		var n int
		if err := db.QueryRow(`SELECT COUNT(*) FROM fuel_app_church WHERE name = ?`, name).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			return nil
		}
		ch := models.Church{
			ID: dj.NewUUID(), Name: name, StationID: station,
			ContactPerson: dj.NewNS(person), BeneficiaryCount: beneficiaries,
			IsActive: true, CreatedAt: now,
		}
		if phone != "" {
			ch.ContactPhone = dj.NewNS(phone)
		}
		return db.CreateChurch(ch)
	}
	if err := createChurch("Église de la Grâce", st1, "Pasteur Mutombo", "+243812345678", 340); err != nil {
		return err
	}
	if err := createChurch("Communauté Pentecôte Lumbumbashi", st1, "Rev. Kabila", "", 210); err != nil {
		return err
	}
	if err := createChurch("Église Catholique Sainte-Anne", st2, "Père Ilunga", "+243892345678", 580); err != nil {
		return err
	}
	fmt.Println("  ✓ Churches")

	// Users.
	createUser := func(username, password, role string, station dj.UUID) error {
		if _, err := db.UserByUsername(username); err == nil {
			return nil
		}
		u := models.User{
			ID: dj.NewUUID(), Username: username,
			Password: auth.MakePassword(password), Role: role,
			AssignedStation: station, IsActive: true, IsStaff: true,
			DateJoined: now,
		}
		if err := db.CreateUser(u); err != nil {
			return err
		}
		fmt.Printf("  ✓ User: %s / %s\n", username, password)
		return nil
	}
	if err := createUser("ngo_admin", "admin1234!", models.RoleNGOAdmin, ""); err != nil {
		return err
	}
	if err := createUser("agent_total", "agent1234!", models.RoleStationAgent, st1); err != nil {
		return err
	}

	fmt.Println("\nLCI seed data loaded successfully.")
	return nil
}

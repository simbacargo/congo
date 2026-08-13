package handlers

import (
	"freddy/server_v2/internal/dj"
	"freddy/server_v2/internal/models"
)

// JSON shapes mirroring fuel_app/serializers.py. Field names and value
// formats must match DRF's output byte-for-byte (decimals as fixed-place
// strings, datetimes ISO-8601 with Z, UUIDs dashed, NULLs as null).

type companyJSON struct {
	ID           dj.UUID `json:"id"`
	Name         string  `json:"name"`
	Code         string  `json:"code"`
	ContactEmail dj.NS   `json:"contact_email"`
	ContactPhone dj.NS   `json:"contact_phone"`
	IsActive     bool    `json:"is_active"`
}

func companyOut(c models.ParentCompany) companyJSON {
	return companyJSON{
		ID: c.ID, Name: c.Name, Code: c.Code,
		ContactEmail: c.ContactEmail, ContactPhone: c.ContactPhone, IsActive: c.IsActive,
	}
}

type stationJSON struct {
	ID          dj.UUID `json:"id"`
	Name        string  `json:"name"`
	Code        string  `json:"code"`
	Company     dj.UUID `json:"company"`
	CompanyName string  `json:"company_name"`
	Address     dj.NS   `json:"address"`
	IsActive    bool    `json:"is_active"`
}

func stationOut(s models.FuelStation) stationJSON {
	return stationJSON{
		ID: s.ID, Name: s.Name, Code: s.Code, Company: s.CompanyID,
		CompanyName: s.CompanyName, Address: s.Address, IsActive: s.IsActive,
	}
}

type churchJSON struct {
	ID               dj.UUID `json:"id"`
	Name             string  `json:"name"`
	Station          dj.UUID `json:"station"`
	StationName      string  `json:"station_name"`
	CompanyName      string  `json:"company_name"`
	ContactPerson    dj.NS   `json:"contact_person"`
	ContactPhone     dj.NS   `json:"contact_phone"`
	BeneficiaryCount int64   `json:"beneficiary_count"`
	IsActive         bool    `json:"is_active"`
}

func churchOut(ch models.Church) churchJSON {
	return churchJSON{
		ID: ch.ID, Name: ch.Name, Station: ch.StationID, StationName: ch.StationName,
		CompanyName: ch.CompanyName, ContactPerson: ch.ContactPerson, ContactPhone: ch.ContactPhone,
		BeneficiaryCount: ch.BeneficiaryCount, IsActive: ch.IsActive,
	}
}

type fuelTypeJSON struct {
	ID       dj.UUID `json:"id"`
	Name     string  `json:"name"`
	Code     string  `json:"code"`
	IsActive bool    `json:"is_active"`
}

func fuelTypeOut(ft models.FuelType) fuelTypeJSON {
	return fuelTypeJSON{ID: ft.ID, Name: ft.Name, Code: ft.Code, IsActive: ft.IsActive}
}

type txJSON struct {
	ID            dj.UUID       `json:"id"`
	ReceiptCode   string        `json:"receipt_code"`
	Station       dj.UUID       `json:"station"`
	StationName   string        `json:"station_name"`
	CompanyName   string        `json:"company_name"`
	Church        dj.UUID       `json:"church"`
	ChurchName    string        `json:"church_name"`
	Agent         dj.UUID       `json:"agent"`
	AgentUsername string        `json:"agent_username"`
	FuelType      dj.UUID       `json:"fuel_type"`
	FuelTypeName  string        `json:"fuel_type_name"`
	CurrencyUsed  string        `json:"currency_used"`
	AmountUSD     dj.Dec        `json:"amount_usd"`
	AmountCDF     dj.Dec        `json:"amount_cdf"`
	ExchangeRate  dj.Dec        `json:"exchange_rate"`
	LevyAmountUSD dj.Dec        `json:"levy_amount_usd"`
	LevyAmountCDF dj.Dec        `json:"levy_amount_cdf"`
	Status        string        `json:"status"`
	Notes         dj.NS         `json:"notes"`
	DriverPhone   dj.NS         `json:"driver_phone"`
	SyncID        dj.NS         `json:"sync_id"`
	CreatedAt     dj.DjangoTime `json:"created_at"`
	UpdatedAt     dj.DjangoTime `json:"updated_at"`
}

func txOut(t models.Transaction) txJSON {
	return txJSON{
		ID: t.ID, ReceiptCode: t.ReceiptCode,
		Station: t.StationID, StationName: t.StationName, CompanyName: t.CompanyName,
		Church: t.ChurchID, ChurchName: t.ChurchName,
		Agent: t.AgentID, AgentUsername: t.AgentUsername,
		FuelType: t.FuelTypeID, FuelTypeName: t.FuelTypeName,
		CurrencyUsed: t.CurrencyUsed,
		AmountUSD:    t.AmountUSD.WithPlaces(2), AmountCDF: t.AmountCDF.WithPlaces(2),
		ExchangeRate:  t.ExchangeRate.WithPlaces(4),
		LevyAmountUSD: t.LevyAmountUSD.WithPlaces(4), LevyAmountCDF: t.LevyAmountCDF.WithPlaces(4),
		Status: t.Status, Notes: t.Notes, DriverPhone: t.DriverPhone, SyncID: t.SyncID,
		CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
	}
}

func txListOut(ts []models.Transaction) []txJSON {
	out := make([]txJSON, 0, len(ts))
	for _, t := range ts {
		out = append(out, txOut(t))
	}
	return out
}

type auditJSON struct {
	ID                int64         `json:"id"`
	FieldName         string        `json:"field_name"`
	OldValue          dj.NS         `json:"old_value"`
	NewValue          dj.NS         `json:"new_value"`
	ChangedBy         dj.UUID       `json:"changed_by"`
	ChangedByUsername dj.NS         `json:"changed_by_username"`
	ChangedAt         dj.DjangoTime `json:"changed_at"`
	IPAddress         dj.NS         `json:"ip_address"`
}

func auditOut(l models.TransactionAuditLog) auditJSON {
	return auditJSON{
		ID: l.ID, FieldName: l.FieldName, OldValue: l.OldValue, NewValue: l.NewValue,
		ChangedBy: l.ChangedByID, ChangedByUsername: l.ChangedByUsername,
		ChangedAt: l.ChangedAt, IPAddress: l.IPAddress,
	}
}

func auditListOut(ls []models.TransactionAuditLog) []auditJSON {
	out := make([]auditJSON, 0, len(ls))
	for _, l := range ls {
		out = append(out, auditOut(l))
	}
	return out
}

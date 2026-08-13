// Package models holds the domain structs mirroring the Django models in
// server/fuel_app/models.py and server/authentication/models.py. The Go
// server shares the Django-managed SQLite schema, so field sets and enum
// values must stay in lockstep with the Python side.
package models

import (
	"freddy/server_v2/internal/dj"
)

// Roles (authentication.models).
const (
	RoleNGOAdmin       = "NGO_ADMIN"
	RoleCompanyManager = "COMPANY_MANAGER"
	RoleStationAgent   = "STATION_AGENT"
)

// Transaction statuses.
const (
	TxPending  = "PENDING"
	TxVerified = "VERIFIED"
	TxRemitted = "REMITTED"
)

// TxStatusDisplay mirrors Transaction.Status labels (get_status_display).
var TxStatusDisplay = map[string]string{
	TxPending:  "Pending",
	TxVerified: "Verified",
	TxRemitted: "Remitted to NGO",
}

// Currencies.
const (
	CurrencyUSD = "USD"
	CurrencyCDF = "CDF"
)

// Disbursement statuses.
const (
	DisbScheduled = "SCHEDULED"
	DisbPaid      = "PAID"
	DisbCancelled = "CANCELLED"
)

var DisbStatusDisplay = map[string]string{
	DisbScheduled: "Scheduled",
	DisbPaid:      "Paid",
	DisbCancelled: "Cancelled",
}

type User struct {
	ID              dj.UUID
	Username        string
	Firstname       dj.NS
	Lastname        dj.NS
	Email           dj.NS
	Password        string
	Role            string
	AssignedStation dj.UUID // "" when NULL
	ManagedCompany  dj.UUID
	IsActive        bool
	IsStaff         bool
	IsSuperuser     bool
	LastLogin       dj.DjangoTime
	DateJoined      dj.DjangoTime

	// Denormalized joins (populated by list queries when needed).
	AssignedStationName string
	ManagedCompanyName  string
}

type ParentCompany struct {
	ID           dj.UUID
	Name         string
	Code         string
	Logo         dj.NS
	ContactEmail dj.NS
	ContactPhone dj.NS
	IsActive     bool
	CreatedAt    dj.DjangoTime
}

type FuelStation struct {
	ID        dj.UUID
	Name      string
	Code      string
	CompanyID dj.UUID
	Address   dj.NS
	Latitude  dj.Dec // 6 places, nullable
	Longitude dj.Dec
	IsActive  bool
	CreatedAt dj.DjangoTime

	CompanyName string
	CompanyCode string
}

type Church struct {
	ID               dj.UUID
	Name             string
	StationID        dj.UUID
	ContactPerson    dj.NS
	ContactPhone     dj.NS
	BeneficiaryCount int64
	IsActive         bool
	CreatedAt        dj.DjangoTime

	StationName string
	CompanyName string
}

type FuelType struct {
	ID       dj.UUID
	Name     string
	Code     string
	IsActive bool
}

type Transaction struct {
	ID            dj.UUID
	ReceiptCode   string
	StationID     dj.UUID
	ChurchID      dj.UUID
	AgentID       dj.UUID
	FuelTypeID    dj.UUID
	CurrencyUsed  string
	AmountUSD     dj.Dec // 2
	AmountCDF     dj.Dec // 2
	ExchangeRate  dj.Dec // 4
	LevyAmountUSD dj.Dec // 4
	LevyAmountCDF dj.Dec // 4
	Status        string
	Notes         dj.NS
	DriverPhone   dj.NS
	SyncID        dj.NS
	CreatedAt     dj.DjangoTime
	UpdatedAt     dj.DjangoTime

	// Denormalized joins.
	StationName   string
	CompanyName   string
	ChurchName    string
	AgentUsername string
	FuelTypeName  string
}

type TransactionAuditLog struct {
	ID            int64
	TransactionID dj.UUID
	ChangedByID   dj.UUID // "" when NULL
	FieldName     string
	OldValue      dj.NS
	NewValue      dj.NS
	ChangedAt     dj.DjangoTime
	IPAddress     dj.NS

	ChangedByUsername dj.NS
	ReceiptCode       string
	CompanyName       string
}

type ExchangeRateCache struct {
	ID        int64
	USDToCDF  dj.Dec // 4
	Source    string
	FetchedAt dj.DjangoTime
}

type Disbursement struct {
	ID            dj.UUID
	Reference     string
	ChurchID      dj.UUID
	PeriodStart   dj.DjangoDate
	PeriodEnd     dj.DjangoDate
	AmountUSD     dj.Dec // 2
	AmountCDF     dj.Dec // 2
	Status        string
	PaidAt        dj.DjangoTime
	PaymentMethod dj.NS
	Notes         dj.NS
	PreparedByID  dj.UUID
	CreatedAt     dj.DjangoTime
	UpdatedAt     dj.DjangoTime

	ChurchName         string
	StationName        string
	CompanyName        string
	PreparedByUsername dj.NS
}

type Driver struct {
	ID                      dj.UUID
	SubmittedAt             dj.DjangoTime
	Score                   int64
	FullName                dj.NS
	Gender                  dj.NS
	Phone                   dj.NS
	Email                   dj.NS
	MaritalStatus           dj.NS
	Commune                 dj.NS
	Quartier                dj.NS
	CityCountry             dj.NS
	VehicleType             dj.NS
	VehicleColor            dj.NS
	DailyFuelConsumption    dj.NS
	FuelType                dj.NS
	HasHealthCoverage       dj.NB
	HasCareAccessDifficulty dj.NB
	Dependents              dj.NS
	FieldAgent              dj.NS
	Consent                 bool
	RegistrationDate        dj.DjangoDate
	CreatedAt               dj.DjangoTime
}

type StationTarget struct {
	ID        int64
	StationID dj.UUID
	Year      int64
	Month     int64
	TargetUSD dj.Dec // 2
}

type AuthToken struct {
	Digest   string
	TokenKey string
	UserID   dj.UUID
	Created  dj.DjangoTime
	Expiry   dj.DjangoTime
}

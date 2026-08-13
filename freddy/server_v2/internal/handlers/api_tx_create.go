package handlers

import (
	"encoding/json"
	"freddy/server_v2/internal/dj"
	"time"

	"freddy/server_v2/internal/models"
	"freddy/server_v2/internal/services"
)

// txCreateInput mirrors TransactionCreateSerializer's writable fields.
type txCreateInput struct {
	Church       *string         `json:"church"`
	FuelType     *string         `json:"fuel_type"`
	CurrencyUsed *string         `json:"currency_used"`
	AmountUSD    json.RawMessage `json:"amount_usd"`
	AmountCDF    json.RawMessage `json:"amount_cdf"`
	Notes        *string         `json:"notes"`
	DriverPhone  *string         `json:"driver_phone"`
	SyncID       *string         `json:"sync_id"`
	CreatedAt    *string         `json:"created_at"`
}

// fieldErrors is a DRF-style validation error payload:
// {"field": ["msg", ...], "non_field_errors": ["msg"]}.
type fieldErrors map[string][]string

func (fe fieldErrors) add(field, msg string) { fe[field] = append(fe[field], msg) }

// validateTxCreate replicates TransactionCreateSerializer.validate*/create
// minus the DB write: it returns a ready-to-insert Transaction or the DRF
// error map.
func (app *App) validateTxCreate(agent models.User, in txCreateInput, now time.Time) (models.Transaction, fieldErrors) {
	errs := fieldErrors{}
	var tx models.Transaction

	// church (required PK)
	var church models.Church
	if in.Church == nil || *in.Church == "" {
		errs.add("church", "This field is required.")
	} else if id, err := dj.ParseUUID(*in.Church); err != nil {
		errs.add("church", "“"+*in.Church+"” is not a valid UUID.")
	} else if ch, err := app.DB.ChurchByID(id); err != nil {
		errs.add("church", "Invalid pk \""+*in.Church+"\" - object does not exist.")
	} else {
		church = ch
		tx.ChurchID = ch.ID
	}

	// fuel_type (required PK)
	if in.FuelType == nil || *in.FuelType == "" {
		errs.add("fuel_type", "This field is required.")
	} else if id, err := dj.ParseUUID(*in.FuelType); err != nil {
		errs.add("fuel_type", "“"+*in.FuelType+"” is not a valid UUID.")
	} else if ft, err := app.DB.FuelTypeByID(id); err != nil {
		errs.add("fuel_type", "Invalid pk \""+*in.FuelType+"\" - object does not exist.")
	} else {
		tx.FuelTypeID = ft.ID
	}

	// currency_used (choice, model default USD)
	tx.CurrencyUsed = models.CurrencyUSD
	if in.CurrencyUsed != nil && *in.CurrencyUsed != "" {
		switch *in.CurrencyUsed {
		case models.CurrencyUSD, models.CurrencyCDF:
			tx.CurrencyUsed = *in.CurrencyUsed
		default:
			errs.add("currency_used", "\""+*in.CurrencyUsed+"\" is not a valid choice.")
		}
	}

	// amounts (model default 0; DRF accepts number or string)
	tx.AmountUSD = dj.Dec{Places: 2, Valid: true}
	tx.AmountCDF = dj.Dec{Places: 2, Valid: true}
	if d, ok := parseDecField(in.AmountUSD, 2, "amount_usd", errs); ok {
		tx.AmountUSD = d
	}
	if d, ok := parseDecField(in.AmountCDF, 2, "amount_cdf", errs); ok {
		tx.AmountCDF = d
	}

	// created_at: client-supplied, default now; ±window check.
	created := now
	if in.CreatedAt != nil && *in.CreatedAt != "" {
		t, err := dj.ParseClientDateTime(*in.CreatedAt)
		if err != nil {
			errs.add("created_at", "Datetime has wrong format. Use one of these formats instead: YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z].")
		} else {
			created = t
		}
	}
	if _, bad := errs["created_at"]; !bad {
		if created.After(now.Add(5 * time.Minute)) {
			errs.add("created_at", "created_at cannot be in the future.")
		} else if created.Before(now.Add(-7 * 24 * time.Hour)) {
			errs.add("created_at", "created_at cannot be more than 7 days in the past.")
		}
	}

	// Serializer.validate(): station scoping.
	if len(errs) == 0 {
		if agent.AssignedStation == "" {
			errs.add("non_field_errors", "Your account has no assigned station.")
		} else if church.ID != "" && church.StationID != agent.AssignedStation {
			errs.add("non_field_errors", "Church does not belong to your assigned station.")
		}
	}
	if len(errs) > 0 {
		return tx, errs
	}

	tx.ID = dj.NewUUID()
	tx.ReceiptCode = services.GenerateReceiptCode()
	tx.StationID = agent.AssignedStation
	tx.AgentID = agent.ID
	tx.Status = models.TxPending
	tx.ExchangeRate = app.Rates.USDToCDF().WithPlaces(4)
	if in.Notes != nil {
		tx.Notes = dj.NewNS(*in.Notes)
	}
	phone := ""
	if in.DriverPhone != nil {
		phone = *in.DriverPhone
	}
	tx.DriverPhone = dj.NewNS(services.NormalizePhone(phone))
	if in.SyncID != nil && *in.SyncID != "" {
		tx.SyncID = dj.NewNS(*in.SyncID)
	}
	tx.CreatedAt = dj.NewTime(created)
	tx.UpdatedAt = dj.NewTime(now)
	tx.LevyAmountUSD = dj.Dec{Places: 4, Valid: true}
	tx.LevyAmountCDF = dj.Dec{Places: 4, Valid: true}
	services.ComputeLevy(&tx)
	return tx, nil
}

func parseDecField(raw json.RawMessage, places int32, field string, errs fieldErrors) (dj.Dec, bool) {
	if len(raw) == 0 || string(raw) == "null" {
		return dj.Dec{}, false
	}
	var d dj.Dec
	d.Places = places
	if err := d.UnmarshalJSON(raw); err != nil {
		errs.add(field, "A valid number is required.")
		return dj.Dec{}, false
	}
	if !d.Valid {
		return dj.Dec{}, false
	}
	// DRF DecimalField(max_digits=12/16, decimal_places=2) rejects >2dp.
	if d.D.Exponent() < -places {
		errs.add(field, "Ensure that there are no more than "+itoa32(places)+" decimal places.")
		return dj.Dec{}, false
	}
	d.D = d.D.RoundBank(places)
	return d, true
}

func itoa32(n int32) string {
	return map[int32]string{2: "2", 4: "4"}[n]
}

// insertTx writes the transaction plus mirrors Django behavior on conflict.
func (app *App) insertTx(tx models.Transaction) error {
	return app.DB.CreateTransaction(tx)
}

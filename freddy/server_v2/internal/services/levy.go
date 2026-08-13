package services

import (
	"freddy/server_v2/internal/dj"
	"github.com/shopspring/decimal"

	"freddy/server_v2/internal/models"
)

// FuelLevyRate mirrors fuel_app.models.FUEL_LEVY_RATE.
var FuelLevyRate = decimal.RequireFromString("0.02")

// ComputeLevy replicates Transaction.save(): fills the levy fields and the
// converted amount from the currency actually used. Quantization is
// half-even, matching Python Decimal.quantize defaults.
func ComputeLevy(tx *models.Transaction) {
	rate := tx.ExchangeRate.D
	switch {
	case tx.CurrencyUsed == models.CurrencyUSD && tx.AmountUSD.Valid && !tx.AmountUSD.D.IsZero():
		tx.LevyAmountUSD = dj.Dec4(tx.AmountUSD.D.Mul(FuelLevyRate))
		if !rate.IsZero() {
			tx.AmountCDF = dj.Dec2(tx.AmountUSD.D.Mul(rate))
			tx.LevyAmountCDF = dj.Dec4(tx.AmountCDF.D.Mul(FuelLevyRate))
		}
	case tx.CurrencyUsed == models.CurrencyCDF && tx.AmountCDF.Valid && !tx.AmountCDF.D.IsZero():
		tx.LevyAmountCDF = dj.Dec4(tx.AmountCDF.D.Mul(FuelLevyRate))
		if !rate.IsZero() {
			tx.AmountUSD = dj.Dec2(divHalfEven(tx.AmountCDF.D, rate, 2))
			tx.LevyAmountUSD = dj.Dec4(tx.AmountUSD.D.Mul(FuelLevyRate))
		}
	}
}

// divHalfEven divides with enough precision that the final half-even rounding
// to `places` matches Python's Decimal division (28 significant digits)
// followed by quantize.
func divHalfEven(a, b decimal.Decimal, places int32) decimal.Decimal {
	q := a.DivRound(b, places+10)
	return q.RoundBank(places)
}

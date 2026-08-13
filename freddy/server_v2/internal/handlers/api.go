package handlers

import (
	"encoding/json"
	"freddy/server_v2/internal/dj"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"freddy/server_v2/internal/auth"
	"freddy/server_v2/internal/models"
	"freddy/server_v2/internal/services"
	"freddy/server_v2/internal/store"
)

// registerAPI mounts the mobile JSON API — a drop-in replacement for the
// DRF endpoints in fuel_app/views.py and the knox auth URLs.
func registerAPI(e *echo.Echo, app *App) {
	e.POST("/api/auth/login/", app.apiLogin)

	g := e.Group("/api", app.tokenAuth)
	g.POST("/auth/logout/", app.apiLogout)
	g.POST("/auth/logoutall/", app.apiLogoutAll)
	g.GET("/auth/profile/", app.apiProfile)

	g.GET("/currency/", app.apiCurrency)
	g.GET("/fuel-types/", app.apiFuelTypes)
	g.GET("/stations/", app.apiStations)
	g.GET("/churches/", app.apiChurches)

	g.GET("/transactions/", app.apiTxList)
	g.POST("/transactions/create/", app.apiTxCreate, requireRole(models.RoleStationAgent))
	g.POST("/transactions/sync/", app.apiTxSync, requireRole(models.RoleStationAgent))
	g.PATCH("/transactions/:pk/status/", app.apiTxStatus, requireRole(models.RoleNGOAdmin))
	g.GET("/transactions/:pk/audit/", app.apiTxAudit)
	g.GET("/drivers/:pk/", app.apiDriverDetail)
	g.GET("/verify/:code/", app.apiVerify)
}

// ─── auth ────────────────────────────────────────────────────────────────────

type loginInput struct {
	Username string `json:"username" form:"username"`
	Password string `json:"password" form:"password"`
}

func (app *App) apiLogin(c echo.Context) error {
	var in loginInput
	if err := c.Bind(&in); err != nil {
		return detail(c, http.StatusBadRequest, "Malformed request.")
	}
	user, err := app.DB.UserByUsername(in.Username)
	// Django's ModelBackend rejects inactive users inside authenticate(), so
	// bad password and inactive account produce the same 401.
	if err != nil || !user.IsActive || !auth.CheckPassword(in.Password, user.Password) {
		return detail(c, http.StatusUnauthorized, "Invalid username or password.")
	}
	token, expiry, err := auth.CreateToken(app.DB, user.ID, time.Now().UTC())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]any{
		"token":  token,
		"expiry": dj.NewTime(expiry),
	})
}

func (app *App) apiLogout(c echo.Context) error {
	tok, _ := c.Get(ctxToken).(models.AuthToken)
	if err := app.DB.DeleteToken(tok.Digest); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (app *App) apiLogoutAll(c echo.Context) error {
	user, _ := currentUser(c)
	if err := app.DB.DeleteUserTokens(user.ID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (app *App) apiProfile(c echo.Context) error {
	user, _ := currentUser(c)
	var station, company any
	if user.AssignedStation != "" {
		station = user.AssignedStation.String()
	}
	if user.ManagedCompany != "" {
		company = user.ManagedCompany.String()
	}
	return c.JSON(http.StatusOK, map[string]any{
		"username":         user.Username,
		"email":            user.Email,
		"role":             user.Role,
		"assigned_station": station,
		"managed_company":  company,
	})
}

// ─── catalog ─────────────────────────────────────────────────────────────────

func (app *App) apiCurrency(c echo.Context) error {
	rate := app.Rates.USDToCDF()
	return c.JSON(http.StatusOK, map[string]string{"usd_to_cdf": rate.D.String()})
}

func (app *App) apiFuelTypes(c echo.Context) error {
	fts, err := app.DB.FuelTypes(true)
	if err != nil {
		return err
	}
	out := make([]fuelTypeJSON, 0, len(fts))
	for _, ft := range fts {
		out = append(out, fuelTypeOut(ft))
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) apiStations(c echo.Context) error {
	sts, err := app.DB.Stations(true, "")
	if err != nil {
		return err
	}
	out := make([]stationJSON, 0, len(sts))
	for _, s := range sts {
		out = append(out, stationOut(s))
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) apiChurches(c echo.Context) error {
	user, _ := currentUser(c)
	var stationID dj.UUID
	if q := c.QueryParam("station"); q != "" {
		id, err := dj.ParseUUID(q)
		if err != nil {
			// Django would 500 on a malformed UUID filter; an empty list is
			// kinder and keeps the mobile app resilient.
			return c.JSON(http.StatusOK, []churchJSON{})
		}
		stationID = id
	} else if user.Role == models.RoleStationAgent && user.AssignedStation != "" {
		stationID = user.AssignedStation
	}
	chs, err := app.DB.Churches(true, stationID)
	if err != nil {
		return err
	}
	out := make([]churchJSON, 0, len(chs))
	for _, ch := range chs {
		out = append(out, churchOut(ch))
	}
	return c.JSON(http.StatusOK, out)
}

// ─── transactions ────────────────────────────────────────────────────────────

// roleScope maps the user's role onto a TxFilter, mirroring the queryset
// scoping repeated across api views.
func roleScope(user models.User) store.TxFilter {
	var f store.TxFilter
	switch user.Role {
	case models.RoleStationAgent:
		if user.AssignedStation != "" {
			f.ScopeStation = user.AssignedStation
		} else {
			f.ScopeNone = true
		}
	case models.RoleCompanyManager:
		if user.ManagedCompany != "" {
			f.ScopeCompany = user.ManagedCompany
		} else {
			f.ScopeNone = true
		}
	}
	return f
}

func (app *App) apiTxList(c echo.Context) error {
	user, _ := currentUser(c)
	txs, err := app.DB.Transactions(roleScope(user), 200, 0)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, txListOut(txs))
}

func (app *App) apiTxCreate(c echo.Context) error {
	user, _ := currentUser(c)
	var in txCreateInput
	if err := json.NewDecoder(c.Request().Body).Decode(&in); err != nil {
		return detail(c, http.StatusBadRequest, "Malformed request.")
	}
	tx, errs := app.validateTxCreate(user, in, time.Now().UTC())
	if errs != nil {
		return c.JSON(http.StatusBadRequest, errs)
	}
	if err := app.insertTx(tx); err != nil {
		return err
	}
	full, err := app.DB.TransactionByID(tx.ID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, txOut(full))
}

func (app *App) apiTxSync(c echo.Context) error {
	user, _ := currentUser(c)
	var body struct {
		Transactions []txCreateInput `json:"transactions"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&body); err != nil {
		return detail(c, http.StatusBadRequest, "Malformed request.")
	}
	results := make([]map[string]any, 0, len(body.Transactions))
	for _, in := range body.Transactions {
		var syncID any
		if in.SyncID != nil {
			syncID = *in.SyncID
		}
		if in.SyncID != nil && *in.SyncID != "" {
			exists, err := app.DB.SyncIDExists(*in.SyncID)
			if err != nil {
				return err
			}
			if exists {
				results = append(results, map[string]any{"sync_id": syncID, "status": "duplicate"})
				continue
			}
		}
		tx, errs := app.validateTxCreate(user, in, time.Now().UTC())
		if errs != nil {
			results = append(results, map[string]any{"sync_id": syncID, "errors": errs, "status": "error"})
			continue
		}
		if err := app.insertTx(tx); err != nil {
			// A unique-constraint race on sync_id counts as a duplicate.
			if in.SyncID != nil && strings.Contains(strings.ToLower(err.Error()), "unique") {
				results = append(results, map[string]any{"sync_id": syncID, "status": "duplicate"})
				continue
			}
			return err
		}
		results = append(results, map[string]any{
			"sync_id":         syncID,
			"receipt_code":    tx.ReceiptCode,
			"levy_amount_usd": tx.LevyAmountUSD.D.String(),
			"status":          "created",
		})
	}
	return c.JSON(http.StatusOK, map[string]any{"results": results})
}

func (app *App) apiTxStatus(c echo.Context) error {
	user, _ := currentUser(c)
	id, err := dj.ParseUUID(c.Param("pk"))
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	tx, err := app.DB.TransactionByID(id)
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	var in struct {
		Status *string `json:"status"`
		Notes  *string `json:"notes"`
	}
	if err := json.NewDecoder(c.Request().Body).Decode(&in); err != nil {
		return detail(c, http.StatusBadRequest, "Malformed request.")
	}
	errs := fieldErrors{}
	newStatus := tx.Status
	if in.Status != nil {
		switch *in.Status {
		case models.TxPending, models.TxVerified, models.TxRemitted:
			newStatus = *in.Status
		default:
			errs.add("status", "\""+*in.Status+"\" is not a valid choice.")
		}
	}
	if len(errs) > 0 {
		return c.JSON(http.StatusBadRequest, errs)
	}
	now := dj.NewTime(time.Now().UTC())
	if in.Status != nil && *in.Status != tx.Status {
		app.recordAudit(tx.ID, user.ID, "status", tx.Status, newStatus, c)
	}
	newNotes := tx.Notes
	if in.Notes != nil {
		newNotes = dj.NewNS(*in.Notes)
	}
	if err := app.DB.UpdateTransactionStatusNotes(tx.ID, newStatus, newNotes, now); err != nil {
		return err
	}
	full, err := app.DB.TransactionByID(tx.ID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, txOut(full))
}

func (app *App) recordAudit(txID, userID dj.UUID, field, oldVal, newVal string, c echo.Context) {
	_ = app.DB.CreateAuditLog(models.TransactionAuditLog{
		TransactionID: txID,
		ChangedByID:   userID,
		FieldName:     field,
		OldValue:      dj.NewNS(oldVal),
		NewValue:      dj.NewNS(newVal),
		ChangedAt:     dj.NewTime(time.Now().UTC()),
		IPAddress:     dj.NewNS(clientIP(c)),
	})
}

func (app *App) apiTxAudit(c echo.Context) error {
	id, err := dj.ParseUUID(c.Param("pk"))
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	if _, err := app.DB.TransactionByID(id); err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	logs, err := app.DB.AuditLogsForTransaction(id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, auditListOut(logs))
}

func (app *App) apiVerify(c echo.Context) error {
	tx, err := app.DB.TransactionByReceipt(c.Param("code"))
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	return c.JSON(http.StatusOK, map[string]any{
		"receipt_code": tx.ReceiptCode,
		"station":      tx.StationName,
		"company":      tx.CompanyName,
		"church":       tx.ChurchName,
		"amount_usd":   tx.AmountUSD.WithPlaces(2).String(),
		"levy_usd":     tx.LevyAmountUSD.WithPlaces(4).String(),
		"status":       tx.Status,
		"created_at":   tx.CreatedAt,
		"valid":        true,
	})
}

func (app *App) apiDriverDetail(c echo.Context) error {
	user, _ := currentUser(c)
	id, err := dj.ParseUUID(c.Param("pk"))
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}
	driver, err := app.DB.DriverByID(id)
	if err != nil {
		return detail(c, http.StatusNotFound, "Not found.")
	}

	phone := services.NormalizePhone(driver.Phone.S)
	var txs []models.Transaction
	totals := store.TxTotals{Levy: dj.Dec{Places: 4, Valid: true}}
	if phone != "" {
		f := roleScope(user)
		f.DriverPhone = phone
		if txs, err = app.DB.Transactions(f, 100, 0); err != nil {
			return err
		}
		if totals, err = app.DB.TransactionTotals(f); err != nil {
			return err
		}
	}

	// Django renders Sum()->None as "0" via str(agg or 0).
	levyStr, amtStr := "0", "0"
	if totals.Count > 0 {
		levyStr = totals.Levy.WithPlaces(4).String()
		f := roleScope(user)
		f.DriverPhone = phone
		amt, err := app.DB.SumAmountUSD(f)
		if err != nil {
			return err
		}
		amtStr = amt.WithPlaces(2).String()
	}

	return c.JSON(http.StatusOK, map[string]any{
		"driver": map[string]any{
			"id":            driver.ID.String(),
			"full_name":     driver.FullName,
			"phone":         driver.Phone,
			"gender":        driver.Gender,
			"commune":       driver.Commune,
			"quartier":      driver.Quartier,
			"vehicle_type":  driver.VehicleType,
			"vehicle_color": driver.VehicleColor,
			"fuel_type":     driver.FuelType,
		},
		"transactions": txListOut(txs),
		"summary": map[string]any{
			"count":            totals.Count,
			"total_levy_usd":   levyStr,
			"total_amount_usd": amtStr,
		},
	})
}

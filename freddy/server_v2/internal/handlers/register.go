// Package handlers wires all HTTP surfaces (mobile API, admin API, web
// dashboard) onto an Echo instance.
package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"freddy/server_v2/internal/config"
	"freddy/server_v2/internal/services"
	"freddy/server_v2/internal/store"
)

// App bundles the shared dependencies handed to each handler group.
type App struct {
	DB    *store.DB
	Cfg   config.Config
	Rates *services.Rates
}

// Register mounts every route group.
func Register(e *echo.Echo, db *store.DB, cfg config.Config) error {
	app := &App{
		DB:    db,
		Cfg:   cfg,
		Rates: services.NewRates(db, cfg.RateAPIURL),
	}

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// Static assets and media, matching Django's /static/ and /media/.
	e.Static("/static", cfg.StaticDir)
	e.Static("/media", cfg.MediaDir)

	registerAPI(e, app)
	return nil
}

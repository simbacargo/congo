package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"freddy/server_v2/internal/config"
	"freddy/server_v2/internal/handlers"
	"freddy/server_v2/internal/store"
)

func runServe(root string, args []string) error {
	cfg := config.Load(root)
	fs := flag.NewFlagSet("serve", flag.ExitOnError)
	fs.StringVar(&cfg.Addr, "addr", cfg.Addr, "listen address")
	fs.StringVar(&cfg.DBPath, "db", cfg.DBPath, "path to db.sqlite3")
	if err := fs.Parse(args); err != nil {
		return err
	}

	db, err := store.Open(cfg.DBPath)
	if err != nil {
		return err
	}
	defer db.Close()

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Recover())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${time_rfc3339} ${method} ${uri} ${status} ${latency_human}\n",
	}))

	if err := handlers.Register(e, db, cfg); err != nil {
		return err
	}

	// Graceful shutdown on SIGINT/SIGTERM.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		if err := e.Start(cfg.Addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()
	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return e.Shutdown(shutdownCtx)
}

package config

import (
	"os"
	"path/filepath"
)

// Config carries runtime settings. Defaults assume the repo layout with the
// Django app (and its db.sqlite3) in ../server.
type Config struct {
	Addr         string // listen address, e.g. ":8001"
	DBPath       string // path to the shared db.sqlite3
	StaticDir    string // vendored static assets
	MediaDir     string // uploaded media (company logos)
	TemplatesDir string
	LocaleDir    string
	BaseDir      string // server_v2 root (for logo.jpg etc. on the Django side)
	ServerDir    string // Django server/ root (logo.jpg, oss.png used by ID cards)
	CookieSecret string // HMAC key for web sessions
	RateAPIURL   string // exchange-rate endpoint
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// Load builds a Config from environment variables with sensible defaults
// relative to the given server_v2 root directory.
func Load(root string) Config {
	serverDir := env("FREDDY_SERVER_DIR", filepath.Join(root, "..", "server"))
	return Config{
		Addr:         env("FREDDY_ADDR", ":8001"),
		DBPath:       env("FREDDY_DB", filepath.Join(serverDir, "db.sqlite3")),
		StaticDir:    env("FREDDY_STATIC", filepath.Join(root, "static")),
		MediaDir:     env("FREDDY_MEDIA", filepath.Join(serverDir, "media")),
		TemplatesDir: env("FREDDY_TEMPLATES", filepath.Join(root, "templates")),
		LocaleDir:    env("FREDDY_LOCALE", filepath.Join(root, "locale")),
		BaseDir:      root,
		ServerDir:    serverDir,
		CookieSecret: env("FREDDY_COOKIE_SECRET", "dev-insecure-cookie-secret-change-me"),
		RateAPIURL:   env("FREDDY_RATE_API", "https://open.er-api.com/v6/latest/USD"),
	}
}

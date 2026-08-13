package store

import (
	"database/sql"
	"fmt"
	"net/url"

	_ "modernc.org/sqlite"
)

// DB wraps the shared SQLite handle. The schema is owned and migrated by the
// Django app in server/ — this side never issues DDL and never changes the
// journal mode.
type DB struct {
	*sql.DB
}

func Open(path string) (*DB, error) {
	dsn := fmt.Sprintf(
		"file:%s?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)",
		url.PathEscape(path),
	)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// SQLite allows one writer; a single connection avoids SQLITE_BUSY churn
	// between our own goroutines while busy_timeout covers cross-process locks.
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	return &DB{db}, nil
}

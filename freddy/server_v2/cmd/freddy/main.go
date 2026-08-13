// Command freddy is the Go rewrite (v2) of the Freddy fuel-levy backend.
//
// Subcommands:
//
//	freddy serve            run the HTTP server (mobile API, admin API, web dashboard)
//	freddy seed             idempotent demo data (port of `manage.py seed_lci`)
//	freddy import-drivers   import the Google Forms driver export (port of `manage.py import_drivers`)
package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}
	root := moduleRoot()
	var err error
	switch os.Args[1] {
	case "serve":
		err = runServe(root, os.Args[2:])
	case "seed":
		err = runSeed(root, os.Args[2:])
	case "import-drivers":
		err = runImportDrivers(root, os.Args[2:])
	default:
		usage()
		os.Exit(2)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: freddy <serve|seed|import-drivers> [flags]")
}

// moduleRoot locates the server_v2 directory: next to the executable when
// deployed, or the module dir during `go run`.
func moduleRoot() string {
	if env := os.Getenv("FREDDY_ROOT"); env != "" {
		return env
	}
	// Walk up from the working directory looking for our go.mod.
	dir, err := os.Getwd()
	if err == nil {
		for d := dir; ; d = filepath.Dir(d) {
			if b, err := os.ReadFile(filepath.Join(d, "go.mod")); err == nil {
				if string(b[:min(len(b), 100)]) != "" && filepath.Base(d) == "server_v2" {
					return d
				}
			}
			if filepath.Dir(d) == d {
				break
			}
		}
	}
	// Fall back to the executable's directory.
	if exe, err := os.Executable(); err == nil {
		return filepath.Dir(exe)
	}
	return "."
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

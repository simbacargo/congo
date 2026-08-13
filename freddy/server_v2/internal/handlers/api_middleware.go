package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"freddy/server_v2/internal/auth"
	"freddy/server_v2/internal/models"
)

// Context keys for the authenticated API user/token.
const (
	ctxUser  = "api_user"
	ctxToken = "api_token"
)

func currentUser(c echo.Context) (models.User, bool) {
	u, ok := c.Get(ctxUser).(models.User)
	return u, ok
}

// detail writes a DRF-style {"detail": ...} error body.
func detail(c echo.Context, code int, msg string) error {
	return c.JSON(code, map[string]string{"detail": msg})
}

func unauthenticated(c echo.Context, msg string) error {
	c.Response().Header().Set("WWW-Authenticate", "Token")
	return detail(c, http.StatusUnauthorized, msg)
}

// tokenAuth replicates knox.auth.TokenAuthentication + DRF's IsAuthenticated:
// every /api/ route (except login/public verify) runs behind it.
func (app *App) tokenAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		header := strings.TrimSpace(c.Request().Header.Get("Authorization"))
		if header == "" {
			return unauthenticated(c, "Authentication credentials were not provided.")
		}
		parts := strings.Fields(header)
		if !strings.EqualFold(parts[0], "Token") {
			// Another scheme: DRF falls through to "no credentials".
			return unauthenticated(c, "Authentication credentials were not provided.")
		}
		if len(parts) == 1 {
			return unauthenticated(c, "Invalid token header. No credentials provided.")
		}
		if len(parts) > 2 {
			return unauthenticated(c, "Invalid token header. Token string should not contain spaces.")
		}
		user, tok, err := auth.VerifyToken(app.DB, parts[1], time.Now().UTC())
		if err != nil {
			if err.Error() == "User inactive or deleted." {
				return unauthenticated(c, "User inactive or deleted.")
			}
			return unauthenticated(c, "Invalid token.")
		}
		c.Set(ctxUser, user)
		c.Set(ctxToken, tok)
		return next(c)
	}
}

// requireRole mirrors the DRF permission classes (fuel_app/permissions.py):
// exact role match, NO superuser bypass.
func requireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, ok := currentUser(c)
			if !ok {
				return unauthenticated(c, "Authentication credentials were not provided.")
			}
			for _, r := range roles {
				if user.Role == r {
					return next(c)
				}
			}
			return detail(c, http.StatusForbidden, "You do not have permission to perform this action.")
		}
	}
}

// clientIP mirrors record_audit_log's X-Forwarded-For handling.
func clientIP(c echo.Context) string {
	if xf := c.Request().Header.Get("X-Forwarded-For"); xf != "" {
		return strings.TrimSpace(strings.SplitN(xf, ",", 2)[0])
	}
	host := c.Request().RemoteAddr
	if i := strings.LastIndex(host, ":"); i > 0 {
		return host[:i]
	}
	return host
}

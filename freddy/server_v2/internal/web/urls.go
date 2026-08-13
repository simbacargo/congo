package web

import (
	"fmt"
	"strings"
)

// urlPatterns maps Django URL names (as used in {% url %}) to path templates.
// %s slots are filled with positional args, mirroring fuel_app/urls.py and
// the project-level urls.py.
var urlPatterns = map[string]string{
	"fuel:dashboard":            "/",
	"fuel:dashboard-stats":      "/dashboard/stats/",
	"fuel:dashboard-chart-data": "/dashboard/chart-data/",

	"fuel:transactions": "/transactions/",
	"fuel:tx-detail":    "/transactions/%s/",
	"fuel:tx-status":    "/transactions/%s/status/",
	"fuel:tx-bulk":      "/transactions/bulk/",

	"fuel:companies":      "/companies/",
	"fuel:company-create": "/companies/new/",
	"fuel:company-detail": "/companies/%s/",
	"fuel:company-edit":   "/companies/%s/edit/",

	"fuel:stations":       "/stations/",
	"fuel:station-create": "/stations/new/",
	"fuel:station-detail": "/stations/%s/",
	"fuel:station-edit":   "/stations/%s/edit/",

	"fuel:churches":      "/churches/",
	"fuel:church-create": "/churches/new/",
	"fuel:church-detail": "/churches/%s/",
	"fuel:church-edit":   "/churches/%s/edit/",

	"fuel:drivers":              "/drivers/",
	"fuel:drivers-export-excel": "/drivers/export/excel/",
	"fuel:driver-detail":        "/drivers/%s/",
	"fuel:driver-id-card":       "/drivers/%s/id-card/",

	"fuel:agents":       "/agents/",
	"fuel:agent-create": "/agents/new/",
	"fuel:agent-edit":   "/agents/%s/edit/",

	"fuel:disbursements":       "/disbursements/",
	"fuel:disbursement-create": "/disbursements/new/",
	"fuel:disbursement-edit":   "/disbursements/%s/edit/",
	"fuel:disbursement-pay":    "/disbursements/%s/pay/",

	"fuel:reports": "/reports/",
	"fuel:audit":   "/audit/",

	"fuel:fuel-types":       "/settings/fuel-types/",
	"fuel:fuel-type-create": "/settings/fuel-types/new/",
	"fuel:fuel-type-edit":   "/settings/fuel-types/%s/edit/",

	"fuel:verify":       "/verify/",
	"fuel:export-excel": "/export/excel/",
	"fuel:export-pdf":   "/export/pdf/",

	"login":        "/login/",
	"logout":       "/logout/",
	"set_language": "/i18n/set_language/",
}

// Reverse resolves a Django URL name plus positional args to a path.
func Reverse(name string, args ...string) (string, error) {
	pattern, ok := urlPatterns[name]
	if !ok {
		return "", fmt.Errorf("unknown url name %q", name)
	}
	if strings.Count(pattern, "%s") != len(args) {
		return "", fmt.Errorf("url %q takes %d args, got %d", name, strings.Count(pattern, "%s"), len(args))
	}
	anyArgs := make([]any, len(args))
	for i, a := range args {
		anyArgs[i] = a
	}
	return fmt.Sprintf(pattern, anyArgs...), nil
}

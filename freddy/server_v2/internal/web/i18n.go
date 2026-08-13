// Package web implements the server-rendered dashboard: pongo2 rendering of
// the Django templates, gettext-style i18n, signed-cookie sessions, and the
// web view handlers.
package web

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// DefaultLanguage mirrors LANGUAGE_CODE in Django's settings.
const DefaultLanguage = "fr"

// LanguageCookie matches Django's LANGUAGE_COOKIE_NAME so a language chosen
// on one server carries over to the other.
const LanguageCookie = "django_language"

// Languages mirrors settings.LANGUAGES (code → English name; names are
// themselves translated through the catalog when rendered).
var Languages = [][2]string{
	{"en", "English"},
	{"fr", "French"},
	{"sw", "Swahili"},
}

// Catalog holds msgid→msgstr maps per language.
type Catalog struct {
	byLang map[string]map[string]string
}

// LoadCatalog reads locale/<lang>/LC_MESSAGES/django.po for every configured
// language. A missing or unparsable file just leaves that language empty
// (untranslated msgids pass through).
func LoadCatalog(localeDir string) *Catalog {
	c := &Catalog{byLang: map[string]map[string]string{}}
	for _, l := range Languages {
		lang := l[0]
		m, err := parsePO(filepath.Join(localeDir, lang, "LC_MESSAGES", "django.po"))
		if err != nil {
			m = map[string]string{}
		}
		c.byLang[lang] = m
	}
	return c
}

// Translate returns the msgstr for msgid in lang, or msgid itself when there
// is no (non-empty) translation.
func (c *Catalog) Translate(lang, msgid string) string {
	if m, ok := c.byLang[lang]; ok {
		if s, ok := m[msgid]; ok && s != "" {
			return s
		}
	}
	return msgid
}

// NormalizeLang maps a request value onto a supported language code.
func NormalizeLang(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	for _, l := range Languages {
		if v == l[0] {
			return v
		}
	}
	return DefaultLanguage
}

// parsePO reads a gettext .po file supporting multiline strings; plural
// forms and contexts are not used in this project and are skipped.
func parsePO(path string) (map[string]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	msgs := map[string]string{}
	var msgid, msgstr strings.Builder
	state := 0 // 0=idle, 1=in msgid, 2=in msgstr
	flush := func() {
		if state == 2 && msgid.Len() > 0 {
			msgs[msgid.String()] = msgstr.String()
		}
		msgid.Reset()
		msgstr.Reset()
	}
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		switch {
		case strings.HasPrefix(line, "msgid "):
			flush()
			state = 1
			msgid.WriteString(poString(line[len("msgid "):]))
		case strings.HasPrefix(line, "msgstr "):
			state = 2
			msgstr.WriteString(poString(line[len("msgstr "):]))
		case strings.HasPrefix(line, `"`):
			s := poString(line)
			if state == 1 {
				msgid.WriteString(s)
			} else if state == 2 {
				msgstr.WriteString(s)
			}
		case line == "" || strings.HasPrefix(line, "#"):
			// separators/comments end an entry at the next msgid
		default:
			state = 0
		}
	}
	flush()
	return msgs, sc.Err()
}

// poString unquotes one `"..."` segment of a .po line.
func poString(s string) string {
	s = strings.TrimSpace(s)
	if len(s) < 2 || s[0] != '"' || s[len(s)-1] != '"' {
		return ""
	}
	s = s[1 : len(s)-1]
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		if s[i] == '\\' && i+1 < len(s) {
			i++
			switch s[i] {
			case 'n':
				b.WriteByte('\n')
			case 't':
				b.WriteByte('\t')
			case '"':
				b.WriteByte('"')
			case '\\':
				b.WriteByte('\\')
			default:
				b.WriteByte(s[i])
			}
			continue
		}
		b.WriteByte(s[i])
	}
	return b.String()
}

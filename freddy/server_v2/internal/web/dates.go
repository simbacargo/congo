package web

import (
	"fmt"
	"strings"
	"time"
)

// LocalizedTime pairs a timestamp with the request language so the |date
// filter can localize month/day names the way Django's does.
type LocalizedTime struct {
	T    time.Time
	Lang string
}

// String renders Django's default DATETIME_FORMAT ("N j, Y, P") equivalent,
// for the rare {{ value }} without an explicit |date filter.
func (lt LocalizedTime) String() string {
	if lt.T.IsZero() {
		return ""
	}
	return FormatDjangoDate(lt.T, "N j, Y, H:i", lt.Lang)
}

var monthNames = map[string][12]string{
	"en": {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"},
	"fr": {"janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"},
	"sw": {"Januari", "Februari", "Machi", "Aprili", "Mei", "Juni", "Julai", "Agosti", "Septemba", "Oktoba", "Novemba", "Desemba"},
}

// Django "M" — three-letter-ish abbreviations, per Django's locale data.
var monthAbbr = map[string][12]string{
	"en": {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"},
	"fr": {"jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"},
	"sw": {"Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"},
}

// Django "N" — AP-style abbreviations (English) / same as M elsewhere.
var monthAP = map[string][12]string{
	"en": {"Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."},
}

var dayNames = map[string][7]string{
	"en": {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"},
	"fr": {"dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"},
	"sw": {"Jumapili", "Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi"},
}

var dayAbbr = map[string][7]string{
	"en": {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"},
	"fr": {"dim", "lun", "mar", "mer", "jeu", "ven", "sam"},
	"sw": {"Jpi", "Jtt", "Jnn", "Jtn", "Alh", "Iju", "Jms"},
}

func langTable[T any](m map[string]T, lang string) T {
	if v, ok := m[lang]; ok {
		return v
	}
	return m["en"]
}

// FormatDjangoDate renders t using Django's date-format characters
// (docs: django.utils.dateformat). Unknown characters pass through;
// backslash escapes the next character.
func FormatDjangoDate(t time.Time, format, lang string) string {
	months := langTable(monthNames, lang)
	abbrs := langTable(monthAbbr, lang)
	days := langTable(dayNames, lang)
	dabbrs := langTable(dayAbbr, lang)
	ap := monthAP["en"]

	var b strings.Builder
	for i := 0; i < len(format); i++ {
		c := format[i]
		if c == '\\' && i+1 < len(format) {
			i++
			b.WriteByte(format[i])
			continue
		}
		switch c {
		case 'd':
			fmt.Fprintf(&b, "%02d", t.Day())
		case 'j':
			fmt.Fprintf(&b, "%d", t.Day())
		case 'D':
			b.WriteString(dabbrs[int(t.Weekday())])
		case 'l':
			b.WriteString(days[int(t.Weekday())])
		case 'w':
			fmt.Fprintf(&b, "%d", int(t.Weekday()))
		case 'm':
			fmt.Fprintf(&b, "%02d", int(t.Month()))
		case 'n':
			fmt.Fprintf(&b, "%d", int(t.Month()))
		case 'M':
			b.WriteString(abbrs[int(t.Month())-1])
		case 'b':
			b.WriteString(strings.ToLower(abbrs[int(t.Month())-1]))
		case 'N':
			if lang == "en" {
				b.WriteString(ap[int(t.Month())-1])
			} else {
				b.WriteString(abbrs[int(t.Month())-1])
			}
		case 'F':
			b.WriteString(months[int(t.Month())-1])
		case 'y':
			fmt.Fprintf(&b, "%02d", t.Year()%100)
		case 'Y':
			fmt.Fprintf(&b, "%04d", t.Year())
		case 'H':
			fmt.Fprintf(&b, "%02d", t.Hour())
		case 'G':
			fmt.Fprintf(&b, "%d", t.Hour())
		case 'i':
			fmt.Fprintf(&b, "%02d", t.Minute())
		case 's':
			fmt.Fprintf(&b, "%02d", t.Second())
		case 'g':
			h := t.Hour() % 12
			if h == 0 {
				h = 12
			}
			fmt.Fprintf(&b, "%d", h)
		case 'h':
			h := t.Hour() % 12
			if h == 0 {
				h = 12
			}
			fmt.Fprintf(&b, "%02d", h)
		case 'A':
			if t.Hour() < 12 {
				b.WriteString("AM")
			} else {
				b.WriteString("PM")
			}
		case 'a':
			if t.Hour() < 12 {
				b.WriteString("a.m.")
			} else {
				b.WriteString("p.m.")
			}
		case 'U':
			fmt.Fprintf(&b, "%d", t.Unix())
		case 'c':
			b.WriteString(t.Format("2006-01-02T15:04:05"))
		default:
			b.WriteByte(c)
		}
	}
	return b.String()
}

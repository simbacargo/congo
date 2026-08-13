package web

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/flosch/pongo2/v6"
)

// Renderer renders the Django templates copied into server_v2/templates.
// pongo2 tag/filter registration is package-global, so tags reach the
// catalog through the package-level activeCatalog (set once at startup).
type Renderer struct {
	Set     *pongo2.TemplateSet
	Catalog *Catalog
}

var (
	registerOnce  sync.Once
	activeCatalog *Catalog
)

func NewRenderer(templatesDir string, catalog *Catalog) (*Renderer, error) {
	activeCatalog = catalog
	registerOnce.Do(registerDjangoCompat)

	loader, err := pongo2.NewLocalFileSystemLoader(templatesDir)
	if err != nil {
		return nil, err
	}
	set := pongo2.NewSet("freddy", loader)
	return &Renderer{Set: set, Catalog: catalog}, nil
}

// Render executes a template with the given context into a string.
func (r *Renderer) Render(name string, ctx pongo2.Context) (string, error) {
	tpl, err := r.Set.FromCache(name)
	if err != nil {
		return "", err
	}
	return tpl.Execute(ctx)
}

// ctxLang pulls the active language out of a render context.
func ctxLang(ctx *pongo2.ExecutionContext) string {
	if v, ok := ctx.Public["LANGUAGE_CODE"].(string); ok && v != "" {
		return v
	}
	return DefaultLanguage
}

func translate(ctx *pongo2.ExecutionContext, msgid string) string {
	if activeCatalog == nil {
		return msgid
	}
	return activeCatalog.Translate(ctxLang(ctx), msgid)
}

func registerDjangoCompat() {
	pongo2.SetAutoescape(true)

	pongo2.RegisterTag("load", tagLoadParser)
	pongo2.RegisterTag("trans", tagTransParser)
	pongo2.RegisterTag("btrans", tagBtransParser)
	pongo2.RegisterTag("static", tagStaticParser)
	pongo2.RegisterTag("url", tagURLParser)
	pongo2.RegisterTag("csrf_token", tagCSRFParser)
	pongo2.RegisterTag("get_current_language", tagGetCurrentLanguageParser)
	pongo2.RegisterTag("get_available_languages", tagGetAvailableLanguagesParser)

	pongo2.RegisterFilter("json_script", filterJSONScript)
	pongo2.ReplaceFilter("date", filterDjangoDate)
}

// ─── {% load ... %} — no-op ──────────────────────────────────────────────────

type nopNode struct{}

func (nopNode) Execute(*pongo2.ExecutionContext, pongo2.TemplateWriter) *pongo2.Error { return nil }

func tagLoadParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	for args.Remaining() > 0 {
		args.Consume()
	}
	return nopNode{}, nil
}

// ─── {% trans "..." %} ───────────────────────────────────────────────────────

type transNode struct{ msgid pongo2.IEvaluator }

func (n transNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	v, err := n.msgid.Evaluate(ctx)
	if err != nil {
		return err
	}
	w.WriteString(escapeHTML(translate(ctx, v.String())))
	return nil
}

func tagTransParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	expr, err := args.ParseExpression()
	if err != nil {
		return nil, err
	}
	if args.Remaining() > 0 {
		return nil, args.Error("trans: unexpected arguments", nil)
	}
	return transNode{msgid: expr}, nil
}

// ─── {% btrans "… %(var)s …" var=expr … %} ───────────────────────────────────
// Replacement for Django's {% blocktrans with var=expr %}…{% endblocktrans %};
// the copied templates were rewritten to this form. The msgid must match the
// .po entry exactly, with %(name)s placeholders.

type btransNode struct {
	msgid pongo2.IEvaluator
	args  map[string]pongo2.IEvaluator
}

func (n btransNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	v, err := n.msgid.Evaluate(ctx)
	if err != nil {
		return err
	}
	out := translate(ctx, v.String())
	for name, expr := range n.args {
		val, err := expr.Evaluate(ctx)
		if err != nil {
			return err
		}
		out = strings.ReplaceAll(out, "%("+name+")s", val.String())
	}
	w.WriteString(escapeHTML(out))
	return nil
}

func tagBtransParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	expr, err := args.ParseExpression()
	if err != nil {
		return nil, err
	}
	node := btransNode{msgid: expr, args: map[string]pongo2.IEvaluator{}}
	for args.Remaining() > 0 {
		name := args.MatchType(pongo2.TokenIdentifier)
		if name == nil {
			return nil, args.Error("btrans: expected identifier", nil)
		}
		if args.Match(pongo2.TokenSymbol, "=") == nil {
			return nil, args.Error("btrans: expected '='", nil)
		}
		valExpr, err := args.ParseExpression()
		if err != nil {
			return nil, err
		}
		node.args[name.Val] = valExpr
	}
	return node, nil
}

// ─── {% static "path" %} ─────────────────────────────────────────────────────

type staticNode struct{ path pongo2.IEvaluator }

func (n staticNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	v, err := n.path.Evaluate(ctx)
	if err != nil {
		return err
	}
	w.WriteString("/static/" + strings.TrimPrefix(v.String(), "/"))
	return nil
}

func tagStaticParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	expr, err := args.ParseExpression()
	if err != nil {
		return nil, err
	}
	return staticNode{path: expr}, nil
}

// ─── {% url 'name' [args…] [as var] %} ───────────────────────────────────────

type urlNode struct {
	name  pongo2.IEvaluator
	args  []pongo2.IEvaluator
	asVar string
}

func (n urlNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	nameVal, err := n.name.Evaluate(ctx)
	if err != nil {
		return err
	}
	strArgs := make([]string, len(n.args))
	for i, a := range n.args {
		v, err := a.Evaluate(ctx)
		if err != nil {
			return err
		}
		strArgs[i] = v.String()
	}
	u, rerr := Reverse(nameVal.String(), strArgs...)
	if rerr != nil {
		return ctx.Error(rerr.Error(), nil)
	}
	if n.asVar != "" {
		ctx.Private[n.asVar] = u
		return nil
	}
	w.WriteString(escapeHTML(u))
	return nil
}

func tagURLParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	nameExpr, err := args.ParseExpression()
	if err != nil {
		return nil, err
	}
	node := &urlNode{name: nameExpr}
	for args.Remaining() > 0 {
		if args.Match(pongo2.TokenKeyword, "as") != nil || args.Match(pongo2.TokenIdentifier, "as") != nil {
			target := args.MatchType(pongo2.TokenIdentifier)
			if target == nil {
				return nil, args.Error("url: expected variable name after 'as'", nil)
			}
			node.asVar = target.Val
			break
		}
		expr, err := args.ParseExpression()
		if err != nil {
			return nil, err
		}
		node.args = append(node.args, expr)
	}
	if args.Remaining() > 0 {
		return nil, args.Error("url: unexpected trailing arguments", nil)
	}
	return node, nil
}

// ─── {% csrf_token %} ────────────────────────────────────────────────────────

type csrfNode struct{}

func (csrfNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	tok, _ := ctx.Public["csrf_token"].(string)
	w.WriteString(`<input type="hidden" name="csrfmiddlewaretoken" value="` + escapeHTML(tok) + `">`)
	return nil
}

func tagCSRFParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	return csrfNode{}, nil
}

// ─── {% get_current_language as X %} / {% get_available_languages as X %} ────

type currentLangNode struct{ asVar string }

func (n currentLangNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	ctx.Private[n.asVar] = ctxLang(ctx)
	return nil
}

type availableLangsNode struct{ asVar string }

func (n availableLangsNode) Execute(ctx *pongo2.ExecutionContext, w pongo2.TemplateWriter) *pongo2.Error {
	langs := map[string]string{}
	for _, l := range Languages {
		langs[l[0]] = translate(ctx, l[1])
	}
	// Iterated with {% for code, name in X sorted %} — en/fr/sw sort correctly.
	ctx.Private[n.asVar] = langs
	return nil
}

func parseAsVar(args *pongo2.Parser) (string, *pongo2.Error) {
	if args.Match(pongo2.TokenKeyword, "as") == nil && args.Match(pongo2.TokenIdentifier, "as") == nil {
		return "", args.Error("expected 'as'", nil)
	}
	target := args.MatchType(pongo2.TokenIdentifier)
	if target == nil {
		return "", args.Error("expected variable name after 'as'", nil)
	}
	return target.Val, nil
}

func tagGetCurrentLanguageParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	v, err := parseAsVar(args)
	if err != nil {
		return nil, err
	}
	return currentLangNode{asVar: v}, nil
}

func tagGetAvailableLanguagesParser(doc *pongo2.Parser, start *pongo2.Token, args *pongo2.Parser) (pongo2.INodeTag, *pongo2.Error) {
	v, err := parseAsVar(args)
	if err != nil {
		return nil, err
	}
	return availableLangsNode{asVar: v}, nil
}

// ─── filters ─────────────────────────────────────────────────────────────────

// filterJSONScript mirrors Django's json_script: JSON-encode the value into a
// <script type="application/json"> block. encoding/json already escapes
// <, >, & to < &co., matching Django's HTML-safe JSON.
func filterJSONScript(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	raw, err := json.Marshal(in.Interface())
	if err != nil {
		return nil, &pongo2.Error{Sender: "filter:json_script", OrigError: err}
	}
	return pongo2.AsSafeValue(fmt.Sprintf(
		`<script id="%s" type="application/json">%s</script>`, escapeHTML(param.String()), string(raw))), nil
}

// filterDjangoDate replaces pongo2's Go-layout date filter with one that
// accepts Django format strings ("M d, Y H:i" …) and localized month names.
func filterDjangoDate(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	var t time.Time
	lang := DefaultLanguage
	switch v := in.Interface().(type) {
	case time.Time:
		t = v
	case LocalizedTime:
		t, lang = v.T, v.Lang
	case *LocalizedTime:
		if v != nil {
			t, lang = v.T, v.Lang
		}
	case nil:
		return pongo2.AsValue(""), nil
	default:
		return pongo2.AsValue(""), nil
	}
	if t.IsZero() {
		return pongo2.AsValue(""), nil
	}
	return pongo2.AsValue(FormatDjangoDate(t, param.String(), lang)), nil
}

func escapeHTML(s string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&#39;",
	)
	return r.Replace(s)
}

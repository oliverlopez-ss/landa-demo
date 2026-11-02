// Builds standalone preview pages for the Solpass calculator modules.
// For each module: reads the fields.json defaults, replaces the HubL in module.html with them and inlines module.css and module.js.
// Writes preview/<name>.html (defaults: no portal id, so preview mode) and preview/<name>-live.html (fake portal, form and
// subscription type, used by the tests to check the Forms API request).
// Usage: node build-preview.js
const fs = require("fs"), path = require("path");
const MODULES = path.join(__dirname, "..", "modules");
const NAMES = ["bostadskostnad", "hyra-eller-kopa", "beckham", "ekonomi"];
const LIVE = { portal_id: "12345678", form_guid: "0a1b2c3d-1111-2222-3333-444455556666", newsletter_subscription_type_id: "987654" };

const escAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(tpl, values, instanceName){
  const get = (key, sub) => { let v = values[key]; if(v && typeof v === "object") v = sub ? v[sub] : v.color; return v == null ? "" : v; };
  // {% if module.x %}…{% endif %} (not nested)
  let out = tpl.replace(/\{%\s*if\s+module\.(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (_, key, body) => get(key) !== "" && get(key) !== 0 ? body : "");
  // {{ module.x }}, {{ module.x.color }}, optional |filter
  out = out.replace(/\{\{\s*module\.(\w+)(?:\.(\w+))?\s*(\|\s*(\w+))?\s*\}\}/g, (_, key, sub, f, filter) => {
    const v = get(key, sub);
    return filter === "escape_attr" || filter === "escape" ? escAttr(v) : String(v);
  });
  out = out.replace(/\{\{\s*name\s*\}\}/g, instanceName);
  const left = out.match(/\{\{|\{%/);
  if(left) throw new Error("unreplaced HubL near: " + out.slice(left.index, left.index + 60));
  return out;
}

for(const n of NAMES){
  const dir = path.join(MODULES, "solpass-" + n + ".module");
  const fields = JSON.parse(fs.readFileSync(path.join(dir, "fields.json"), "utf8"));
  const defaults = Object.fromEntries(fields.map(f => [f.name, f.default]));
  const tpl = fs.readFileSync(path.join(dir, "module.html"), "utf8");
  const css = fs.readFileSync(path.join(dir, "module.css"), "utf8");
  const js = fs.readFileSync(path.join(dir, "module.js"), "utf8");
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  for(const [suffix, values] of [["", defaults], ["-live", Object.assign({}, defaults, LIVE)]]){
    const body = render(tpl, values, "widget_preview_" + n.replace(/-/g, "_"));
    const page = `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Förhandsvisning: ${meta.label}</title>
<style>body{margin:0;padding:40px 16px 64px;background:#fff;color:#0E1116;font:17px/1.6 "Schibsted Grotesk","Helvetica Neue",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}</style>
<style>
${css}
</style>
</head><body>
${body}
<script>
${js}
</script>
</body></html>
`;
    fs.writeFileSync(path.join(__dirname, n + suffix + ".html"), page);
    console.log("wrote preview/" + n + suffix + ".html");
  }
}

#!/usr/bin/env node
/* Builds preview/flyttplan.html from the solpass-flyttplan module: replaces the HubL expressions in
   module.html with fields.json defaults (or overrides) and inlines module.css and module.js.
   Usage: node preview-flyttplan.js [--portal_id=123 --form_guid=abc ... --out=file.html]
   Supports the HubL subset the module uses: {# comments #}, module.x, module.x.y, a dict literal
   of module values, and the filters escape_attr, escape, tojson and replace("a", "b"). */
const fs = require("fs");
const path = require("path");

const MOD = path.join(__dirname, "..", "modules", "solpass-flyttplan.module");

function defaults(){
  const fields = JSON.parse(fs.readFileSync(path.join(MOD, "fields.json"), "utf8"));
  const m = {};
  for(const f of fields) m[f.name] = f.default;
  return m;
}
const escAttr = s => String(s ?? "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function lookup(module, p){
  const parts = p.split(".");
  if(parts.shift() !== "module") throw new Error("Unsupported HubL reference: " + p);
  let v = module;
  for(const k of parts) v = v == null ? undefined : v[k];
  return v;
}
function evalPrimary(module, src){
  src = src.trim();
  if(src.startsWith("{")){
    const out = {};
    const re = /"([^"]+)"\s*:\s*(module(?:\.\w+)+)/g; let m;
    while((m = re.exec(src))) out[m[1]] = lookup(module, m[2]);
    return out;
  }
  if(/^module(\.\w+)+$/.test(src)) return lookup(module, src);
  throw new Error("Unsupported HubL expression: " + src);
}
function splitFilters(expr){
  // split on | outside quotes and braces
  const parts = []; let cur = "", q = null, depth = 0;
  for(const ch of expr){
    if(q){ cur += ch; if(ch === q) q = null; continue; }
    if(ch === '"' || ch === "'"){ q = ch; cur += ch; continue; }
    if(ch === "{" || ch === "(") depth++;
    if(ch === "}" || ch === ")") depth--;
    if(ch === "|" && depth === 0){ parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}
function applyFilter(v, f){
  f = f.trim();
  if(f === "escape_attr" || f === "escape") return escAttr(v);
  if(f === "tojson") return JSON.stringify(v);
  const m = f.match(/^replace\(\s*(["'])(.*?)\1\s*,\s*(["'])(.*?)\3\s*\)$/);
  if(m) return String(v).split(m[2]).join(m[4]);
  throw new Error("Unsupported HubL filter: " + f);
}
function renderHubl(html, module){
  html = html.replace(/\{#[\s\S]*?#\}/g, "");
  return html.replace(/\{\{([\s\S]*?)\}\}(?!\})/g, (all, expr) => {
    const [primary, ...filters] = splitFilters(expr);
    let v = evalPrimary(module, primary);
    for(const f of filters) v = applyFilter(v, f);
    return v == null ? "" : String(v);
  });
}

function build(overrides = {}, out = path.join(__dirname, "flyttplan.html")){
  const module = Object.assign(defaults(), overrides);
  const body = renderHubl(fs.readFileSync(path.join(MOD, "module.html"), "utf8"), module);
  if(/\{\{|\{%|\{#/.test(body)) throw new Error("Unrendered HubL left in output");
  const css = fs.readFileSync(path.join(MOD, "module.css"), "utf8");
  const js = fs.readFileSync(path.join(MOD, "module.js"), "utf8");
  const page = `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Förhandsvisning – Solpass flyttplan</title>
<style>body{margin:0;background:#fff;color:#0E1116;font:17px/1.6 "Helvetica Neue",system-ui,-apple-system,"Segoe UI",sans-serif}.page{padding:32px 16px 64px}</style>
<style>
${css}
</style></head><body><main class="page">
${body}
</main>
<script>
${js}
</script>
</body></html>
`;
  fs.writeFileSync(out, page);
  return out;
}

module.exports = {build, renderHubl, defaults};

if(require.main === module){
  const overrides = {}; let out;
  for(const a of process.argv.slice(2)){
    const m = a.match(/^--([\w]+)=(.*)$/); if(!m) continue;
    if(m[1] === "out") out = path.resolve(m[2]); else overrides[m[1]] = m[2];
  }
  console.log("Wrote " + build(overrides, out));
}

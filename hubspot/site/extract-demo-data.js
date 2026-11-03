// Pull the demo's content constants (FAQ, DOCS, AREAS, PTYPES, ...) out of index.html by running its script against a no-op DOM.
const fs = require("fs"), vm = require("vm");
const html = fs.readFileSync(process.argv[2], "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
const any = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : any, apply: () => any, construct: () => any, set: () => true });
const names = ["FAQ","DOCS","DOCS_CHECKED","AREAS","PTYPES","PGROUPS","CONTACTS","PADRON","TASKS","PHASES","PHASE_WHEN"];
const ctx = { document: any, window: any, localStorage: any, sessionStorage: any, location: { hash: "" }, navigator: any, history: any, matchMedia: () => any, setTimeout: () => 0, setInterval: () => 0, requestAnimationFrame: () => 0, addEventListener: () => {}, IntersectionObserver: any, ResizeObserver: any, fetch: () => new Promise(() => {}), console, Intl, Date, Math, JSON, URL, URLSearchParams };
ctx.globalThis = ctx;
vm.createContext(ctx);
try { vm.runInContext(scripts + `\n;globalThis.__out = {${names.map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : null`).join(",")}};`, ctx); }
catch (e) { console.error("script error (data may still be set):", e.message); try { vm.runInContext(`globalThis.__out = {${names.map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : null`).join(",")}};`, ctx); } catch (e2) { console.error(e2.message); } }
fs.writeFileSync(process.argv[3], JSON.stringify(ctx.__out, null, 1));
for (const n of names) console.log(n, Array.isArray(ctx.__out?.[n]) ? ctx.__out[n].length : typeof ctx.__out?.[n]);

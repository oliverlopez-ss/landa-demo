// Renders the demo's subpage views (index.html, hash routing) in a headless browser and turns each into static HTML
// for the "Solpass vy" module: links point at HubSpot paths, demo forms become HubSpot form slots, Plus is left out.
// Usage: NODE_PATH=<dir with playwright> node snapshot-views.js <index.html> <views.json>
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const [demo, out] = process.argv.slice(2);

// demo hash -> HubSpot path. Order matters: longer prefixes first.
const ROUTES = [
  ["#bostadsguide/radgivning", "/bostad#radgivning"], ["#bostadsguide", "/bostad"], ["#bostad", "/bostad/bolanekalkyl"],
  ["#hyrakopa", "/bostad/hyra-eller-kopa"], ["#skatt", "/skatt"], ["#start", "/flyttplan"], ["#plan", "/flyttplan"],
  ["#omraden", "/omraden"], ["#partners", "/partners"], ["#bli-partner", "/bli-partner"], ["#skolor", "/skolor"],
  ["#kontakter", "/kontakter"], ["#dokument", "/dokument"], ["#fragor", "/fragor"], ["#fraga", "/fraga"],
];
const mapHash = h => {
  if (h === "#" || h === "") return "/";
  // partner types live on one page, like the demo: /partners#gestor
  if (h.startsWith("#partners/")) return "/partners#" + h.slice(10);
  for (const [k, v] of ROUTES) {
    if (h === k) return v;
    if (h.startsWith(k + "/")) return v.split("#")[0] + "/" + h.slice(k.length + 1);
  }
  return h; // same-page anchor
};

// view key, demo hash, HubSpot slug, page title, form slot for the view's own form (partner types end up on /partners)
const AREAS = ["marbella", "san-pedro", "estepona", "benahavis", "fuengirola-mijas", "malaga"];
const VIEWS = [
  ["omraden", "#omraden", "omraden", "Områden på Costa del Sol"],
  ...AREAS.map(a => [`omrade-${a}`, `#omraden/${a}`, `omraden/${a}`, null, "fraga"]),
  ["bostadsguide", "#bostadsguide", "bostad", "Hyra först eller köpa direkt?", "maklare"],
  ["partners", "#partners", "partners", "Partners"],
  ["bli-partner", "#bli-partner", "bli-partner", "Bli partner", "partner"],
  ["skolor", "#skolor", "skolor", "Skolor från Sotogrande till Málaga"],
  ["kontakter", "#kontakter", "kontakter", "Vem löser vad"],
  ["dokument", "#dokument", "dokument", "Dokument och checklista", "checklista"],
  ["fragor", "#fragor", "fragor", "Vanliga frågor"],
  ["fraga", "#fraga", "fraga", "Ställ en fråga", "fraga"],
  // parts of calculator views; the calculators themselves are modules
  // the home comparison keeps the demo's markup as is; solpass-jamfor runs the demo's code on it
  ["bostad-jamfor", "#bostad", "bostad/bolanekalkyl", "Bolånekalkyl", "keep", "after:#qc"],
  ["skatt-info", "#skatt", "skatt", "Beckham-regimen", null, "last"],
];

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto("file://" + path.resolve(demo) + "#omraden");
  await pg.waitForTimeout(800);
  const ptypes = await pg.evaluate(() => PTYPES.map(t => [t.id, t.name]));
  // render as if Plus were unlocked, so the document guides show; Plus buttons are removed below
  await pg.evaluate(() => { state.plus = true; });
  const all = [...VIEWS, ...ptypes.map(([id, name]) => [`partner-${id}`, `#partners/${id}`, `partners/${id}`, name, "fraga"])];
  const result = [];
  for (const [key, hash, slug, title, formKey, part] of all) {
    await pg.evaluate(h => { location.hash = h; }, hash);
    await pg.waitForTimeout(500);
    const v = await pg.evaluate(({ formKey, part }) => {
      let view = document.querySelector("main > div:not([hidden])").cloneNode(true);
      if (part) {
        // keep only part of the view, inside the same wrapper
        const wrap = view.querySelector(".wrap"), kids = [...wrap.children];
        const keep = part === "last" ? kids.slice(-1) : kids.slice(kids.indexOf(wrap.querySelector(part.slice(6))) + 1);
        wrap.replaceChildren(...keep);
        if (part === "last") wrap.style.paddingTop = "0";
      }
      if (formKey === "keep") return { html: view.innerHTML, heading: "", lead: "" };
      const q = (s, r = view) => [...r.querySelectorAll(s)];
      // Solpass Plus is not offered on the HubSpot site
      q("[data-plus], .gate, .plusbadge, [data-intro], [data-scroll='plus']").forEach(e => e.remove());
      q(".foot").forEach(f => { if (!f.children.length) f.remove(); });
      // demo forms -> a slot where the HubSpot form is embedded; keep the heading and text above the fields
      q("form").forEach(f => {
        if (f.matches(".capture") && !f.closest("[id=dvCap]")) return;
        const d = document.createElement("div");
        d.className = (f.closest("#dvCap") ? "" : f.className) + " hsf-wrap";
        [...f.childNodes].forEach(n => {
          if (n.nodeType === 1 && n.matches("label,.field,.grid2,.chips,.row,input,select,textarea,.nl,.err,button,.seg,fieldset,.pick,[class*=pick]")) return;
          if (n.nodeType === 1 && n.querySelector("input,select,textarea,button")) return;
          d.appendChild(n.cloneNode(true));
        });
        const slot = document.createElement("div");
        slot.className = "hsf"; slot.dataset.form = formKey || "fraga";
        d.appendChild(slot);
        if (f.closest("#dvCap")) { f.replaceWith(slot); } else f.replaceWith(d);
      });
      q(".ok-msg, .err, [id$=Done], [id$=_ok]").forEach(e => e.remove());
      // buttons that only worked in the demo app
      q("#aCalc").forEach(e => { const a = document.createElement("a"); a.className = e.className; a.href = "#hyrakopa"; a.innerHTML = e.innerHTML; e.replaceWith(a); });
      q("[data-scroll='kalkyl']").forEach(e => { const a = document.createElement("a"); a.className = e.className; a.href = "/#kalkyl"; a.innerHTML = e.innerHTML; e.replaceWith(a); });
      q("#ptCopy, [data-pdf]").forEach(e => e.remove());
      q("a.who[data-contact], [data-contact]").forEach(e => { if (e.tagName === "A") e.setAttribute("href", "#kontakter"); });
      q("[hidden]").forEach(e => { if (!e.matches(".ptlist")) e.remove(); });
      q(".rv").forEach(e => e.classList.remove("rv", "in"));
      q("[onsubmit]").forEach(e => e.removeAttribute("onsubmit"));
      const h = view.querySelector("h1,h2");
      return { html: view.innerHTML, heading: h ? h.innerText : "", lead: (view.querySelector(".lead")?.innerText || "").slice(0, 300) };
    }, { formKey, part });
    let html = v.html;
    // partner types share one page, so their element ids get the type as suffix
    if (key.startsWith("partner-")) {
      const sfx = "-" + key.slice(8);
      html = html.replace(/\s(id|aria-controls|for)="([^"]+)"/g, (m, a, id) => ` ${a}="${id}${sfx}"`).replace(/href="#([^"]+)"/g, (m, id) => mapHash("#" + id) === "#" + id ? `href="#${id}${sfx}"` : m);
    }
    html = html.replace("Med Solpass Plus svarar vi inom två arbetsdagar.", "Vi svarar inom två arbetsdagar.").replace(/href="(#[^"]*)"/g, (m, h) => `href="${mapHash(h)}"`).replace(/\s(id|aria-controls)="v-[^"]*"/g, "");
    result.push({ key, slug, title: (title || v.heading) + " – Solpass", description: v.lead, html });
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify(result, null, 1));
  console.log(result.length, "views:", result.map(r => "/" + r.slug).join(" "));
})();

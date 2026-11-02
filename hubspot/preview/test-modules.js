// Headless tests for the four Solpass calculator modules. Run build-preview.js first.
// Compares each module with the demo (../../index.html) for identical inputs, checks for page errors and NaN/undefined,
// checks that preview mode makes no network request and that live mode posts the expected Forms API v3 body.
// Usage: node test-modules.js
const fs = require("fs"), path = require("path"), os = require("os");
const { chromium } = require("playwright");
const DEMO = "file://" + path.resolve(__dirname, "..", "..", "index.html");
const P = n => "file://" + path.join(__dirname, n + ".html");
const SHOTS = path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const results = [];
function check(name, ok, detail){ results.push({ name, ok, detail }); if(!ok) failures++; console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  " + detail : "")); }
const norm = s => String(s).replace(/\s+/g, " ").trim();

async function open(browser, url, opts = {}){
  const page = await browser.newPage({ viewport: { width: opts.width || 1280, height: 900 } });
  const errors = [], external = [];
  page.on("pageerror", e => errors.push(String(e)));
  if(opts.cookie) await page.addInitScript(c => { Object.defineProperty(document, "cookie", { get: () => c, set: () => {}, configurable: true }); }, opts.cookie);
  await page.route("**/*", async route => {
    const u = route.request().url();
    if(u.startsWith("file:")) return route.continue();
    external.push({ url: u, method: route.request().method(), body: route.request().postData() });
    if(opts.onExternal) return opts.onExternal(route);
    return route.abort();
  });
  await page.goto(url);
  await page.waitForTimeout(150);
  return { page, errors, external };
}
// set a value and fire the events the demo and the modules listen to
async function setVal(page, sel, value){
  await page.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, String(value));
}
async function clickRadio(page, sel){ await page.$eval(sel, el => { el.checked = true; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }); }
async function textOf(page, sel){ return norm(await page.$eval(sel, el => el.textContent)); }
async function visibleTextOk(name, page){
  const t = await page.evaluate(() => document.body.innerText);
  check(name + ": no NaN/undefined in visible text", !/NaN|undefined|Infinity/.test(t));
}
const mainV = async (page, sel) => norm(await page.$eval(sel, el => el.querySelector(".v").textContent));

(async () => {
  const browser = await chromium.launch();
  const numbers = [];

  /* ---------- Beckham ---------- */
  for(const [s1, s2] of [[120000, 60000], [120000, 30000], [40000, 0]]){
    const d = await open(browser, DEMO + "#skatt");
    await setVal(d.page, "#bk_s1", s1); await setVal(d.page, "#bk_s2", s2);
    const demoOut = await textOf(d.page, "#bkOut"), demoMain = await mainV(d.page, "#bkOut .kpi.big");
    const demoBest = norm(await d.page.$eval("#bkOut", el => { const p = [...el.querySelectorAll("p.note")].find(x => x.textContent.startsWith("Bäst")); return p ? p.textContent : ""; }));
    const m = await open(browser, P("beckham"));
    await setVal(m.page, ".sp-beckham [data-k=s1]", s1); await setVal(m.page, ".sp-beckham [data-k=s2]", s2);
    const modOut = await textOf(m.page, ".sp-beckham [data-role=out]"), modMain = await mainV(m.page, ".sp-beckham [data-out=main]");
    const modBest = norm(await m.page.$eval(".sp-beckham [data-out=best]", el => el.textContent).catch(() => ""));
    check(`Beckham ${s1}/${s2}: whole result text identical to demo`, demoOut === modOut, `demo "${demoMain}" / module "${modMain}"; ${modBest}`);
    numbers.push({ calc: "Beckham", inputs: `${s1} / ${s2}`, demo: demoMain + " · " + demoBest, module: modMain + " · " + modBest });
    check(`Beckham ${s1}/${s2}: no page errors`, !m.errors.length && !d.errors.length, m.errors.join("; "));
    await visibleTextOk(`Beckham ${s1}/${s2}`, m.page);
    await d.page.close(); await m.page.close();
  }
  // non-eligible paths
  for(const [label, act] of [["pension", async (pg, pre) => setVal(pg, pre === "demo" ? "#bk_why" : ".sp-beckham [data-k=why]", "pension")],
                             ["bott i Spanien", async (pg, pre) => clickRadio(pg, pre === "demo" ? '[name="bk_prev"][value="ja"]' : '.sp-beckham input[data-radio=prev][value="ja"]')]]){
    const d = await open(browser, DEMO + "#skatt"); await act(d.page, "demo");
    const m = await open(browser, P("beckham")); await act(m.page, "mod");
    check(`Beckham ${label}: result text identical to demo`, await textOf(d.page, "#bkOut") === await textOf(m.page, ".sp-beckham [data-role=out]"));
    await d.page.close(); await m.page.close();
  }

  /* ---------- Rent or buy ---------- */
  for(const [label, price, extra] of [["default 450 000", null, null], ["600 000", 600000, null], ["600 000, 10 år", 600000, "10"], ["600 000, 3 år", 600000, "3"]]){
    const d = await open(browser, DEMO + "#hyrakopa");
    const m = await open(browser, P("hyra-eller-kopa"));
    if(price){ await setVal(d.page, "#rb_price", price); await setVal(m.page, ".sp-hyra-eller-kopa [data-k=price]", price); }
    if(extra){ await clickRadio(d.page, `[name="rb_years"][value="${extra}"]`); await clickRadio(m.page, `.sp-hyra-eller-kopa input[data-radio=years][value="${extra}"]`); }
    const dRent = await d.page.$eval("#rb_rent", e => e.value), mRent = await m.page.$eval(".sp-hyra-eller-kopa [data-k=rent]", e => e.value);
    const demoOut = await textOf(d.page, "#rbOut"), modOut = await textOf(m.page, ".sp-hyra-eller-kopa [data-role=out]");
    const dm = await mainV(d.page, "#rbOut .kpi.big"), mm = await mainV(m.page, ".sp-hyra-eller-kopa [data-out=main]");
    check(`Hyra/köpa ${label}: suggested rent identical`, dRent === mRent, `${dRent} / ${mRent}`);
    check(`Hyra/köpa ${label}: whole result text identical to demo`, demoOut === modOut, `demo "${dm}" / module "${mm}"`);
    numbers.push({ calc: "Hyra eller köpa", inputs: `${label} (hyra ${mRent})`, demo: dm, module: mm });
    check(`Hyra/köpa ${label}: no page errors`, !m.errors.length && !d.errors.length, m.errors.join("; "));
    await visibleTextOk(`Hyra/köpa ${label}`, m.page);
    await d.page.close(); await m.page.close();
  }

  /* ---------- Quick housing cost ---------- */
  const qcRead = async (page, demo) => page.evaluate(demo => {
    const t = s => document.querySelector(s).textContent.replace(/\s+/g, " ").trim();
    return demo
      ? [t("#qcTotal"), t("#qcSub"), t("#qcCash"), t("#qcLoan"), t("#qcLegend"), t("#qcScen"), t("#qcPresets"), t("#qcPriceO"), t("#qcDownO"), t("#qcYearsO"), t("#qcRateO"), t("#qcIbiO")]
      : [t(".sp-bostadskostnad [data-o=total]"), t(".sp-bostadskostnad [data-o=sub]"), t(".sp-bostadskostnad [data-o=cash]"), t(".sp-bostadskostnad [data-o=loan]"), t(".sp-bostadskostnad [data-o=legend]"), t(".sp-bostadskostnad [data-o=scen]"), t(".sp-bostadskostnad [data-role=presets]"), t(".sp-bostadskostnad [data-o=price]"), t(".sp-bostadskostnad [data-o=down]"), t(".sp-bostadskostnad [data-o=years]"), t(".sp-bostadskostnad [data-o=rate]"), t(".sp-bostadskostnad [data-o=ibi]")];
  }, demo);
  const qcSteps = [
    ["defaults", []],
    ["CaixaBank preset", [["click", '[data-pre="caixa"]']]],
    ["resident, nyproduktion, 800 000 €", [["click", '[data-res="resident"]'], ["click", '[data-nb="1"]'], ["range", "price", 800000]]],
    ["Valencia 1,2 milj., utan paket", [["select", "region", "valencia"], ["range", "price", 1200000], ["click", '[data-pre="fix"]']]],
    ["egen ränta 4 %, 15 år, 50 % insats", [["range", "rate", 4], ["range", "years", 15], ["range", "down", 50]]]
  ];
  const demoSel = { price: "#qcPrice", rate: "#qcRate", years: "#qcYears", down: "#qcDown", region: "#qcRegion" };
  for(const [label, steps] of qcSteps){
    const d = await open(browser, DEMO + "#bostad");
    const m = await open(browser, P("bostadskostnad"));
    for(const [kind, a, b] of steps){
      if(kind === "click"){ await d.page.click("#qc " + a); await m.page.click(".sp-bostadskostnad " + a); }
      else { await setVal(d.page, demoSel[a], b); await setVal(m.page, `.sp-bostadskostnad [data-k=${a}]`, b); }
    }
    const dv = await qcRead(d.page, true), mv = await qcRead(m.page, false);
    check(`Bostadskostnad ${label}: total, sub, cash, loan, legend, scenarios, presets identical`, JSON.stringify(dv) === JSON.stringify(mv), dv.map((x, i) => x === mv[i] ? null : `#${i} demo "${x}" vs "${mv[i]}"`).filter(Boolean).join(" | "));
    numbers.push({ calc: "Bostadskostnad", inputs: label, demo: dv[0] + " /mån, kontant " + dv[2], module: mv[0] + " /mån, kontant " + mv[2] });
    check(`Bostadskostnad ${label}: no page errors`, !m.errors.length && !d.errors.length, m.errors.join("; "));
    await visibleTextOk(`Bostadskostnad ${label}`, m.page);
    await d.page.close(); await m.page.close();
  }

  /* ---------- Economy calculator ---------- */
  const calcCases = [
    ["defaults", {}],
    ["pension", { income: "pension" }],
    ["eget bolag", { income: "bolag" }],
    ["spansk, 1 vuxen, 900 000 kr, villa, svensk skola, 3 barn", { income: "spansk", adults: "1", inc: 900000, bo: "villa", skola: "sv", kids: 3 }],
    ["distans, 3 000 000 kr, 0 bilar", { inc: 3000000, bil: 0 }]
  ];
  for(const [label, c] of calcCases){
    const d = await open(browser, DEMO);
    const m = await open(browser, P("ekonomi"));
    for(const [key, v] of Object.entries(c)){
      if(key === "bo"){ await clickRadio(d.page, `[name="c_bo"][value="${v}"]`); await clickRadio(m.page, `.sp-ekonomi input[data-radio=bo][value="${v}"]`); continue; }
      const dsel = { inc: "#c_inc", adults: "#c_adults", income: "#c_income", kids: "#c_kids", skola: "#c_skola", bil: "#c_bil", senet: "#c_senet" }[key];
      await setVal(d.page, dsel, v); await setVal(m.page, `.sp-ekonomi [data-k=${key}]`, v);
    }
    const demoOut = await textOf(d.page, "#calcOut"), modOut = await textOf(m.page, ".sp-ekonomi [data-role=out]");
    const dm = await mainV(d.page, "#calcOut .kpi.big"), mm = await mainV(m.page, ".sp-ekonomi [data-out=main]");
    const dn = await d.page.$eval("#calcOut", el => el.querySelectorAll(".kpi").length), mn = await m.page.$eval(".sp-ekonomi [data-role=out]", el => el.querySelectorAll(".sp-kpi").length);
    check(`Ekonomi ${label}: whole result text identical to demo`, demoOut === modOut, `demo "${dm}" (${dn} rutor) / module "${mm}" (${mn} rutor)`);
    numbers.push({ calc: "Ekonomi", inputs: label, demo: `${dm} (${dn} rutor)`, module: `${mm} (${mn} rutor)` });
    check(`Ekonomi ${label}: no page errors`, !m.errors.length && !d.errors.length, m.errors.join("; "));
    await visibleTextOk(`Ekonomi ${label}`, m.page);
    await d.page.close(); await m.page.close();
  }

  /* ---------- lead capture ---------- */
  const caps = {
    "bostadskostnad": { ok: "Tack. Vi har sparat kalkylen.", props: ["solpass_bostad", "solpass_budget", "solpass_kalkyl"] },
    "hyra-eller-kopa": { ok: "Tack. Vi har sparat jämförelsen.", props: ["solpass_budget", "solpass_kalkyl"] },
    "beckham": { ok: "Tack. Vi har sparat kalkylen och hör av oss till test@exempel.se när vi har en skatterådgivare som kan både Sverige och Spanien.", props: ["solpass_inkomsttyp", "solpass_vuxna", "solpass_kalkyl"] },
    "ekonomi": { ok: "Tack. Vi har sparat kalkylen.", props: ["solpass_vuxna", "solpass_barn", "solpass_inkomsttyp", "solpass_kalkyl"] }
  };
  const sources = { "bostadskostnad": "kalkyl-bostad", "hyra-eller-kopa": "kalkyl-hyra-kopa", "beckham": "kalkyl-beckham", "ekonomi": "kalkyl-ekonomi" };
  const samples = {};
  for(const [n, c] of Object.entries(caps)){
    const R = ".sp-" + n;
    // preview mode: empty portal id, no network at all
    const p = await open(browser, P(n));
    await p.page.fill(R + " [data-role=cap-form] input[type=email]", "inte-en-adress");
    await p.page.$eval(R + " [data-role=cap-form]", f => f.requestSubmit ? f.dispatchEvent(new Event("submit", { cancelable: true })) : 0);
    const errTxt = norm(await p.page.$eval(R + " [data-role=cap-err]", e => e.hidden ? "" : e.textContent));
    check(`${n}: invalid email shows the demo's hint`, errTxt === "Skriv en e-postadress, till exempel namn@exempel.se.", errTxt);
    await p.page.fill(R + " [data-role=cap-form] input[type=email]", "test@exempel.se");
    await p.page.click(R + " [data-role=cap-form] button[type=submit]");
    await p.page.waitForTimeout(150);
    const okTxt = norm(await p.page.$eval(R + " [data-role=cap]", e => e.textContent));
    check(`${n}: preview mode shows confirmation`, okTxt === c.ok, okTxt);
    check(`${n}: preview mode makes no network request`, p.external.length === 0, JSON.stringify(p.external.map(x => x.url)));
    check(`${n}: no newsletter checkbox without subscription type id`, !(await p.page.$(R + " [data-nl]")));
    check(`${n}: no page errors (preview capture)`, !p.errors.length, p.errors.join("; "));
    await p.page.close();

    // live mode: fake portal, intercept and fulfil 200, check the body
    const l = await open(browser, P(n + "-live"), { cookie: "foo=1; hubspotutk=abc123def456",
      onExternal: route => route.request().url().startsWith("https://api.hsforms.com/") ? route.fulfill({ status: 200, contentType: "application/json", body: '{"inlineMessage":"ok"}' }) : route.abort() });
    await l.page.fill(R + " [data-role=cap-form] input[type=email]", "test@exempel.se");
    await l.page.check(R + " [data-nl]");
    await l.page.click(R + " [data-role=cap-form] button[type=submit]");
    await l.page.waitForTimeout(200);
    const reqs = l.external.filter(x => x.url.startsWith("https://api.hsforms.com/"));
    check(`${n}: live mode posts once to the Forms API v3 endpoint`, reqs.length === 1 && reqs[0].method === "POST" && reqs[0].url === "https://api.hsforms.com/submissions/v3/integration/submit/12345678/0a1b2c3d-1111-2222-3333-444455556666", reqs.map(r => r.url).join());
    const body = reqs[0] ? JSON.parse(reqs[0].body) : {};
    samples[n] = body;
    const fm = Object.fromEntries((body.fields || []).map(f => [f.name, f.value]));
    const shapeOk = Array.isArray(body.fields) && body.fields.every(f => typeof f.name === "string" && typeof f.value === "string")
      && fm.email === "test@exempel.se" && fm.solpass_kalla === sources[n] && c.props.every(k => k in fm) && fm.solpass_kalkyl.length <= 1000
      && body.context && body.context.pageUri.startsWith("file://") && typeof body.context.pageName === "string" && body.context.hutk === "abc123def456"
      && body.legalConsentOptions && body.legalConsentOptions.consent.consentToProcess === true && typeof body.legalConsentOptions.consent.text === "string" && body.legalConsentOptions.consent.text.length > 0
      && body.legalConsentOptions.consent.communications.length === 1 && body.legalConsentOptions.consent.communications[0].subscriptionTypeId === 987654
      && body.legalConsentOptions.consent.communications[0].value === true && body.legalConsentOptions.consent.communications[0].text === "Flyttbrevet"
      && !/NaN|undefined/.test(reqs[0].body);
    check(`${n}: request body shape (fields, context incl. hutk, legalConsentOptions)`, shapeOk, "fields: " + Object.keys(fm).join(", "));
    const okLive = norm(await l.page.$eval(R + " [data-role=cap]", e => e.textContent));
    check(`${n}: live mode shows confirmation after 200`, okLive === c.ok);
    await l.page.close();

    // live mode without the newsletter checkbox: no legalConsentOptions
    const l2 = await open(browser, P(n + "-live"), { onExternal: route => route.fulfill({ status: 200, body: "{}" }) });
    await l2.page.fill(R + " [data-role=cap-form] input[type=email]", "test@exempel.se");
    await l2.page.click(R + " [data-role=cap-form] button[type=submit]");
    await l2.page.waitForTimeout(200);
    const b2 = JSON.parse(l2.external[0].body);
    check(`${n}: unchecked newsletter sends no legalConsentOptions and no hutk without cookie`, !("legalConsentOptions" in b2) && !("hutk" in b2.context));
    await l2.page.close();

    // failure: 500 shows the error text and keeps the form
    const l3 = await open(browser, P(n + "-live"), { onExternal: route => route.fulfill({ status: 500, body: "{}" }) });
    await l3.page.fill(R + " [data-role=cap-form] input[type=email]", "test@exempel.se");
    await l3.page.click(R + " [data-role=cap-form] button[type=submit]");
    await l3.page.waitForTimeout(200);
    const e3 = norm(await l3.page.$eval(R + " [data-role=cap-err]", e => e.hidden ? "" : e.textContent));
    check(`${n}: failure shows error text`, e3 === "Det gick inte att skicka just nu. Försök igen." && !!(await l3.page.$(R + " [data-role=cap-form]")), e3);
    await l3.page.close();
  }

  /* ---------- two instances on one page ---------- */
  for(const n of Object.keys(caps)){
    const html = fs.readFileSync(path.join(__dirname, n + ".html"), "utf8");
    const i0 = html.indexOf("<body>\n") + 7, i1 = html.indexOf("\n<script>");
    const doubled = html.slice(0, i1) + "\n<hr>\n" + html.slice(i0, i1) + html.slice(i1);
    const tmp = path.join(os.tmpdir(), "sp-double-" + n + ".html");
    fs.writeFileSync(tmp, doubled);
    const t = await open(browser, "file://" + tmp);
    const roots = await t.page.$$(".sp-" + n);
    const before = await t.page.$$eval(`.sp-${n} [data-role=out], .sp-${n} [data-o=total]`, els => els.map(e => e.textContent));
    const inputSel = { "bostadskostnad": "[data-k=price]", "hyra-eller-kopa": "[data-k=price]", "beckham": "[data-k=s1]", "ekonomi": "[data-k=inc]" }[n];
    const val = n === "bostadskostnad" ? 900000 : n === "ekonomi" ? 2500000 : 300000;
    await roots[1].$eval(inputSel, (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, String(val));
    const after = await t.page.$$eval(`.sp-${n} [data-role=out], .sp-${n} [data-o=total]`, els => els.map(e => e.textContent));
    const names = await t.page.$$eval(`.sp-${n} input[type=radio]`, els => [...new Set(els.map(e => e.name))]);
    check(`${n}: two instances work independently`, roots.length === 2 && before[0] === before[1] && after[0] === before[0] && after[1] !== before[1] && !t.errors.length,
      `radio groups: ${names.join(", ") || "none"}`);
    await t.page.close(); fs.unlinkSync(tmp);
  }

  /* ---------- layout and screenshots ---------- */
  for(const n of Object.keys(caps)){
    for(const w of [1280, 390, 360]){
      const s = await open(browser, P(n), { width: w });
      const sw = await s.page.evaluate(() => document.documentElement.scrollWidth);
      check(`${n}: no horizontal scroll at ${w} px`, sw <= w, `scrollWidth ${sw}`);
      if(w !== 360) await s.page.screenshot({ path: path.join(SHOTS, `${n}-${w}.png`), fullPage: true });
      await s.page.close();
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, "test-results.json"), JSON.stringify({ results, numbers, samples }, null, 2));
  console.log("\nNumbers (demo vs module):");
  numbers.forEach(x => console.log(`  ${x.calc} | ${x.inputs} | demo: ${x.demo} | module: ${x.module}`));
  console.log(`\n${results.length - failures} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

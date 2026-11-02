#!/usr/bin/env node
/* Playwright test for the solpass-flyttplan module.
   Completes the wizard with the same answers in the demo (index.html, started from the home page)
   and in the module preview, and compares questions, task titles and due dates. Also checks page
   errors, NaN/undefined, persistence, preview mode (no network) and the HubSpot Forms API payload.
   Usage: node flyttplan-test.js  (writes screenshots to preview/shots/flyttplan-*.png) */
const path = require("path");
const fs = require("fs");
const {chromium} = require("playwright");
const {build} = require("./preview-flyttplan.js");

const DEMO = "file://" + path.resolve(__dirname, "..", "..", "index.html");
const PREVIEW = build();
const PREVIEW_HS = build({portal_id: "1234567", form_guid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", newsletter_subscription_type_id: "987654"}, path.join(__dirname, "flyttplan-hs.html"));
const SHOTS = path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, {recursive: true});
const JSPDF_LOCAL = process.env.JSPDF_LOCAL || ""; // optional path to jspdf.umd.min.js to serve for the cdnjs request

const PROFILES = [
  {name: "p1", movedate: "2027-08-01", picks: ["costa", "barn", "distans", "hyra", "h2", "med"], hushall: "Familjen Test", email: "test@example.se", nl: true},
  {name: "p2", movedate: "2027-02-01", picks: ["costa", "par", "pension", "kopa", "k2", "12m", "ingen"], hushall: "", email: "par@example.se", nl: false}
];

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? "PASS " : "FAIL ") + msg); if(!cond) failures++; };

async function newPage(browser, width, opts = {}){
  const ctx = await browser.newContext({viewport: {width, height: 900}});
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on("pageerror", e => errors.push(String(e)));
  // console errors from requests this test blocks on purpose (fonts, images) are not page errors
  page.on("console", m => { if(m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  await page.route("**/*", route => {
    const u = route.request().url();
    if(u.startsWith("file:")) return route.continue();
    if(opts.serve && u.startsWith("http://preview.test/")) return route.fulfill({status: 200, contentType: "text/html; charset=utf-8", body: fs.readFileSync(opts.serve)});
    requests.push({url: u, method: route.request().method(), body: route.request().postData()});
    if(opts.hsStatus && u.startsWith("https://api.hsforms.com/")) return route.fulfill({status: opts.hsStatus, contentType: "application/json", body: "{}"});
    if(u.startsWith("https://cdnjs.cloudflare.com/") && JSPDF_LOCAL) return route.fulfill({status: 200, contentType: "application/javascript", body: fs.readFileSync(JSPDF_LOCAL)});
    return route.abort();
  });
  return {ctx, page, errors, requests};
}
const dueDate = s => s.split("·").pop().replace(/^\s*senast\s+/, "").trim();

/* ---------- demo ---------- */
async function runDemo(browser, p){
  const {ctx, page, errors} = await newPage(browser, 1280);
  await page.goto(DEMO);
  await page.click("#headCta"); // "Gör er flyttplan" on the home page
  const steps = [];
  const record = async () => steps.push({top: (await page.textContent("#wz .wz-top span")).trim(), q: (await page.textContent("#wz h2")).trim(), opts: await page.$$eval("#wz .opt", b => b.map(x => x.textContent.trim()))});
  await page.waitForSelector("#wzDate");
  await record();
  await page.fill("#wzDate", p.movedate); await page.click("#wzNext");
  for(const v of p.picks){ await page.waitForSelector(`#wz .opt[data-v="${v}"]`); await record(); await page.click(`#wz .opt[data-v="${v}"]`); }
  await page.waitForSelector("#wzEmail"); await record();
  await page.fill("#wzName", p.hushall); await page.fill("#wzEmail", p.email);
  if(p.nl) await page.check("#wzNl");
  await page.click("#wzDone");
  await page.waitForSelector("#v-plan:not([hidden]) #plan .task");
  // dates are behind Plus in the demo; unlock Plus to read them
  await page.evaluate(() => { state.plus = true; save(); renderPlan(); });
  const read = () => page.$$eval("#plan .task", ts => ts.map(t => ({t: t.querySelector(".t").textContent.trim(), due: (t.querySelector(".due") || {}).textContent || "", who: t.querySelector(".who").textContent.trim()})));
  const tasks = (await read()).map(x => ({...x, due: dueDate(x.due)}));
  const resYear = await page.inputValue("#planResYear");
  await page.fill("#planResYear", "2030"); await page.dispatchEvent("#planResYear", "change");
  const tasks2030 = (await read()).map(x => ({...x, due: dueDate(x.due)}));
  const summary = await page.textContent("#planSummary");
  await ctx.close();
  return {steps, tasks, tasks2030, resYear, summary, errors};
}

/* ---------- module ---------- */
async function runModule(browser, p, file, width, opts = {}){
  const env = await newPage(browser, width, opts);
  const {page} = env;
  await page.goto("file://" + file);
  if(opts.shotPrefix) await page.screenshot({path: path.join(SHOTS, `flyttplan-${opts.shotPrefix}-intro-${width}.png`), fullPage: true});
  await page.click('.sp-flyttplan [data-fp-act="start"]');
  const W = ".sp-flyttplan [data-fp-wz]";
  const steps = [];
  const record = async () => steps.push({top: (await page.textContent(`${W} .fp-wz-top span`)).trim(), q: (await page.textContent(`${W} h2`)).trim(), opts: await page.$$eval(`${W} .fp-opt`, b => b.map(x => x.textContent.trim()))});
  await page.waitForSelector(`${W} [data-fp-date]`); await record();
  await page.fill(`${W} [data-fp-date]`, p.movedate); await page.click(`${W} [data-fp-act="next"]`);
  for(const [i, v] of p.picks.entries()){
    await page.waitForSelector(`${W} .fp-opt[data-v="${v}"]`); await record();
    if(opts.shotPrefix && i === 3) await page.screenshot({path: path.join(SHOTS, `flyttplan-${opts.shotPrefix}-wizard-${width}.png`), fullPage: true});
    await page.click(`${W} .fp-opt[data-v="${v}"]`);
  }
  await page.waitForSelector(`${W} [data-fp-email]`); await record();
  if(opts.shotPrefix) await page.screenshot({path: path.join(SHOTS, `flyttplan-${opts.shotPrefix}-email-${width}.png`), fullPage: true});
  await page.fill(`${W} [data-fp-name]`, p.hushall); await page.fill(`${W} [data-fp-email]`, p.email);
  if(p.nl) await page.check(`${W} [data-fp-nlbox]`);
  await page.click(`${W} [data-fp-act="done"]`);
  await page.waitForSelector('.sp-flyttplan [data-fp-view="plan"]:not([hidden]) .fp-task');
  const read = () => page.$$eval(".sp-flyttplan .fp-task", ts => ts.map(t => ({t: t.querySelector(".fp-t").textContent.trim(), due: (t.querySelector(".fp-due") || {}).textContent || "", who: t.querySelector(".fp-who").textContent.trim(), href: (t.querySelector("a.fp-who") || {}).href || ""})));
  const tasks = (await read()).map(x => ({...x, due: dueDate(x.due)}));
  const resYear = await page.inputValue(".sp-flyttplan [data-fp-resyear]");
  const planText = await page.innerText(".sp-flyttplan");
  const notice = await page.$eval(".sp-flyttplan [data-fp-plan]", el => el.textContent);
  if(opts.shotPrefix) await page.screenshot({path: path.join(SHOTS, `flyttplan-${opts.shotPrefix}-plan-${width}.png`), fullPage: true});
  await page.fill(".sp-flyttplan [data-fp-resyear]", "2030"); await page.dispatchEvent(".sp-flyttplan [data-fp-resyear]", "change");
  const tasks2030 = (await read()).map(x => ({...x, due: dueDate(x.due)}));
  const summary = await page.textContent(".sp-flyttplan [data-fp-summary]");
  return {env, steps, tasks, tasks2030, resYear, planText, notice, summary};
}

function compareLists(label, a, b){
  const fa = a.map(x => `${x.t} | ${x.due}`), fb = b.map(x => `${x.t} | ${x.due}`);
  const same = JSON.stringify(fa) === JSON.stringify(fb);
  ok(same, `${label}: ${fa.length} tasks, titles and due dates match`);
  if(!same){
    for(let i = 0; i < Math.max(fa.length, fb.length); i++) if(fa[i] !== fb[i]) console.log(`   #${i}\n   demo:   ${fa[i]}\n   module: ${fb[i]}`);
  }
  const whoSame = JSON.stringify(a.map(x => x.who)) === JSON.stringify(b.map(x => x.who));
  ok(whoSame, `${label}: "who" labels match`);
}

(async () => {
  const browser = await chromium.launch();
  try{
    for(const p of PROFILES){
      console.log(`\n=== Profile ${p.name}: move ${p.movedate}, ${p.picks.join(", ")} ===`);
      const demo = await runDemo(browser, p);
      const mod = await runModule(browser, p, PREVIEW, 1280, {shotPrefix: p.name});
      ok(JSON.stringify(demo.steps) === JSON.stringify(mod.steps), `wizard questions, options and "Fråga X av N" match (${demo.steps.length} steps: ${demo.steps.map(s => s.top).join(" / ")})`);
      if(JSON.stringify(demo.steps) !== JSON.stringify(mod.steps)) console.log(JSON.stringify({demo: demo.steps, mod: mod.steps}, null, 1));
      compareLists("default tax year " + demo.resYear, demo.tasks, mod.tasks);
      ok(demo.resYear === mod.resYear, `default first tax-residence year matches (${demo.resYear} / ${mod.resYear})`);
      compareLists("edited tax year 2030", demo.tasks2030, mod.tasks2030);
      ok(demo.summary.replace(/\s+/g, "") === mod.summary.replace(/\s+/g, ""), `plan summary chips match ("${mod.summary}")`);
      ok(demo.errors.length === 0, "demo: no page errors" + (demo.errors.length ? " " + demo.errors.join("; ") : ""));
      ok(mod.env.errors.length === 0, "module: no page errors" + (mod.env.errors.length ? " " + mod.env.errors.join("; ") : ""));
      ok(!/NaN|undefined/.test(mod.planText), "module: no NaN/undefined in plan");
      ok(mod.env.requests.length === 0, `preview mode (empty portal_id): no network calls (${mod.env.requests.length})`);
      ok(/Planen är sparad\./.test(mod.notice), "preview mode: plan shown with saved notice");
      const partnerLinks = mod.tasks.filter(t => t.href.startsWith("file:///partners#")).map(t => t.href.replace("file://", ""));
      ok(partnerLinks.length > 0, "partner who-links use url_partners#anchor: " + [...new Set(partnerLinks)].join(", "));

      // persistence: tick a task, reload, plan and tick still there
      const {page} = mod.env;
      await page.check(".sp-flyttplan .fp-task input[type=checkbox]");
      await page.reload();
      await page.waitForSelector('.sp-flyttplan [data-fp-view="plan"]:not([hidden]) .fp-task');
      ok(await page.isChecked(".sp-flyttplan .fp-task input[type=checkbox]"), "persistence: returning visitor sees plan with ticked task");
      ok((await page.inputValue(".sp-flyttplan [data-fp-resyear]")) === "2030", "persistence: edited tax year kept");
      ok((await page.textContent(".sp-flyttplan [data-fp-count]")).startsWith("1 av "), "progress counter updated");

      // PDF: lazy jsPDF from cdnjs
      const before = mod.env.requests.length;
      if(JSPDF_LOCAL){
        const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 10000}), page.click('.sp-flyttplan [data-fp-act="pdf"]')]);
        ok(/\.pdf$/.test(dl.suggestedFilename()), "PDF: jsPDF loaded lazily from cdnjs and checklist downloaded (" + dl.suggestedFilename() + ")");
      } else {
        await page.click('.sp-flyttplan [data-fp-act="pdf"]');
        await page.waitForSelector(".sp-flyttplan [data-fp-pdfmsg]:not([hidden])");
        ok(true, "PDF: cdnjs blocked, error message shown");
      }
      ok(mod.env.requests.slice(before).every(r => r.url.startsWith("https://cdnjs.cloudflare.com/ajax/libs/jspdf/")) && mod.env.requests.length === before + 1, "PDF: the only request is the lazy jsPDF script");
      await mod.env.ctx.close();

      // mobile
      const m390 = await runModule(browser, p, PREVIEW, 390, {shotPrefix: p.name});
      const overflow = await m390.env.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      ok(!overflow, "390 px: no horizontal overflow");
      await m390.env.page.setViewportSize({width: 360, height: 800});
      const overflow360 = await m390.env.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      ok(!overflow360, "360 px: no horizontal overflow");
      await m390.env.ctx.close();

      // HubSpot Forms API with a fake portal id
      const hs = await runModule(browser, p, PREVIEW_HS, 1280, {hsStatus: 200});
      const reqs = hs.env.requests.filter(r => r.url.startsWith("https://api.hsforms.com/"));
      ok(reqs.length === 1 && reqs[0].method === "POST" && reqs[0].url === "https://api.hsforms.com/submissions/v3/integration/submit/1234567/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "fake portal: one POST to Forms API v3 submit endpoint");
      const body = JSON.parse(reqs[0].body);
      const f = Object.fromEntries(body.fields.map(x => [x.name, x.value]));
      console.log("   payload fields: " + JSON.stringify(f));
      const allowed = ["email","firstname","solpass_kalla","solpass_flyttdatum","solpass_omraden","solpass_vuxna","solpass_barn","solpass_inkomsttyp","solpass_bostad","solpass_budget","solpass_partnerbehov","solpass_kalkyl"];
      ok(body.fields.every(x => allowed.includes(x.name) && typeof x.value === "string"), "payload: only known property names, string values");
      ok(f.email === p.email && f.solpass_kalla === "plan" && f.solpass_flyttdatum === p.movedate && f.solpass_inkomsttyp === p.picks[2] && f.solpass_bostad === p.picks[3] && f.solpass_omraden === "costa", "payload: email, källa, flyttdatum, inkomsttyp, bostad, områden mapped");
      ok(p.hushall ? f.firstname === p.hushall : !("firstname" in f), "payload: firstname only when household name given");
      ok(p.picks[1] === "par" ? f.solpass_vuxna === "2" && f.solpass_barn === "0" : !("solpass_vuxna" in f), "payload: vuxna/barn derived from 'Vilka flyttar?'");
      const expectNeeds = [...new Set(hs.tasks.map(t => t.who))].length > 0;
      ok(expectNeeds && /^[a-z-]+(;[a-z-]+)*$/.test(f.solpass_partnerbehov), "payload: partnerbehov semicolon-separated: " + f.solpass_partnerbehov);
      ok(/^Flytt \d{1,2} [a-z]{3} \d{4}, .*; första skatteår \d{4}$/.test(f.solpass_kalkyl), "payload: kalkyl summary: " + f.solpass_kalkyl);
      ok(body.context && body.context.pageUri.startsWith("file://") && typeof body.context.pageName === "string" && !("hutk" in body.context), "payload: context pageUri/pageName, no hutk without cookie");
      if(p.nl) ok(body.legalConsentOptions && body.legalConsentOptions.consent.consentToProcess === true && body.legalConsentOptions.consent.communications[0].subscriptionTypeId === 987654 && body.legalConsentOptions.consent.communications[0].text === "Flyttbrevet" && body.legalConsentOptions.consent.communications[0].value === true, "payload: legalConsentOptions when newsletter ticked");
      else ok(!("legalConsentOptions" in body), "payload: no legalConsentOptions when newsletter not ticked");
      ok(hs.env.errors.length === 0, "fake portal: no page errors");
      await hs.env.ctx.close();
    }

    // failure path + hutk cookie: Forms API returns 500, plan still shown with the error message
    const p = PROFILES[0];
    const fail = await (async () => {
      const r = await runModule(browser, p, PREVIEW_HS, 1280, {hsStatus: 500});
      return r;
    })();
    ok(/Det gick inte att skicka just nu\. Försök igen\./.test(fail.notice) && fail.tasks.length > 0, "Forms API failure: error shown and plan still visible");
    await fail.env.page.screenshot({path: path.join(SHOTS, "flyttplan-error-1280.png"), fullPage: false});
    await fail.env.ctx.close();

    // served from a fake http origin so the page can have a hubspotutk cookie
    const ck = await newPage(browser, 1280, {hsStatus: 200, serve: PREVIEW_HS});
    await ck.ctx.addCookies([{name: "hubspotutk", value: "abc123hutk", url: "http://preview.test/"}]);
    await ck.page.goto("http://preview.test/flyttplan-hs.html");
    const hasCookie = await ck.page.evaluate(() => document.cookie.includes("hubspotutk"));
    if(hasCookie){
      await ck.page.click('.sp-flyttplan [data-fp-act="start"]');
      await ck.page.click('.sp-flyttplan [data-fp-act="skipdate"]');
      for(const v of ["costa","solo","bolag","hyra","vet","kop"]) await ck.page.click(`.sp-flyttplan .fp-opt[data-v="${v}"]`);
      await ck.page.fill(".sp-flyttplan [data-fp-email]", "solo@example.se");
      await ck.page.click('.sp-flyttplan [data-fp-act="done"]');
      await ck.page.waitForSelector('.sp-flyttplan [data-fp-view="plan"]:not([hidden])');
      const b = JSON.parse(ck.requests.find(r => r.url.startsWith("https://api.hsforms.com/")).body);
      ok(b.context.hutk === "abc123hutk", "payload: hutk read from hubspotutk cookie");
      const f = Object.fromEntries(b.fields.map(x => [x.name, x.value]));
      ok(!("solpass_flyttdatum" in f) && /^Flyttdatum ej satt, /.test(f.solpass_kalkyl) && f.solpass_vuxna === "1", "no move date: flyttdatum omitted, kalkyl says so: " + f.solpass_kalkyl);
      const txt = await ck.page.innerText(".sp-flyttplan");
      ok(!/NaN|undefined/.test(txt) && /Ange flyttdag under/.test(txt), "no move date: plan without dates, hint shown, no NaN/undefined");
    } else console.log("SKIP hutk cookie test (file:// pages cannot set cookies)");
    await ck.ctx.close();
  } finally {
    await browser.close();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

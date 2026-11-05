/* Solpass: Vad kostar bostaden per månad: initialises every .sp-bostadskostnad on the page independently. No globals, no libraries. */
(function(){
  "use strict";
  /* ---------- shared helpers (same formatting as the Solpass demo) ---------- */
  var eur = function(n){ return Math.round(n).toLocaleString("sv-SE") + " €"; };
  // tax estimates are shown as an order of magnitude, never as an exact amount
  var eurCa = function(n, step){ step = step || 1000; return "ca " + (Math.round(n / step) * step).toLocaleString("sv-SE") + " €"; };
  function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  var validEmail = function(e){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); };
  var instanceCount = 0;
  function qs(root, sel){ return root.querySelector(sel); }
  function qsa(root, sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  // radio groups get a name that is unique per module instance, so two instances on one page do not share a group
  function uniqueRadios(root){
    var n = ++instanceCount;
    qsa(root, "input[type=radio][data-radio]").forEach(function(i){ i.name = "sp" + n + "-" + i.getAttribute("data-radio"); });
  }
  function hutk(){ var m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; }

  /* ---------- lead capture: HubSpot Forms API v3 (public, no key) ---------- */
  // Without portal id or form guid the module runs in preview mode: no network call, the confirmation is shown.
  function submitLead(root, props, newsletter){
    var portal = (root.getAttribute("data-portal") || "").trim(), form = (root.getAttribute("data-form") || "").trim();
    if(!portal || !form) return Promise.resolve(true);
    var fields = [];
    Object.keys(props).forEach(function(k){ var v = props[k]; if(v !== null && v !== undefined && v !== "") fields.push({ name: k, value: String(v) }); });
    var context = { pageUri: location.href, pageName: document.title }, tk = hutk();
    if(tk) context.hutk = tk;
    var body = { fields: fields, context: context };
    var subId = (root.getAttribute("data-nl") || "").trim();
    if(newsletter && subId){
      body.legalConsentOptions = { consent: { consentToProcess: true, text: root.getAttribute("data-consent") || "",
        communications: [{ value: true, subscriptionTypeId: Number(subId), text: "Flyttbrevet" }] } };
    }
    var url = "https://api.hsforms.com/submissions/v3/integration/submit/" + encodeURIComponent(portal) + "/" + encodeURIComponent(form);
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function(r){ return r.ok; }, function(){ return false; });
  }
  // validates, disables the button while sending, shows an error that says how to fix it
  function bindCapture(root, buildProps, okHtml){
    var form = qs(root, "[data-role=cap-form]"); if(!form) return;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var input = qs(form, "input[type=email]"), email = input.value.trim(), err = qs(root, "[data-role=cap-err]"), btn = qs(form, "button[type=submit]");
      var nl = !!qs(form, "[data-nl]:checked");
      err.hidden = true;
      if(!validEmail(email)){ err.textContent = "Skriv en e-postadress, till exempel namn@exempel.se."; err.hidden = false; return; }
      btn.disabled = true;
      var props = Object.assign({ email: email, solpass_kalla: root.getAttribute("data-source") || "" }, buildProps());
      if(props.solpass_kalkyl) props.solpass_kalkyl = String(props.solpass_kalkyl).slice(0, 1000);
      submitLead(root, props, nl).then(function(ok){
        btn.disabled = false;
        if(ok) qs(root, "[data-role=cap]").innerHTML = '<div class="sp-ok">' + okHtml(email) + '</div>';
        else { err.textContent = "Det gick inte att skicka just nu. Försök igen."; err.hidden = false; }
      });
    });
  }

  /* ---------- home calculator (model from the Solpass demo; draft figures, verify with a broker) ---------- */
  var HOME_CFG = {
    euribor: 0.03239,
    regions: {
      andalucia: { label: "Andalusien (Costa del Sol)", itp: [[null, 0.07]], itpMode: "whole", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.012 },
      valencia: { label: "Valencia (Costa Blanca)", itp: [[1000000, 0.09], [null, 0.11]], itpMode: "whole", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.014 },
      murcia: { label: "Murcia (Costa Cálida)", itp: [[null, 0.0775]], itpMode: "whole", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.015 },
      canarias: { label: "Kanarieöarna", itp: [[null, 0.065]], itpMode: "whole", newBuildVat: 0.07, newBuildVatLabel: "IGIC", ajd: 0.01 },
      baleares: { label: "Balearerna (Mallorca)", itp: [[400000, 0.08], [600000, 0.09], [1000000, 0.1], [2000000, 0.12], [null, 0.13]], itpMode: "progressive", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.015 },
      cataluna: { label: "Katalonien (Costa Brava)", itp: [[600000, 0.1], [900000, 0.11], [1500000, 0.12], [null, 0.13]], itpMode: "progressive", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.015 },
      madrid: { label: "Madrid", itp: [[null, 0.06]], itpMode: "whole", newBuildVat: 0.1, newBuildVatLabel: "IVA", ajd: 0.0075 }
    },
    maxLtv: { resident: 0.8, nonResident: 0.7 },
    maxYears: { resident: 30, nonResident: 25 },
    rates: { fixed: { bonified: 0.0285, plain: 0.0385 }, variable: { bonified: 0.0055, plain: 0.0155 } },
    nonResidentRateAdd: 0.0025,
    linkedProductsMonthly: 75,
    homeInsuranceMonthly: 25,
    purchaseFees: { notary: 900, registry: 600, gestoria: 400, valuation: 450, lawyerRate: 0.0121 },
    catastralRatio: 0.4, imputedRate: 0.02, imputedRateRevised: 0.011, ibiRateOfPrice: 0.0025, nonResidentTaxRate: 0.19, stressEuribor: 0.02
  };
  function annuity(loan, rate, years){ var n = Math.round(years * 12); if(loan <= 0 || n <= 0) return 0; var r = rate / 12; return r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)); }
  function resaleTax(price, region){
    if(region.itpMode === "whole"){ var b = region.itp.find(function(x){ return x[0] === null || price <= x[0]; }) || region.itp[region.itp.length - 1]; return price * b[1]; }
    var tax = 0, prev = 0;
    region.itp.forEach(function(x){ var top = x[0] == null ? Infinity : x[0]; if(price > prev) tax += (Math.min(price, top) - prev) * x[1]; prev = top; });
    return tax;
  }
  function calculateHome(home, buyer, cfg){
    var price = Math.max(0, home.price), region = cfg.regions[home.region] || cfg.regions[Object.keys(cfg.regions)[0]];
    var nonRes = buyer.residency === "nonResident";
    var ltv = Math.max(0, Math.min(buyer.ltv, nonRes ? cfg.maxLtv.nonResident : cfg.maxLtv.resident));
    var years = Math.max(1, Math.min(buyer.years, nonRes ? cfg.maxYears.nonResident : cfg.maxYears.resident));
    var loan = price * ltv;
    var tax = home.newBuild ? price * (region.newBuildVat + region.ajd) : resaleTax(price, region);
    var f = cfg.purchaseFees;
    var fees = [["Notarie", f.notary], ["Registro", f.registry], ["Gestoría", f.gestoria], ["Advokat", price * f.lawyerRate]];
    if(loan > 0) fees.push(["Värdering", f.valuation]);
    var feeSum = fees.reduce(function(s, x){ return s + x[1]; }, 0);
    var cash = price - loan + tax + feeSum;
    var catastral = home.catastral > 0 ? home.catastral : price * cfg.catastralRatio;
    var nonResTax = nonRes ? catastral * cfg.imputedRate * cfg.nonResidentTaxRate : 0;
    var running = Math.max(0, home.communityMonthly) + Math.max(0, home.ibiYearly) / 12 + nonResTax / 12;
    return { loan: loan, ltv: ltv, years: years, tax: tax, feeSum: feeSum, cash: cash, running: running, nonResTax: nonResTax };
  }

  // CaixaBank HolaBank, fixed rate only. Full discount (1 point) needs salary and bills in the bank, home and life insurance,
  // and an alarm: 317 €/yr + 226.58 €/yr + 52.03 €/month + card 36 €/yr. The account (35 € per quarter) applies either way.
  var CAIXA = { rate: { bonified: 0.028, plain: 0.038 }, maxLtv: 0.7, maxYears: 20,
    packageMonthly: 317 / 12 + 226.58 / 12 + 52.03 + 36 / 12, homeInsuranceMonthly: 25, accountMonthly: 35 / 3, valuation: 289.06 };
  function effectiveCfg(buyer){
    if(buyer.bank !== "caixabank" || buyer.residency !== "nonResident") return HOME_CFG;
    return Object.assign({}, HOME_CFG, {
      rates: { fixed: CAIXA.rate, variable: CAIXA.rate },
      nonResidentRateAdd: 0,
      maxLtv: { resident: HOME_CFG.maxLtv.resident, nonResident: CAIXA.maxLtv },
      maxYears: { resident: HOME_CFG.maxYears.resident, nonResident: CAIXA.maxYears },
      linkedProductsMonthly: CAIXA.packageMonthly + CAIXA.accountMonthly,
      homeInsuranceMonthly: CAIXA.homeInsuranceMonthly + CAIXA.accountMonthly,
      purchaseFees: Object.assign({}, HOME_CFG.purchaseFees, { valuation: CAIXA.valuation })
    });
  }
  var qpct = function(n){ return (n * 100).toFixed(2).replace(".", ",").replace(/,?0+$/, "") + " %"; };
  var budgetBucket = function(p){ return p <= 0 ? null : p < 300000 ? "k1" : p <= 600000 ? "k2" : p <= 1000000 ? "k3" : "k4"; };
  function setRange(el, v){ el.value = v; el.style.setProperty("--p", ((v - el.min) / (el.max - el.min) * 100) + "%"); }

  /* ---------- quick home calculator: sliders, suggested rates and scenarios ---------- */
  function init(root){
    var dPrice = +root.getAttribute("data-price");
    var qc = { price: dPrice > 0 ? Math.min(3000000, Math.max(150000, Math.round(dPrice / 10000) * 10000)) : 450000, region: "andalucia", newBuild: false, res: "nonResident", down: 0.3, years: 25, rate: null, preset: "fix-pkg", pkg: true, com: 150, ibi: null };
    var k = function(name){ return qs(root, '[data-k="' + name + '"]'); }, o = function(name){ return qs(root, '[data-o="' + name + '"]'); };
    function qcPresets(){
      var c = HOME_CFG, add = qc.res === "nonResident" ? c.nonResidentRateAdd : 0;
      var list = [
        { id: "fix-pkg", label: "Fast med paket", rate: c.rates.fixed.bonified + add, pkg: true, note: "typisk ränta, oktober 2026" },
        { id: "fix", label: "Fast utan paket", rate: c.rates.fixed.plain + add, pkg: false, note: "utan försäkringar via banken" },
        { id: "var", label: "Rörlig med paket", rate: c.euribor + c.rates.variable.bonified + add, pkg: true, note: "Euribor " + qpct(c.euribor) + " (prel.) plus marginal" }
      ];
      if(qc.res === "nonResident") list.push({ id: "caixa", label: "CaixaBank HolaBank", rate: CAIXA.rate.bonified, pkg: true, note: "publicerad ränta, högst 20 år", years: CAIXA.maxYears });
      return list;
    }
    function qcMonthly(rate, years, down){
      // the HolaBank preset uses CaixaBank's own package cost, as in the comparison table
      var c = qc.preset === "caixa" ? effectiveCfg({ bank: "caixabank", residency: qc.res }) : HOME_CFG;
      var ibi = qc.ibi != null ? qc.ibi : Math.round(qc.price * HOME_CFG.ibiRateOfPrice / 50) * 50;
      var h = calculateHome({ price: qc.price, region: qc.region, newBuild: qc.newBuild, communityMonthly: qc.com, ibiYearly: ibi, catastral: 0 },
        { residency: qc.res, ltv: 1 - down, years: years, rateType: "fixed", bank: "typical" }, c);
      var pay = annuity(h.loan, rate, h.years), interest = h.loan * rate / 12, ins = qc.pkg ? c.linkedProductsMonthly : c.homeInsuranceMonthly;
      return { h: h, pay: pay, interest: interest, amort: Math.max(0, pay - interest), running: h.running, ins: ins, ibi: ibi, total: pay + h.running + ins };
    }
    var snap = {};
    function render(){
      var c = HOME_CFG, maxLtv = qc.res === "nonResident" ? c.maxLtv.nonResident : c.maxLtv.resident;
      var maxYears = qc.res === "nonResident" ? c.maxYears.nonResident : c.maxYears.resident;
      var presets = qcPresets(), pre = presets.find(function(x){ return x.id === qc.preset; });
      if(pre && pre.years) maxYears = Math.min(maxYears, pre.years);
      if(qc.preset === "caixa" && qc.res !== "nonResident") qc.preset = "fix-pkg";
      if(qc.rate === null) qc.rate = (presets.find(function(x){ return x.id === qc.preset; }) || presets[0]).rate;
      qc.down = Math.max(qc.down, Math.round((1 - maxLtv) * 100) / 100); qc.years = Math.min(qc.years, maxYears);
      k("down").min = Math.round((1 - maxLtv) * 100); k("years").max = maxYears;
      setRange(k("price"), qc.price); setRange(k("down"), Math.round(qc.down * 100)); setRange(k("years"), qc.years); setRange(k("rate"), qc.rate * 100);
      setRange(k("com"), qc.com);
      var r = qcMonthly(qc.rate, qc.years, qc.down);
      setRange(k("ibi"), r.ibi);
      o("price").textContent = eur(qc.price); o("down").textContent = Math.round(qc.down * 100) + " % · " + eur(qc.price * qc.down);
      o("years").textContent = qc.years + " år"; o("rate").textContent = qpct(qc.rate);
      o("com").textContent = eur(qc.com) + "/mån"; o("ibi").textContent = eur(r.ibi) + "/år";
      k("pkg").checked = qc.pkg;
      qsa(root, "[data-nb]").forEach(function(b){ b.setAttribute("aria-pressed", String((b.getAttribute("data-nb") === "1") === qc.newBuild)); });
      qsa(root, "[data-res]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-res") === qc.res)); });
      var pr = qs(root, "[data-role=presets]");
      pr.innerHTML = presets.map(function(x){ return '<button type="button" data-pre="' + x.id + '" aria-pressed="' + (qc.preset === x.id) + '">' + x.label + '<b>' + qpct(x.rate) + '</b><small>' + x.note + '</small></button>'; }).join("");
      qsa(pr, "[data-pre]").forEach(function(b){ b.onclick = function(){ var x = qcPresets().find(function(p){ return p.id === b.getAttribute("data-pre"); }); qc.preset = x.id; qc.rate = x.rate; qc.pkg = x.pkg; if(x.years) qc.years = Math.min(qc.years, x.years); render(); }; });
      o("total").textContent = eur(r.total);
      o("sub").textContent = qpct(qc.rate) + " på " + qc.years + " år · lån " + Math.round((1 - qc.down) * 100) + " %" + (qc.res === "nonResident" ? " · inklusive skatt för icke-residenter" : "");
      var parts = [["Ränta", r.interest, "#7FD6AA"], ["Amortering", r.amort, "#17724A"], ["Comunidad, IBI och skatt", r.running, "#9AA3AE"], [qc.pkg ? "Bankens paket" : "Hemförsäkring", r.ins, "#5B6470"]];
      o("bar").innerHTML = parts.map(function(p){ return '<i style="width:' + (p[1] / r.total * 100).toFixed(1) + '%;background:' + p[2] + '"></i>'; }).join("");
      o("legend").innerHTML = parts.map(function(p){ return '<li><i style="background:' + p[2] + '"></i>' + p[0] + '<b>' + eur(p[1]) + '</b></li>'; }).join("");
      o("cash").textContent = eur(r.h.cash); o("loan").textContent = eur(r.h.loan);
      var scen = [
        ["Räntan stiger 1 %", qcMonthly(qc.rate + 0.01, qc.years, qc.down).total],
        ["Räntan sjunker 1 %", qcMonthly(Math.max(0.005, qc.rate - 0.01), qc.years, qc.down).total],
        ["Stresstest: +2 %", qcMonthly(qc.rate + 0.02, qc.years, qc.down).total],
        [qc.down < 0.9 ? "10 % mer kontant" : "5 år kortare löptid", qc.down < 0.9 ? qcMonthly(qc.rate, qc.years, Math.min(1, qc.down + 0.1)).total : qcMonthly(qc.rate, Math.max(5, qc.years - 5), qc.down).total]
      ];
      o("scen").innerHTML = scen.map(function(s){ var d = s[1] - r.total; return '<div><span>' + s[0] + '</span><b>' + eur(s[1]) + '</b><em class="' + (d > 0 ? "up" : "down") + '">' + (d > 0 ? "+" : "−") + eur(Math.abs(d)) + ' i månaden</em></div>'; }).join("");
      snap = { price: qc.price, region: HOME_CFG.regions[qc.region].label, newBuild: qc.newBuild, res: qc.res, down: qc.down, years: qc.years, rate: qc.rate, pkg: qc.pkg, total: r.total, cash: r.h.cash, loan: r.h.loan };
    }
    var reg = k("region");
    reg.innerHTML = Object.keys(HOME_CFG.regions).map(function(key){ return '<option value="' + key + '">' + HOME_CFG.regions[key].label + '</option>'; }).join("");
    reg.value = qc.region;
    k("price").oninput = function(e){ qc.price = +e.target.value; render(); };
    k("down").oninput = function(e){ qc.down = +e.target.value / 100; render(); };
    k("years").oninput = function(e){ qc.years = +e.target.value; render(); };
    k("rate").oninput = function(e){ qc.rate = +e.target.value / 100; qc.preset = ""; render(); };
    k("com").oninput = function(e){ qc.com = +e.target.value; render(); };
    k("ibi").oninput = function(e){ qc.ibi = +e.target.value; render(); };
    k("pkg").onchange = function(e){ qc.pkg = e.target.checked; render(); };
    reg.onchange = function(e){ qc.region = e.target.value; render(); };
    qsa(root, "[data-nb]").forEach(function(b){ b.onclick = function(){ qc.newBuild = b.getAttribute("data-nb") === "1"; render(); }; });
    qsa(root, "[data-res]").forEach(function(b){ b.onclick = function(){ qc.res = b.getAttribute("data-res"); var pr = qcPresets().find(function(x){ return x.id === qc.preset; }); if(pr) qc.rate = pr.rate; else if(qc.preset === "caixa"){ qc.preset = "fix-pkg"; qc.rate = null; } render(); }; });
    render();
    // hands the current home to the comparison below (solpass-jamfor), like the demo's "Lägg till i jämförelsen"
    var add = qs(root, "[data-role=add]");
    if(add) add.onclick = function(){
      var ibi = qc.ibi != null ? qc.ibi : Math.round(qc.price * HOME_CFG.ibiRateOfPrice / 50) * 50;
      document.dispatchEvent(new CustomEvent("solpass:add-home", { detail: { price: qc.price, region: qc.region, newBuild: qc.newBuild, communityMonthly: qc.com, ibiYearly: ibi } }));
    };
    bindCapture(root, function(){
      var s = snap;
      var txt = "Pris " + eur(s.price) + ", " + s.region + ", " + (s.newBuild ? "nyproduktion" : "begagnad") + ", köper som " + (s.res === "nonResident" ? "icke-resident (bor i Sverige)" : "resident i Spanien") + ", kontantinsats " + Math.round(s.down * 100) + " %, " + s.years + " år, ränta " + qpct(s.rate) + (s.pkg ? " med bankens paket" : " utan paket") + ": ca " + eur(s.total) + " per månad, kontant på köpdagen " + eur(s.cash) + ", lån " + eur(s.loan) + ".";
      return { solpass_bostad: "kopa", solpass_budget: budgetBucket(s.price), solpass_kalkyl: txt };
    }, function(){ return "Tack. Vi har sparat kalkylen."; });
  }

  function start(){
    qsa(document, ".sp-bostadskostnad").forEach(function(root){
      if(root.getAttribute("data-sp-ready")) return;
      root.setAttribute("data-sp-ready", "1");
      try{ init(root); }catch(e){ if(window.console) console.error("solpass-bostadskostnad", e); }
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

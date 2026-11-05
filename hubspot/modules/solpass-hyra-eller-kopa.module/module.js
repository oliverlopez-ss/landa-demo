/* Solpass: Hyra eller köpa: initialises every .sp-hyra-eller-kopa on the page independently. No globals, no libraries. */
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

  function scale(base, br){ var t = 0, prev = 0; for(var i = 0; i < br.length; i++){ var lim = br[i][0], r = br[i][1]; if(base > prev) t += (Math.min(base, lim) - prev) * r; prev = lim; } return t; }
  var SAVINGS = [[6000,.19],[50000,.21],[200000,.23],[300000,.27],[1e12,.30]];
  var pct = function(n){ return (n * 100).toLocaleString("sv-SE", {maximumFractionDigits: 2}) + " %"; };
  // purchase budget in the same buckets as the Solpass plan wizard (k1–k4)
  var budgetBucket = function(p){ return p <= 0 ? null : p < 300000 ? "k1" : p <= 600000 ? "k2" : p <= 1000000 ? "k3" : "k4"; };

  /* ---------- rent or buy: money gone after N years, home sold at the end ---------- */
  function loanBalance(loan, rate, years, afterYears){ var r = rate / 12, n = Math.round(years * 12), k = Math.min(n, Math.round(afterYears * 12)); if(loan <= 0) return 0; if(r === 0) return loan * (1 - k / n); var pay = annuity(loan, rate, years); return loan * Math.pow(1 + r, k) - pay * (Math.pow(1 + r, k) - 1) / r; }
  var SALE_AGENT_FEE = 0.05 * 1.21; // 5 % agent fee plus 21 % IVA
  function rentOrBuy(i){
    var cfg = HOME_CFG, N = i.years;
    var ltv = Math.min(1 - i.down, cfg.maxLtv.resident), loanYears = 25;
    var home = calculateHome({price: i.price, region: "andalucia", newBuild: false, communityMonthly: i.com, ibiYearly: i.price * cfg.ibiRateOfPrice, catastral: 0}, {residency: "resident", ltv: ltv, years: loanYears, rateType: "fixed", bank: "typical"}, cfg);
    var pay = annuity(home.loan, i.rate, loanYears);
    var maintenance = i.price * 0.01;
    var buyOut = home.cash, rentOut = 0;
    var rows = [];
    for(var y = 1; y <= N; y++){
      // the rate is the bank's package rate (bonificado), so the package cost (home and life insurance) goes with it
      var yearly = pay * 12 + cfg.linkedProductsMonthly * 12 + home.running * 12 + maintenance;
      buyOut += yearly;
      rentOut += i.rent * 12 * Math.pow(1 + i.rentg, y - 1);
      var value = i.price * Math.pow(1 + i.growth, y), balance = loanBalance(home.loan, i.rate, loanYears, y);
      var net = value * (1 - SALE_AGENT_FEE);
      var gain = Math.max(0, net - i.price - home.tax - home.feeSum), cgt = scale(gain, SAVINGS);
      var back = net - cgt - balance;
      var opp = home.cash * (Math.pow(1 + i.alt, y) - 1);
      var buyNet = buyOut - back + opp;
      rows.push({y: y, buyNet: buyNet, rentNet: rentOut, value: value, balance: balance, back: back, cgt: cgt, opp: opp});
    }
    var last = rows[N - 1];
    var be = rows.find(function(r){ return r.buyNet <= r.rentNet; });
    return { home: home, pay: pay, rows: rows, last: last, breakeven: be ? be.y : null, maintenance: maintenance };
  }
  // suggested rent: about 5.2 % of the price per year (idealista averages give 4.5–5.5 %, family-home listings often a bit more);
  // the rent follows the price until the visitor types their own rent
  var RENT_YIELD = 0.052;
  var suggestRent = function(price){ return Math.round(price * RENT_YIELD / 12 / 50) * 50; };

  function init(root){
    uniqueRadios(root);
    var form = qs(root, "[data-role=in]"), k = function(name){ return qs(form, '[data-k="' + name + '"]'); };
    var rentEdited = false;
    var dPrice = +root.getAttribute("data-price"), dRent = +root.getAttribute("data-rent");
    if(dPrice > 0) k("price").value = dPrice;
    // an editor-set rent is kept; otherwise the rent is suggested from the price
    if(dRent > 0){ k("rent").value = dRent; rentEdited = true; } else k("rent").value = suggestRent(+k("price").value || 0);
    var snap = {};
    function render(){
      var i = { price: +k("price").value || 0, rent: +k("rent").value || 0, years: +qs(form, "input[data-radio=years]:checked").value, down: (+k("down").value || 30) / 100,
        rate: (+k("rate").value || 0) / 100, growth: (+k("growth").value || 0) / 100, rentg: (+k("rentg").value || 0) / 100, com: +k("com").value || 0, alt: (+k("alt").value || 0) / 100 };
      var r = rentOrBuy(i), L = r.last, diff = L.rentNet - L.buyNet, buyWins = diff > 0;
      snap = Object.assign({}, i, {buyNet: Math.round(L.buyNet), rentNet: Math.round(L.rentNet), breakeven: r.breakeven, buyWins: buyWins, diff: Math.abs(diff)});
      var flat = rentOrBuy(Object.assign({}, i, {growth: 0})).last;
      var html = '<div class="sp-kpis">\
    <div class="sp-kpi big" data-out="main"><div class="v">' + (buyWins ? "Köpa" : "Hyra") + ' är ' + eur(Math.abs(diff)) + ' billigare</div><div class="l">borta efter ' + i.years + ' år, med bostaden såld eller hyran betald</div></div>\
    <div class="sp-kpi" data-out="rent"><div class="v">' + eur(L.rentNet) + '</div><div class="l">hyra, totalt ' + i.years + ' år</div></div>\
    <div class="sp-kpi" data-out="buy"><div class="v">' + eur(L.buyNet) + '</div><div class="l">köpa, netto efter försäljning</div></div>\
    <div class="sp-kpi"><div class="v">' + eur(r.home.cash) + '</div><div class="l">kontant på köpdagen, inkl. ' + eur(r.home.tax + r.home.feeSum) + ' i skatt och avgifter</div></div>\
    <div class="sp-kpi"><div class="v">' + (r.breakeven ? r.breakeven + " år" : "över " + i.years + " år") + '</div><div class="l">' + (r.breakeven ? "innan köpet går om hyran" : "hyran är billigare hela perioden") + '</div></div>\
  </div>';
      html += '<p class="sp-note">Utan prisökning (0 %) blir skillnaden ' + (flat.rentNet - flat.buyNet > 0 ? "köpa " : "hyra ") + eur(Math.abs(flat.rentNet - flat.buyNet)) + ' billigare. Mycket av köpets fördel vilar på antagandet om ' + Math.round(i.growth * 100) + ' % per år.</p>';
      if(i.years <= 3) html += '<p class="sp-note">På kort tid vinner hyran nästan alltid. Köpets fasta kostnader (' + eur(r.home.tax + r.home.feeSum) + ' in, cirka 6 % ut) hinner inte slås ut.</p>';
      html += '<details><summary>År för år</summary><table><tr><td>År</td><td>Hyra, ackumulerat</td><td>Köpa, netto om ni säljer då</td></tr>' + r.rows.map(function(x){ return '<tr><td>' + x.y + '</td><td>' + eur(x.rentNet) + '</td><td>' + eur(x.buyNet) + '</td></tr>'; }).join("") + '</table>\
    <p class="sp-note" style="margin-top:10px">Köpa: kontantinsats, ITP 7 % (2026; Junta de Andalucía har föreslagit 6,75 % från 2027), notarie, registro, advokat och värdering, lån ' + eur(r.home.loan) + ' på 25 år till ' + (i.rate * 100).toFixed(2).replace(".", ",") + ' % (' + eur(r.pay) + ' per månad), bankens paket med hem- och livförsäkring ' + eur(HOME_CFG.linkedProductsMonthly) + ' per månad, comunidad, IBI ' + pct(HOME_CFG.ibiRateOfPrice) + ' av priset och underhåll 1 % per år. Vid försäljning: mäklare 5 % plus moms, reavinstskatt 19–30 % på vinsten efter köpkostnader, kvarvarande lån löses. Plus den avkastning (' + Math.round(i.alt * 100) + ' %) ni gått miste om på kontantinsatsen. Hyra: hyran med ' + Math.round(i.rentg * 100) + ' % höjning per år; depositionen räknas som återbetald. Plusvalía municipal och lånets uppläggning ingår inte.</p></details>';
      qs(root, "[data-role=out]").innerHTML = html;
    }
    k("rent").addEventListener("input", function(){ rentEdited = true; });
    k("price").addEventListener("input", function(){ if(!rentEdited) k("rent").value = suggestRent(+k("price").value || 0); });
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    render();
    bindCapture(root, function(){
      var s = snap;
      var txt = "Pris " + eur(s.price) + ", hyra " + eur(s.rent) + "/mån, " + s.years + " år, kontantinsats " + Math.round(s.down * 100) + " %, ränta " + (s.rate * 100).toFixed(2).replace(".", ",") + " %, prisutveckling " + (s.growth * 100).toLocaleString("sv-SE") + " %/år, hyreshöjning " + (s.rentg * 100).toLocaleString("sv-SE") + " %/år: "
        + (s.buyWins ? "köpa" : "hyra") + " ca " + eur(s.diff) + " billigare (hyra " + eur(s.rentNet) + ", köpa netto " + eur(s.buyNet) + ")"
        + (s.breakeven ? ", köpet går om hyran efter " + s.breakeven + " år." : ", hyran billigare hela perioden.");
      return { solpass_budget: budgetBucket(s.price), solpass_kalkyl: txt };
    }, function(){ return "Tack. Vi har sparat jämförelsen."; });
  }

  function start(){
    qsa(document, ".sp-hyra-eller-kopa").forEach(function(root){
      if(root.getAttribute("data-sp-ready")) return;
      root.setAttribute("data-sp-ready", "1");
      try{ init(root); }catch(e){ if(window.console) console.error("solpass-hyra-eller-kopa", e); }
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

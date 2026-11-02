/* Solpass: Ekonomikalkyl (vad blir kvar varje månad): initialises every .sp-ekonomi on the page independently. No globals, no libraries. */
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

  /* ---------- Andalucía 2026 (state + regional scale) vs art. 93 flat rate, copied from the Solpass demo ---------- */
  var IRPF_STATE = [[12450,.095],[20200,.12],[35200,.15],[60000,.185],[300000,.225],[1e12,.245]];
  var IRPF_AND = [[13000,.095],[21100,.12],[35200,.15],[60000,.185],[1e12,.225]];
  var SAVINGS = [[6000,.19],[50000,.21],[200000,.23],[300000,.27],[1e12,.30]];
  function scale(base, br){ var t = 0, prev = 0; for(var i = 0; i < br.length; i++){ var lim = br[i][0], r = br[i][1]; if(base > prev) t += (Math.min(base, lim) - prev) * r; prev = lim; } return t; }
  // personal minimum: state 5 550 €, Andalusia 5 790 € (Ley 5/2021, art. 23 bis); employee SS 2026: 4,70 + 1,55 + 0,10 + 0,15 %
  var PERSONAL_MIN = 5550, PERSONAL_MIN_AND = 5790, SS_EMPLOYEE = 0.065, SS_MAX_BASE = 5101.2 * 12;
  // solidarity contribution 2026 (cuota de solidaridad), employee share, on salary above the max base:
  // 0,19 % up to 10 % above the base, 0,21 % from 10 to 50 % above, 0,24 % beyond
  function ssSolidarity(salary){
    var ex = Math.max(0, salary - SS_MAX_BASE), b1 = SS_MAX_BASE * 0.1, b2 = SS_MAX_BASE * 0.5;
    return Math.min(ex, b1) * 0.0019 + Math.max(0, Math.min(ex, b2) - b1) * 0.0021 + Math.max(0, ex - b2) * 0.0024;
  }
  function ssEmployee(salary){ return salary > 0 ? Math.min(salary, SS_MAX_BASE) * SS_EMPLOYEE + ssSolidarity(salary) : 0; }
  function irpfStandard(salary){ // employee: SS contributions and the 2 000 € expense deduction, personal minimum as a credit
    if(salary <= 0) return {tax:0, ss:0};
    var ss = ssEmployee(salary);
    var base = Math.max(0, salary - ss - 2000);
    var gross = scale(base, IRPF_STATE) + scale(base, IRPF_AND);
    var credit = scale(Math.min(base, PERSONAL_MIN), IRPF_STATE) + scale(Math.min(base, PERSONAL_MIN_AND), IRPF_AND);
    return {tax: Math.max(0, gross - credit), ss: ss};
  }
  function irpfBeckham(salary){ return {tax: scale(salary, [[600000,.24],[1e12,.47]]), ss: ssEmployee(salary)}; }

  var RATE = 11.3;
  var INCOME_LABEL = { distans: "anställning på distans", spansk: "spansk anställning", bolag: "eget svenskt bolag", pension: "pension eller kapital" };
  var BO_LABEL = { lgh: "lägenhet", hus: "hus/radhus", villa: "villa med pool" };
  var SKOLA_LABEL = { int: "internationell skola", sv: "svensk skola", pub: "spansk kommunal skola" };

  function init(root){
    uniqueRadios(root);
    var form = qs(root, "[data-role=in]"), k = function(name){ return qs(form, '[data-k="' + name + '"]'); };
    var dInc = +root.getAttribute("data-income"), dNet = +root.getAttribute("data-senet");
    if(dInc > 0) k("inc").value = dInc;
    if(dNet > 0) k("senet").value = dNet;
    var snap = {};
    function render(){
      var inc = +k("inc").value || 0;
      var adults = +k("adults").value || 2;
      var income = k("income").value;
      var bo = qs(form, "input[data-radio=bo]:checked").value;
      var kids = Math.max(0, +k("kids").value || 0), skola = k("skola").value, bilar = Math.max(0, +k("bil").value || 0);
      var seNetSek = Math.max(0, +k("senet").value || 0);
      var perEs = inc / RATE / adults;
      var seNet = seNetSek / RATE; // the household's Swedish net today, per month, converted at the same rate
      // pension, dividends and capital are taxed differently from salary; the calculator only models salary
      var salaryIncome = income === "distans" || income === "spansk";
      // same model as the Beckham calculator: IRPF Andalucía and the employee's social security, per person
      var std = irpfStandard(perEs), netStd = perEs - std.tax - std.ss;
      var esNetStd = netStd * adults / 12;
      var beckham = salaryIncome;
      // Beckham for the main earner only; with an equal split the other adult never has a lower base, so uses the standard scale
      var esNetBeck = null;
      if(beckham){ var bk = irpfBeckham(perEs); esNetBeck = (perEs - bk.tax - bk.ss + netStd * (adults - 1)) / 12; }
      var beckNoGain = esNetBeck !== null && esNetBeck <= esNetStd; // below roughly 58 000 € per person the standard scale is lower
      if(beckNoGain) esNetBeck = null;
      var rent = {lgh:1600,hus:2400,villa:3800}[bo], util = {lgh:200,hus:300,villa:450}[bo];
      var school = {int:1100,sv:700,pub:60}[skola] * kids;
      var lines = [["Bostad (hyra)",rent],["El, vatten, internet",util],["Skola",school],["Sjukförsäkring, privat",60*(adults+kids)],["Bil (försäkring, bränsle, skatt)",350*bilar],["Mat och hushåll",1100+250*kids],["Övrigt (fritid, resor hem, kläder)",700]];
      var cost = lines.reduce(function(s,l){ return s + l[1]; }, 0);
      var net = esNetBeck != null ? esNetBeck : esNetStd;
      snap = {inc: inc, adults: adults, income: income, bo: bo, kids: kids, skola: skola, bilar: bilar, cost: Math.round(cost), netSpain: salaryIncome ? Math.round(net) : null, netSweden: Math.round(seNet), seNetSek: seNetSek, surplus: salaryIncome ? Math.round(net - cost) : null, beckham: !!esNetBeck};
      var kpis = salaryIncome ? '\
      <div class="sp-kpi big' + (net - cost < 0 ? " neg" : "") + '" data-out="main"><div class="v">' + eur(net - cost) + '</div><div class="l">kvar per månad efter skatt och levnadskostnad</div></div>\
      <div class="sp-kpi" data-out="net"><div class="v">' + eur(net) + '</div><div class="l">netto i Spanien' + (esNetBeck ? ", med Beckham" : "") + '</div></div>\
      <div class="sp-kpi"><div class="v">' + eur(seNet) + '</div><div class="l">netto i Sverige i dag, ert eget belopp</div></div>\
      <div class="sp-kpi"><div class="v">' + eur(net - seNet) + '</div><div class="l">skillnad per månad, Spanien mot Sverige</div></div>\
      <div class="sp-kpi" data-out="cost"><div class="v">' + eur(cost) + '</div><div class="l">levnadskostnad</div></div>\
      <div class="sp-kpi"><div class="v">' + (esNetBeck ? eurCa(esNetBeck - esNetStd, 100) : "–") + '</div><div class="l">' + (esNetBeck ? "mer per månad tack vare Beckham" : beckNoGain ? "Beckham ger ingen vinst på den här inkomsten" : "Beckham gäller inte er inkomst") + '</div></div>' : '\
      <div class="sp-kpi big" data-out="main"><div class="v">' + eur(cost) + '</div><div class="l">levnadskostnad per månad</div></div>\
      <div class="sp-kpi"><div class="v">' + eur(seNet) + '</div><div class="l">netto i Sverige i dag, ert eget belopp</div></div>';
      qs(root, "[data-role=out]").innerHTML = '\
    <div class="sp-kpis">' + kpis + '\
    </div>\
    ' + (salaryIncome ? "" : '<p class="sp-note">Pension, utdelning och kapital beskattas på andra sätt än lön. Den här kalkylen räknar bara på lön. Låt en skatterådgivare räkna på er situation.</p>') + '\
    <details><summary>Så räknade vi</summary>\
      <table>' + lines.map(function(l){ return '<tr><td>' + l[0] + '</td><td>' + eur(l[1]) + '</td></tr>'; }).join("") + '<tr><td><b>Summa</b></td><td><b>' + eur(cost) + '</b></td></tr></table>\
      <p class="sp-note" style="margin-top:10px">Sverige: det nettobelopp ni själva anger, omräknat med kursen ' + RATE.toLocaleString("sv-SE") + ' SEK/EUR. Spanien: IRPF för Andalusien och arbetstagarens sociala avgifter, som i Beckham-kalkylen. Inkomsten delad lika mellan de vuxna. Med Beckham räknar vi regimen för en vuxen; den andra beskattas enligt vanlig skala. Utdelning, kapital och pension beskattas annorlunda och kräver rådgivare. Kostnaderna är typiska nivåer för Marbella–Estepona hösten 2026. Skolan räknas som 700 € per barn och månad för svensk skola och 1 100 € för internationell skola. Svenska Skolan Costa del Sol kostar 8 050–8 500 € per år 2026/27 (F–9), inklusive mat och läromedel, plus inskrivning och medlemsavgift.</p>\
    </details>';
    }
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    render();
    bindCapture(root, function(){
      var s = snap, nf = function(n){ return Math.round(n).toLocaleString("sv-SE"); };
      var txt = "Inkomst " + nf(s.inc) + " kr/år (" + INCOME_LABEL[s.income] + "), " + s.adults + " vuxna, " + s.kids + " barn (" + SKOLA_LABEL[s.skola] + "), " + BO_LABEL[s.bo] + ", " + s.bilar + " bil" + (s.bilar === 1 ? "" : "ar") + ", netto i Sverige " + nf(s.seNetSek) + " kr/mån. ";
      txt += s.surplus !== null
        ? "Netto i Spanien " + eur(s.netSpain) + "/mån" + (s.beckham ? " med Beckham" : "") + ", levnadskostnad " + eur(s.cost) + "/mån, kvar " + eur(s.surplus) + "/mån."
        : "Levnadskostnad " + eur(s.cost) + "/mån (skatt på pension, kapital och bolag räknas inte här).";
      return { solpass_vuxna: s.adults, solpass_barn: s.kids, solpass_inkomsttyp: s.income, solpass_kalkyl: txt };
    }, function(){ return "Tack. Vi har sparat kalkylen."; });
  }

  function start(){
    qsa(document, ".sp-ekonomi").forEach(function(root){
      if(root.getAttribute("data-sp-ready")) return;
      root.setAttribute("data-sp-ready", "1");
      try{ init(root); }catch(e){ if(window.console) console.error("solpass-ekonomi", e); }
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

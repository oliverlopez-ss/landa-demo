/* Solpass: Beckham-kalkyl: initialises every .sp-beckham on the page independently. No globals, no libraries. */
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

  var WHY_LABEL = { distans: "distans för arbetsgivare utanför Spanien", spansk: "spansk anställning", vd: "styrelseledamot/VD", egen: "egenföretagare", pension: "pension eller kapital" };
  var WHY_INKOMST = { distans: "distans", spansk: "spansk", vd: "bolag", egen: "bolag", pension: "pension" };
  function numAttr(root, name){ var v = (root.getAttribute(name) || "").trim(); return v !== "" && isFinite(+v) && +v >= 0 ? +v : null; }

  function init(root){
    uniqueRadios(root);
    var form = qs(root, "[data-role=in]"), k = function(name){ return qs(form, '[data-k="' + name + '"]'); };
    var d1 = numAttr(root, "data-s1"), d2 = numAttr(root, "data-s2");
    if(d1 !== null) k("s1").value = d1;
    if(d2 !== null) k("s2").value = d2;
    var snap = {};
    function render(){
      var s1 = +k("s1").value || 0, s2 = +k("s2").value || 0, cap = +k("cap").value || 0;
      var why = k("why").value, prev = qs(form, "input[data-radio=prev]:checked").value;
      var eligible = prev === "nej" && ["distans","spansk","vd"].indexOf(why) >= 0;
      var std1 = irpfStandard(s1), std2 = irpfStandard(s2), bk1 = irpfBeckham(s1), bk2 = irpfBeckham(s2);
      // capital is split equally when both have a salary; under Beckham the Swedish capital is not taxed in Spain
      var n = s2 > 0 ? 2 : 1, capHalf = scale(cap / n, SAVINGS), capStd = capHalf * n;
      var hi = s2 > s1 ? 2 : 1; // the higher earner is the main person in the regime
      var stdL = hi === 1 ? std2 : std1, bkH = hi === 1 ? bk1 : bk2;
      // A: both standard IRPF. B: the higher earner in Beckham, the other standard. C: both in Beckham (only if person 2 has a salary)
      var scen = [{id:"A", tax: std1.tax + std2.tax + capStd}];
      scen.push({id:"B", tax: bkH.tax + stdL.tax + (n - 1) * capHalf});
      if(s2 > 0) scen.push({id:"C", tax: bk1.tax + bk2.tax});
      var best = scen.reduce(function(a, b){ return b.tax < a.tax ? b : a; });
      var stdTax = scen[0].tax, bkTax = best.tax;
      var lo = hi === 1 ? 2 : 1;
      var bestTxt = best.id === "A" ? "vanlig skatt för " + (s2 > 0 ? "båda" : "person 1")
        : best.id === "C" ? "båda i Beckham"
        : s2 > 0 ? "person " + hi + " i Beckham, person " + lo + " vanlig skatt" : "person 1 i Beckham";
      var saving = stdTax - bkTax, years = 6;
      var salary = s1 + s2;
      snap = {s1: s1, s2: s2, cap: cap, why: why, prev: prev, eligible: eligible, stdTax: Math.round(stdTax), bkTax: Math.round(bkTax), saving: Math.round(saving), scenario: best.id, bestTxt: bestTxt};
      var why_txt = "";
      if(prev === "ja") why_txt = "Ni har bott i Spanien under de senaste fem åren. Då går regimen inte att söka, oavsett inkomst.";
      else if(why === "egen") why_txt = "Egen verksamhet som egenföretagare räknas inte, om den inte godkänns som entreprenörsverksamhet (Ley 14/2013) eller är högkvalificerat arbete för startups. Ett alternativ är att driva verksamheten i ett bolag där ni är styrelseledamot. Fråga rådgivaren innan ni flyttar.";
      else if(why === "pension") why_txt = "Regimen kräver en flytt på grund av arbete. Pension och kapital kvalificerar inte. För er handlar frågan i stället om SINK, pensionsbeskattning och förmögenhet, som beskattas i Andalusien i samspel med statens solidaritetsskatt: efter ett grundavdrag på 700 000 € är de första 3 miljonerna i skatteunderlag skattefria. Deklaration krävs över 2 miljoner euro i tillgångar. Reglerna för 2026 är inte slutligt bekräftade.";
      var eff = salary ? Math.round(stdTax / (salary + cap) * 100) : 0, effBk = salary ? Math.round(bkTax / (salary + cap) * 100) : 0;
      var html = "";
      if(!eligible){
        html += '<div class="sp-kpis"><div class="sp-kpi big neg" data-out="main"><div class="v">Kvalificerar troligen inte</div><div class="l">' + why_txt + '</div></div>\
      <div class="sp-kpi" data-out="std"><div class="v">' + eurCa(stdTax) + '</div><div class="l">spansk skatt per år med vanlig IRPF</div></div>\
      <div class="sp-kpi"><div class="v">' + eff + ' %</div><div class="l">effektiv skatt på hushållets inkomst</div></div></div>';
      } else {
        var pos = saving > 0;
        html += '<div class="sp-kpis"><div class="sp-kpi big' + (pos ? "" : " neg") + '" data-out="main"><div class="v">' + (pos ? eurCa(saving).replace("ca ","ca +") : eurCa(saving)) + '</div><div class="l">' + (pos ? "lägre spansk skatt per år med Beckham" : "Beckham ger ingen vinst på den här inkomsten. Under ungefär 58 000 € per person är den vanliga skalan lägre.") + '</div></div>\
      <div class="sp-kpi" data-out="std"><div class="v">' + eurCa(stdTax) + '</div><div class="l">spansk skatt per år, vanlig IRPF (' + eff + ' %)</div></div>\
      <div class="sp-kpi" data-out="bk"><div class="v">' + eurCa(bkTax) + '</div><div class="l">spansk skatt per år, med Beckham (' + effBk + ' %)</div></div>\
      <div class="sp-kpi"><div class="v">' + eurCa(Math.max(0, saving) / 12, 100) + '</div><div class="l">mer kvar per månad</div></div>\
      <div class="sp-kpi"><div class="v">' + eurCa(Math.max(0, saving) * years) + '</div><div class="l">över sex år, om inkomsterna är oförändrade</div></div></div>\
    <p class="sp-note" data-out="best"><b>Bäst: ' + bestTxt + '.</b> Regimen väljs per person.</p>';
        if(s2 > 0 && hi === 2) html += '<p class="sp-note">Person 2 tjänar mest och blir huvudperson i regimen.</p>';
        if(best.id === "C") html += '<p class="sp-note">Båda i Beckham förutsätter att person ' + lo + ' följer med som familjemedlem, vilket bara går om skatteunderlaget är lägre än huvudpersonens, varje år. Annars behöver person ' + lo + ' ett eget kvalificerande skäl, till exempel ett eget arbete som flytten sker för.</p>';
        if(cap > 0) html += '<p class="sp-note">Kapitalinkomsten från Sverige (' + eur(cap) + ') beskattas inte i Spanien under Beckham, men Sverige kan ta ut kupongskatt eller tillämpa tioårsregeln. Den delen av vinsten (' + eurCa(capStd) + ' per år) ska bekräftas av rådgivaren.</p>';
        if(why === "vd") html += '<p class="sp-note">Som bolagsledare: äger ni 25 % eller mer av ett bolag som mest förvaltar kapital gäller inte regimen. Ett rörelsedrivande bolag går bra.</p>';
      }
      html += '<details><summary>Så räknar vi</summary><table>\
    <tr><td>Person 1, vanlig IRPF efter sociala avgifter ' + eurCa(std1.ss) + '</td><td>' + eurCa(std1.tax) + '</td></tr>\
    <tr><td>Person 1, Beckham 24 %</td><td>' + eurCa(bk1.tax) + '</td></tr>\
    ' + (s2 > 0 ? '<tr><td>Person 2, vanlig IRPF efter sociala avgifter ' + eurCa(std2.ss) + '</td><td>' + eurCa(std2.tax) + '</td></tr><tr><td>Person 2, Beckham 24 %</td><td>' + eurCa(bk2.tax) + '</td></tr>' : "") + '\
    ' + (cap > 0 ? '<tr><td>Kapital från Sverige, spansk sparskala 19–30 %</td><td>' + eurCa(capStd) + '</td></tr><tr><td>Kapital från Sverige under Beckham</td><td>0 €</td></tr>' : "") + '\
  </table>\
  <p class="sp-note" style="margin-top:10px">Statlig skala 9,5–24,5 % plus Andalusiens skala 9,5–22,5 % för 2026, grundavdrag 5 550 € i den statliga skalan och 5 790 € i den andalusiska, schablonavdrag 2 000 € och arbetstagarens sociala avgifter 6,5 % upp till maxbasen. Individuell beskattning, inga andra avdrag. Från lönen över maxbasen tillkommer solidaritetsavgiften för 2026 (cuota de solidaridad), arbetstagarens del 0,19 % upp till 10 % över maxbasen, 0,21 % mellan 10 och 50 % och 0,24 % därutöver. Vi jämför tre upplägg: båda med vanlig skatt, den som tjänar mest i Beckham och den andra med vanlig skatt, och båda i Beckham. Med Beckham visar vi det upplägg som ger lägst skatt. Kapitalinkomsten delas lika när båda har lön. Beckham: 24 % på bruttolönen utan avdrag, 47 % över 600 000 €. Sociala avgifter betalas i båda fallen om ni är anslutna till spansk socialförsäkring. Kalkylen visar bara spansk skatt; svensk skatt på svenska inkomster tillkommer och kräver rådgivare.</p></details>';
      qs(root, "[data-role=out]").innerHTML = html;
    }
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    render();
    bindCapture(root, function(){
      var s = snap;
      var txt = "Lön person 1 " + eur(s.s1) + "/år, person 2 " + eur(s.s2) + "/år, kapital från Sverige " + eur(s.cap) + "/år, skäl: " + WHY_LABEL[s.why] + ", bott i Spanien senaste fem åren: " + s.prev + ". ";
      txt += s.eligible
        ? "Vanlig IRPF " + eurCa(s.stdTax) + "/år, med Beckham " + eurCa(s.bkTax) + "/år, skillnad " + eurCa(s.saving) + "/år. Bäst: " + s.bestTxt + "."
        : "Kvalificerar troligen inte. Vanlig IRPF " + eurCa(s.stdTax) + "/år.";
      return { solpass_inkomsttyp: WHY_INKOMST[s.why], solpass_vuxna: s.s2 > 0 ? 2 : null, solpass_kalkyl: txt };
    }, function(email){ return "Tack. Vi har sparat kalkylen och hör av oss till " + esc(email) + " när vi har en skatterådgivare som kan både Sverige och Spanien."; });
  }

  function start(){
    qsa(document, ".sp-beckham").forEach(function(root){
      if(root.getAttribute("data-sp-ready")) return;
      root.setAttribute("data-sp-ready", "1");
      try{ init(root); }catch(e){ if(window.console) console.error("solpass-beckham", e); }
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* Solpass flyttplan: wizard + generated moving plan. Ported from the Solpass demo (index.html).
   TASKS, PHASES, STEPS and LABELS are copied verbatim from the demo (fact-checked content). */
(function(){
"use strict";

/* ---------- content (verbatim from the demo) ---------- */
const TASKS = [
 {ph:1,off:-150,t:"Boka ett skatte- och bolagsmöte med rådgivare som kan Sverige och Spanien",d:"Avgör flyttmånad, bolagsupplägg, Beckham-regim och vad som ska säljas eller behållas i Sverige. Detta styr allt annat.",who:"skatt",c:a=>a.inkomst!=="spansk"},
 {ph:1,off:-150,t:"Planera ansökan om Beckham-regimen",d:"Ansökan ska in inom sex månader från startdatumet i registreringen hos Seguridad Social, eller i A1-intyget om ni stannar i svensk socialförsäkring. Kräver att ni inte varit residenta i Spanien de senaste fem åren.",who:"skatt",c:a=>a.inkomst==="spansk"||a.inkomst==="distans"},
 {ph:1,off:-180,t:"Välj skolform och ställ barnen i kö",d:"Internationella skolor har köer, svenska skolorna tar emot i mån av plats, kommunal skola söks i mars. Skolvalet styr var ni ska bo.",who:"skola-int",c:a=>a.familj==="barn"},
 {ph:1,off:-150,t:"Bestäm flyttdatum med hänsyn till skatteresidens",d:"En flytt under första halvåret kan innebära spansk skatteresidens redan under flyttåret. En senare flytt kan innebära skatteresidens först året därpå, men det beror på årets sammanlagda vistelsedagar, er ekonomiska och familjemässiga anknytning och skatteavtalet med Sverige. Bestäm datum tillsammans med rådgivaren.",who:"skatt",c:()=>true},
 {ph:1,off:-120,t:"Besök området och välj ett par delområden",d:"Prova skolvägen, pendlingen till flygplatsen och vardagen innan ni bestämmer er. Hyr gärna en månad på plats.",who:"natverk",c:a=>a.region==="costa"},
 {ph:1,off:-180,t:"Bestäm om bilen ska säljas i Sverige",d:"Omregistrering kostar tid och pengar; för de flesta är det bättre att sälja och köpa här. Vill ni ta med den skattefritt måste ni ha använt den i minst sex månader före flytten och inte sälja den inom tolv månader i Spanien. Dessutom gäller att ni ska ha bott utanför Spanien minst tolv månader i följd före flytten, och bilen ska ha köpts med vanlig skatt i Sverige.",who:"dgt",c:a=>a.bil==="med"},

 {ph:2,off:-90,t:"Ansök om NIE om ni hyr eller köper före flytten",d:"Behövs bara om ni skriver kontrakt innan ni flyttat. Söks via spanska konsulatet i Stockholm eller hos Policía Nacional med blankett EX-15. Flyttar ni först får ni NIE när ni registrerar er som residenta.",who:"policia",c:()=>true},
 {ph:2,off:-45,t:"Teckna privat sjukförsäkring om ni inte arbetar",d:"Kraven för EU-registreringen beror på er faktiska arbets- och försörjningssituation i Spanien. Arbetar ni som anställd eller egenföretagare räcker normalt anställningsbevis eller bevis på egenföretagande. Distansarbete från Spanien åt en svensk arbetsgivare behandlas inte automatiskt som att ni saknar arbete här; kontrollera vilket anställningsunderlag och socialförsäkringsintyg som krävs. Arbetar ni inte alls krävs tillräckliga medel och en sjukförsäkring som motsvarar den offentliga vården. Försäkringen täcker också glappet tills ni eventuellt är inne i Seguridad Social.",who:"ss",c:a=>a.inkomst==="pension"},
 {ph:2,off:-14,t:"Anmäl flytt till Skatteverket och Försäkringskassan",d:"Minst en vecka före avresan. Begär SINK om svensk inkomst kvarstår. Be om skriftlig bedömning av väsentlig anknytning om ni behåller bostad eller bolag.",who:"skv",c:()=>true},
 {ph:2,off:-60,t:"Säkra bostad med långtidskontrakt",d:"Välj ett avtal som motsvarar hur bostaden faktiskt ska användas. För padrón bedöms var ni verkligen bor, inte bara kontraktets rubrik. Ett tillfälligt avtal kan kräva mer underlag eller kontroll från kommunen. Räkna med deposition plus extra garanti.",who:"maklare",c:a=>a.bostad==="hyra"},
 {ph:2,off:-90,t:"Anlita fastighetsadvokat före reservation",d:"Lagfart, skulder, bygglov och förening kontrolleras innan arras. Budgetera runt 8–9 % i skatter och avgifter ovanpå priset för en begagnad bostad, och 12–13 % för nyproduktion.",who:"advokat",c:a=>a.bostad==="kopa"},
 {ph:1,off:-150,t:"Prata med någon som köper åt er, inte åt säljaren",d:"På kusten företräder mäklaren nästan alltid säljaren. En köparrådgivare söker bland alla objekt, granskar affären med er advokat och förhandlar för er. Läs mer i bostadsguiden.",who:"maklare",c:a=>a.bostad==="kopa"},
 {ph:2,off:-60,t:"Öppna spanskt bankkonto",d:"Behövs för hyra, el, skola och bil. Kan göras som icke-resident med NIE och pass.",who:"bank",c:()=>true},
 {ph:2,off:-45,t:"Boka flyttfirma och ordna EU-pass för husdjur",d:"2–4 veckors ledtid för bohag. Husdjur: mikrochip, EU-pass och giltig rabiesvaccination minst 21 dagar före resan.",who:"flytt",c:()=>true},
 {ph:2,off:-30,t:"Samla skolpapper",d:"Betyg, vaccinationsintyg och intyg från svensk skola, gärna med engelsk översättning.",who:"skola-sv",c:a=>a.familj==="barn"},

 {ph:3,off:7,t:"Skriv er i kommunen (empadronamiento)",d:"Ayuntamiento, med hyreskontrakt eller lagfart, pass och NIE. Gör det första veckan; det låser upp skola, vård och bil.",who:"ayto",c:()=>true},
 {ph:3,off:35,t:"Registrera er som residenta (EU-intyg)",d:"Blankett EX-18 hos Policía Nacional, personligen och inom tre månader efter ankomst. Kraven för EU-registreringen beror på er faktiska arbets- och försörjningssituation i Spanien. Arbetar ni som anställd eller egenföretagare räcker normalt anställningsbevis eller bevis på egenföretagande. Distansarbete från Spanien åt en svensk arbetsgivare behandlas inte automatiskt som att ni saknar arbete här; kontrollera vilket anställningsunderlag och socialförsäkringsintyg som krävs. Arbetar ni inte alls krävs tillräckliga medel och en sjukförsäkring som motsvarar den offentliga vården. NIE ingår i intyget.",who:"policia",c:()=>true},
 {ph:3,off:21,t:"Skaffa digitalt certifikat",d:"FNMT, normalt med ett besök på ett registreringskontor; videoidentifiering finns för vissa. Därefter sköter ni skatt, DGT och intyg hemifrån.",who:"fnmt",c:()=>true},
 {ph:3,off:14,t:"Registrera er hos Seguridad Social",d:"Socialförsäkringsnummer och tillgång till vårdcentral. Numret (NUSS) och registreringen av arbetet (alta) är olika steg. Anställda och egenföretagare ska registreras innan arbetet börjar. Med spansk anställning sköter arbetsgivaren registreringen.",who:"ss",c:a=>a.inkomst==="spansk"},
 {ph:3,off:14,t:"Skriv in barnen i skolan",d:"Med padrón, NIE, pass och skolpapper. Kommer ni mitt i läsåret till kommunal skola ansöker ni direkt hos skolan ni önskar; finns ingen plats anvisar Junta de Andalucías antagningskommission (comisión de garantías de admisión) en annan skola.",who:"skola-pub",c:a=>a.familj==="barn"},
 {ph:3,off:30,t:"Registrera er hos spanska skatteverket (Modelo 030)",d:"Anmäler skatterättslig hemvist och adress. Gestorn gör det på tio minuter med ert certifikat.",who:"aeat",c:()=>true},
 {ph:3,off:21,t:"Omregistrera bilen",d:"Registrering och befrielse från registreringsskatt ska sökas inom 60 dagar från att bilen kom till Spanien, så vänta inte på padrón. ITV och dokumentation, ofta 4–8 veckor via gestor.",who:"dgt",c:a=>a.bil==="med"},
 {ph:3,off:30,t:"Köp bil i Spanien",d:"Kräver NIE och padrón. Begagnat via handlare ger garanti; privatköp kräver att ni själva sköter ägarbytet hos DGT.",who:"dgt",c:a=>a.bil==="kop"},

 {ph:4,fixed:"m720",t:"Lämna Modelo 720 senast 31 mars",d:"Om ni har tillgångar utomlands över 50 000 € per kategori och inte beskattas enligt Beckham. Lämnas året efter det första året ni är skatterättsligt bosatta. Kryptotillgångar hos utländska plattformar deklareras separat på Modelo 721. En ny 720 krävs också om en redovisad tillgång säljs eller avslutas. Datumet i planen utgår från det första skatteresidensåret ni anger ovanför planen; stäm av med rådgivaren.",who:"aeat",c:()=>true},
 {ph:4,fixed:"renta",t:"Gör första spanska deklarationen med rådgivare",d:"Renta lämnas april–juni året efter inkomståret. Med Beckham lämnas Modelo 151 i stället för vanlig Renta. Första året ska svenska inkomster, avräkning och bolagsfrågor hanteras rätt.",who:"skatt",c:()=>true},
 {ph:4,off:180,t:"Se över ISK, pension och eventuella svenska lån",d:"ISK-fördelen försvinner i Spanien. Strukturera om med rådgivaren när ni vet att ni stannar.",who:"skatt",c:a=>a.inkomst!=="spansk"},
 {ph:4,off:700,t:"Håll koll på körkortets giltighet",d:"Svenskt körkort gäller i Spanien så länge det är giltigt, och byte är frivilligt. När det går ut förnyar ni det hos DGT, eftersom ni då bor i Spanien.",who:"dgt",c:a=>a.bil!=="ingen"},
 {ph:4,off:90,t:"Gå med i ett svenskt nätverk på kusten",d:"Fritidsaktiviteter för barnen, hantverkare, läkare och vänner. Det är här vardagen faktiskt löser sig.",who:"natverk",c:()=>true}
];
const PHASES = {1:"Beslutet",2:"Före flytten",3:"Första månaden",4:"Första året"};
const PHASE_WHEN = {1:"6 månader före och tidigare",2:"3 månader före till avresa",3:"vecka 1–6 på plats",4:"3–15 månader efter landning"};

const STEPS = [
  {key:"movedate", type:"date", q:"När planerar ni att flytta?", help:"Ett ungefärligt datum räcker. Planen räknar baklänges från det."},
  {key:"region", q:"Vart flyttar ni?", opts:[["costa","Costa del Sol","Marbella, Estepona, Fuengirola och kusten runt"],["annat","Annan del av Spanien","Planen fungerar, men vi tar in partners på kusten först"]]},
  {key:"familj", q:"Vilka flyttar?", opts:[["barn","Vuxna med barn","Skola och padrón kommer med i planen"],["par","Par utan barn",""],["solo","En person",""]]},
  {key:"inkomst", q:"Hur försörjer ni er?", opts:[["distans","Anställd på distans","Åt svensk eller utländsk arbetsgivare"],["bolag","Eget bolag i Sverige","Den dyraste frågan att få fel"],["spansk","Spansk anställning",""],["pension","Pension eller kapital",""]]},
  {key:"bostad", q:"Hyra eller köpa?", opts:[["hyra","Hyra först","Det vi rekommenderar om ni inte känner området"],["kopa","Köpa direkt","Med egen advokat före handpenningen"]]},
  {key:"budget", when: a => a.bostad === "kopa", q:"Ungefär vilken prisnivå tittar ni på?", help:"Frivilligt. Det gör att vi kan visa rätt områden och siffror.", opts:[["k1","Under 300 000 €",""],["k2","300 000–600 000 €",""],["k3","600 000 €–1 miljon",""],["k4","Över 1 miljon €",""],["vet","Vet inte än",""]]},
  {key:"budget", when: a => a.bostad !== "kopa", q:"Ungefär vad vill ni hyra för?", help:"Frivilligt. Per månad, för en bostad som passar familjen.", opts:[["h1","Under 1 500 € i månaden",""],["h2","1 500–2 500 €",""],["h3","2 500–4 000 €",""],["h4","Över 4 000 €",""],["vet","Vet inte än",""]]},
  {key:"kopwhen", when: a => a.bostad === "kopa", q:"När vill ni ha köpt?", opts:[["6m","Inom sex månader",""],["12m","Inom ett år",""],["later","Om mer än ett år",""],["hyrforst","Vi hyr nog först och ser",""]]},
  {key:"bil", q:"Hur gör ni med bil?", opts:[["med","Tar med svensk bil","Ska omregistreras i Spanien"],["kop","Köper i Spanien",""],["ingen","Ingen bil",""]]},
  {key:"email", type:"email", q:"Vill ni spara er plan?", help:"Vi sparar er plan. Inget annat."}
];

const DEFAULTS = {region:"costa",familj:"barn",inkomst:"distans",bostad:"hyra",bil:"med"};
const LABELS = {region:{costa:"Costa del Sol",annat:"Annan region"},familj:{barn:"med barn",par:"par",solo:"en person"},inkomst:{distans:"distansanställd",bolag:"eget svenskt AB",spansk:"spansk anställning",pension:"pension/kapital"},bostad:{hyra:"hyra först",kopa:"köpa"},bil:{med:"tar med bil",kop:"köper bil",ingen:"ingen bil"},budget:{k1:"under 300 000 €",k2:"300–600 000 €",k3:"600 000–1 milj. €",k4:"över 1 milj. €",h1:"hyra under 1 500 €",h2:"hyra 1 500–2 500 €",h3:"hyra 2 500–4 000 €",h4:"hyra över 4 000 €",vet:"budget ej satt"},kopwhen:{"6m":"köp inom 6 mån","12m":"köp inom ett år",later:"köp om mer än ett år",hyrforst:"hyr först"}};

/* contacts referenced by TASKS[].who: [short label, official link or null for partner roles] */
const WHO = { "skatt": [ "Skatterådgivare Sverige–Spanien", null ], "skola-int": [ "Internationella skolor på kusten", null ], "natverk": [ "Svenska familjer på kusten", null ], "dgt": [ "DGT", "https://www.dgt.es/nuestros-servicios/tu-vehiculo/quieres-traer-o-llevarte-un-vehiculo-del-extranjero/matricular-un-vehiculo-proveniente-de-la-ue/" ], "policia": [ "Policía Nacional", "https://sede.policia.gob.es/portalCiudadano/_es/tramites_extranjeria_tramite_certificadoregistro_ciudadanoue.php" ], "ss": [ "Seguridad Social", "https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Altas%2C+bajas+y+modificaciones/Altas+y+afiliacion+de+trabajadores/Solicitar+el+numero+de+la+Seguridad+Social" ], "skv": [ "Skatteverket", "https://www.skatteverket.se/privat/folkbokforing/flyttafransverige.4.18e1b10334ebe8bc80001591.html" ], "maklare": [ "Mäklare som arbetar med svenska köpare", null ], "advokat": [ "Fastighetsadvokat", null ], "bank": [ "Bank med engelsk service", null ], "flytt": [ "Flyttfirma Sverige–Spanien", null ], "skola-sv": [ "Svenska skolan Marbella", "https://www.svenskaskolanmarbella.com" ], "ayto": [ "Ayuntamiento", "https://ayuntamiento.marbella.es/temas/padron-de-habitantes.html" ], "fnmt": [ "FNMT", "https://www.sede.fnmt.gob.es/certificados/persona-fisica" ], "skola-pub": [ "Spansk kommunal skola", "https://www.juntadeandalucia.es/educacion/portales/web/escolarizacion/infantil-a-bachillerato" ], "aeat": [ "Agencia Tributaria", "https://sede.agenciatributaria.gob.es/Sede/no-residentes/residencia-personas-fisicas-juridicas/persona-fisica-residente-espana.html" ] };
/* partner roles that have their own section on the partner page (anchor ids) */
const PARTNER_ANCHOR = {gestor:"gestor", skatt:"skatt", advokat:"advokat", bank:"bank", flytt:"flytt"};

const KEY = "solpass.flyttplan.v1";
const MONTHS = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const JSPDF_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
let jspdfLoading = null;

function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const fmt = d => d.toLocaleDateString("sv-SE", {day:"numeric", month:"short", year:"numeric"});
const taskKey = t => t.t;

function loadState(){
  const base = {answers:{}, movedate:"", hushall:"", email:"", done:{}, resYear:""};
  try{
    const s = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if(s && typeof s === "object"){
      Object.assign(base, s);
      if(!base.answers || typeof base.answers !== "object") base.answers = {};
      if(!base.done || typeof base.done !== "object") base.done = {};
    }
  }catch(e){}
  return base;
}

function loadJsPDF(){
  if(window.jspdf) return Promise.resolve(window.jspdf);
  if(!jspdfLoading) jspdfLoading = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = JSPDF_SRC;
    sc.onload = () => window.jspdf ? res(window.jspdf) : rej(new Error("jspdf"));
    sc.onerror = () => { jspdfLoading = null; rej(new Error("jspdf")); };
    document.head.appendChild(sc);
  });
  return jspdfLoading;
}

function hutk(){
  const m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function init(root){
  if(root.getAttribute("data-fp-ready")) return;
  root.setAttribute("data-fp-ready", "1");

  const cfg = {
    portal: (root.getAttribute("data-portal") || "").trim(),
    form: (root.getAttribute("data-form") || "").trim(),
    source: (root.getAttribute("data-source") || "").trim() || "plan",
    nl: (root.getAttribute("data-nl") || "").trim(),
    consent: (root.getAttribute("data-consent") || "").trim()
  };
  // like the demo: straight to the first question unless the page wants the intro screen
  const skipIntro = root.getAttribute("data-skip-intro") === "true";
  const urls = {partners:"/partners", dokument:"/dokument", skatt:"/skatt", bostad:"/bostad/bolanekalkyl"};
  try{
    const u = JSON.parse(root.getAttribute("data-urls") || "{}");
    for(const k in urls) if(u && typeof u[k] === "string" && u[k].trim()) urls[k] = u[k].trim();
  }catch(e){}

  const q = s => root.querySelector(s);
  const qa = s => Array.prototype.slice.call(root.querySelectorAll(s));
  const views = {intro: q("[data-fp-view=intro]"), wizard: q("[data-fp-view=wizard]"), plan: q("[data-fp-view=plan]")};
  const wz = q("[data-fp-wz]"), planEl = q("[data-fp-plan]");

  let state = loadState();
  let wzStep = 0;
  let notice = null;       // {ok:true} or {fail:true} after the email step
  let pendingNl = false;   // newsletter choice kept for a retry

  function save(){ try{ window.localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
  const answers = () => Object.assign({}, DEFAULTS, state.answers);
  const hasPlan = () => Object.keys(state.answers).length >= 5;

  /* ---------- dates (same logic as the demo) ---------- */
  // preliminary first Spanish tax-residence year: a move before July makes the move year the residency year; the user can change it
  function defaultResYear(){ const m = new Date(state.movedate + "T12:00:00"); return m.getMonth() < 6 ? m.getFullYear() : m.getFullYear() + 1; }
  function resYear(){ return +state.resYear || defaultResYear(); }
  function dueFor(t){
    if(!state.movedate) return null;
    const m = new Date(state.movedate + "T12:00:00");
    if(isNaN(m)) return null;
    if(t.fixed){
      const residentYear = resYear();
      return t.fixed === "m720" ? new Date(residentYear + 1, 2, 31, 12) : new Date(residentYear + 1, 5, 30, 12);
    }
    const d = new Date(m); d.setDate(d.getDate() + t.off); return d;
  }

  function show(v){
    for(const k in views) if(views[k]) views[k].hidden = k !== v;
    const top = root.getBoundingClientRect().top;
    if(top < 0 && root.scrollIntoView) root.scrollIntoView({block:"start"});
  }

  /* ---------- who ---------- */
  function shortWho(id){ return WHO[id] ? WHO[id][0] : id; }
  function whoHtml(id, a){
    const c = WHO[id]; if(!c) return "";
    if(c[1]) return `<a class="fp-who" href="${esc(c[1])}" target="_blank" rel="noopener">${esc(c[0])}</a>`;
    const anchor = id === "maklare" ? (a.bostad === "kopa" ? "kopmaklare" : "hyresmaklare") : PARTNER_ANCHOR[id];
    if(anchor) return `<a class="fp-who" href="${esc(urls.partners)}#${anchor}">${esc(c[0])}</a>`;
    return `<span class="fp-who">${esc(c[0])}</span>`;
  }

  /* ---------- wizard ---------- */
  const wzSteps = () => STEPS.filter(x => !x.when || x.when(state.answers));
  function renderWizard(){
    const steps = wzSteps();
    if(wzStep >= steps.length) wzStep = steps.length - 1;
    if(wzStep < 0) wzStep = 0;
    const s = steps[wzStep], pct = Math.round(wzStep / steps.length * 100);
    let body = "";
    if(s.type === "date"){
      body = `<label class="fp-field"><span>Flyttdag</span><input type="date" data-fp-date value="${esc(state.movedate)}"></label>
        <div class="fp-row"><button type="button" class="fp-btn fp-btn-sea" data-fp-act="next">Nästa</button><button type="button" class="fp-linkbtn" data-fp-act="skipdate">Vi vet inte än</button></div>`;
    } else if(s.type === "email"){
      body = `<div class="fp-grid2"><label class="fp-field"><span>Namn på hushållet (valfritt)</span><input type="text" data-fp-name value="${esc(state.hushall)}" placeholder="Familjen Andersson"></label>
        <label class="fp-field"><span>E-post</span><input type="email" data-fp-email value="${esc(state.email)}" placeholder="din@epost.se" autocomplete="email"></label></div>
        <p class="fp-err" data-fp-err hidden></p>
        <label class="fp-nl"><input type="checkbox" data-fp-nlbox> Skicka mig Flyttbrevet: nya regler och deadlines, en gång i månaden</label>
        ${cfg.consent ? `<p class="fp-consent">${esc(cfg.consent)}</p>` : ""}
        <div class="fp-row"><button type="button" class="fp-btn fp-btn-sun" data-fp-act="done">Visa vår plan</button><button type="button" class="fp-linkbtn" data-fp-act="skipmail">Visa planen utan att spara</button></div>`;
    } else {
      body = `<div class="fp-opts">${s.opts.map(([v,l,sub]) => `<button type="button" class="fp-opt${state.answers[s.key] === v ? " sel" : ""}" data-v="${esc(v)}"><span>${l}${sub ? `<small>${sub}</small>` : ""}</span></button>`).join("")}</div>`;
    }
    wz.innerHTML = `
      <div class="fp-wz-top"><span>Fråga ${wzStep + 1} av ${steps.length}</span>${wzStep > 0 ? `<button type="button" class="fp-linkbtn" data-fp-act="back">Tillbaka</button>` : `<button type="button" class="fp-linkbtn" data-fp-act="cancel">Avbryt</button>`}</div>
      <div class="fp-progress"><i style="width:${pct}%"></i></div>
      <h2>${s.q}</h2>${s.help ? `<p class="fp-lead">${s.help}</p>` : ""}
      ${body}`;
    const next = () => { wzStep++; renderWizard(); show("wizard"); };
    const on = (act, fn) => { const b = wz.querySelector(`[data-fp-act="${act}"]`); if(b) b.addEventListener("click", fn); };
    on("back", () => { wzStep--; renderWizard(); });
    on("cancel", () => { if(hasPlan()) openPlan(); else if(skipIntro) location.href = "/"; else show("intro"); });
    wz.querySelectorAll(".fp-opt").forEach(b => b.addEventListener("click", () => { state.answers[s.key] = b.getAttribute("data-v"); save(); next(); }));
    on("next", () => { const v = wz.querySelector("[data-fp-date]").value; if(state.movedate !== v) state.resYear = ""; state.movedate = v; save(); next(); });
    on("skipdate", () => { state.movedate = ""; save(); next(); });
    on("skipmail", () => { state.hushall = wz.querySelector("[data-fp-name]").value.trim(); save(); notice = null; openPlan(); });
    on("done", async () => {
      const email = wz.querySelector("[data-fp-email]").value.trim(), err = wz.querySelector("[data-fp-err]"), btn = wz.querySelector('[data-fp-act="done"]');
      state.hushall = wz.querySelector("[data-fp-name]").value.trim(); save();
      if(!validEmail(email)){ err.textContent = "Skriv en e-postadress, eller välj att visa planen utan att spara."; err.hidden = false; return; }
      pendingNl = wz.querySelector("[data-fp-nlbox]").checked;
      state.email = email; save();
      btn.disabled = true;
      const res = await submitLead(email, pendingNl);
      btn.disabled = false;
      notice = res === "fail" ? {fail:true} : {ok:true};
      openPlan();
    });
  }
  function startWizard(){ wzStep = 0; renderWizard(); show("wizard"); }

  /* ---------- lead capture: HubSpot Forms API v3 ---------- */
  function planTasks(a){ return TASKS.filter(t => t.c(a)); }
  function partnerNeeds(a){
    const out = [];
    for(const t of planTasks(a)) if(WHO[t.who] && !WHO[t.who][1] && out.indexOf(t.who) < 0) out.push(t.who);
    return out;
  }
  function shortDate(iso){ const d = new Date(iso + "T12:00:00"); return isNaN(d) ? "" : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
  function household(f){ return f === "solo" ? {vuxna:"1", barn:"0"} : f === "par" ? {vuxna:"2", barn:"0"} : {}; }
  function kalkyl(a){
    const fam = {barn:"vuxna med barn", par:"2 vuxna", solo:"1 vuxen"}[a.familj];
    const parts = [state.movedate ? "Flytt " + shortDate(state.movedate) : "Flyttdatum ej satt", LABELS.region[a.region], fam, a.bostad, a.inkomst];
    if(state.answers.budget && LABELS.budget[state.answers.budget]) parts.push(LABELS.budget[state.answers.budget]);
    if(LABELS.bil[a.bil]) parts.push(LABELS.bil[a.bil]);
    return parts.filter(Boolean).join(", ") + (state.movedate ? "; första skatteår " + resYear() : "");
  }
  function leadPayload(email, nl){
    const a = answers(), hh = household(state.answers.familj);
    const f = [["email", email]];
    if(state.hushall) f.push(["firstname", state.hushall]);
    f.push(["solpass_kalla", cfg.source]);
    if(state.movedate) f.push(["solpass_flyttdatum", state.movedate]);
    if(state.answers.region) f.push(["solpass_omraden", state.answers.region]);
    if(hh.vuxna) f.push(["solpass_vuxna", hh.vuxna]);
    if(hh.barn) f.push(["solpass_barn", hh.barn]);
    if(state.answers.inkomst) f.push(["solpass_inkomsttyp", state.answers.inkomst]);
    if(state.answers.bostad) f.push(["solpass_bostad", state.answers.bostad]);
    if(state.answers.budget) f.push(["solpass_budget", state.answers.budget]);
    f.push(["solpass_partnerbehov", partnerNeeds(a).join(";")]);
    f.push(["solpass_kalkyl", kalkyl(a)]);
    const context = {pageUri: location.href, pageName: document.title};
    const tk = hutk(); if(tk) context.hutk = tk;
    const body = {fields: f.map(([name, value]) => ({name, value})), context};
    if(nl && cfg.nl && !isNaN(Number(cfg.nl))){
      body.legalConsentOptions = {consent:{consentToProcess:true, text: cfg.consent, communications:[{value:true, subscriptionTypeId:Number(cfg.nl), text:"Flyttbrevet"}]}};
    }
    return body;
  }
  async function submitLead(email, nl){
    if(!cfg.portal || !cfg.form) return "preview"; // preview mode: no network call
    try{
      const r = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(cfg.portal)}/${encodeURIComponent(cfg.form)}`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(leadPayload(email, nl))
      });
      return r.ok ? "ok" : "fail";
    }catch(e){ return "fail"; }
  }

  /* ---------- plan ---------- */
  function openPlan(){ renderPlan(); show("plan"); }
  function renderPlan(){
    const a = answers();
    const tasks = planTasks(a);
    const today = new Date(); today.setHours(12,0,0,0);
    const doneN = tasks.filter(t => state.done[taskKey(t)]).length;
    q("[data-fp-title]").textContent = state.hushall ? `${state.hushall}s flytt, steg för steg` : "Er flytt, steg för steg";
    q("[data-fp-summary]").innerHTML = Object.keys(LABELS).map(k => state.answers[k] && LABELS[k][state.answers[k]] ? `<span>${esc(LABELS[k][state.answers[k]])}</span>` : "").join("") + (state.movedate && dueFor({off:0}) ? `<span>flytt ${fmt(new Date(state.movedate + "T12:00:00"))}</span>` : "");
    q("[data-fp-prog]").style.width = (tasks.length ? Math.round(doneN / tasks.length * 100) : 0) + "%";
    q("[data-fp-count]").textContent = `${doneN} av ${tasks.length} steg klara`;
    let html = "", late = 0;
    for(const ph of [1,2,3,4]){
      const list = tasks.filter(t => t.ph === ph); if(!list.length) continue;
      html += `<div class="fp-phase"><div class="fp-phase-head"><h3>${PHASES[ph]}</h3><span class="fp-when">${PHASE_WHEN[ph]}</span></div>`;
      for(const t of list){
        const d = !!state.done[taskKey(t)], dd = dueFor(t);
        let due = "";
        if(dd){
          const days = Math.round((dd - today) / 86400000);
          let cls = "", txt = "senast " + fmt(dd);
          if(!d && days < 0){ cls = " late"; txt = "försenat · " + fmt(dd); late++; }
          else if(!d && days <= 21){ cls = " soon"; txt = "snart · " + fmt(dd); }
          due = `<span class="fp-due${cls}" data-fp-due="${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}">${txt}</span>`;
        }
        html += `<div class="fp-task${d ? " done" : ""}"><input type="checkbox" ${d ? "checked" : ""} data-fp-task="${esc(taskKey(t))}" aria-label="Klar: ${esc(t.t)}"><div><div class="fp-t">${t.t}</div><div class="fp-d">${t.d}</div><div class="fp-meta">${due}${whoHtml(t.who, a)}</div></div></div>`;
      }
      html += `</div>`;
    }
    if(late) html = `<div class="fp-hint">${late} steg har passerat sitt datum. Börja med dem; det mesta efter beror på dem.</div>` + html;
    if(state.movedate) html = `<label class="fp-field fp-resyear"><span>Första år som skatteresident i Spanien (preliminärt)</span><input type="number" data-fp-resyear value="${resYear()}" min="2000" max="2100" step="1" inputmode="numeric"><small class="fp-muted">Flytt januari–juni ger normalt flyttåret, annars året efter. Stäm av med rådgivaren.</small></label>` + html;
    if(!state.movedate) html = `<div class="fp-hint">Ange flyttdag under <button type="button" class="fp-linkbtn" data-fp-act="edit">Ändra svar</button>, så får varje steg ett sista datum.</div>` + html;
    if(notice && notice.fail) html = `<div class="fp-hint fp-hint-err" role="alert">Det gick inte att skicka just nu. Försök igen. <button type="button" class="fp-linkbtn" data-fp-act="retry">Försök igen</button></div>` + html;
    else if(notice && notice.ok) html = `<div class="fp-ok" role="status">Planen är sparad.</div>` + html;
    if(a.inkomst === "bolag") html += `<div class="fp-hint">Ni har ett svenskt AB. Var bolaget leds ifrån avgör var det beskattas. Det är den enskilt dyraste frågan att få fel; lös den innan ni bokar flyttfirma.</div>`;
    html += `<div class="fp-more"><a href="${esc(urls.dokument)}">Dokumenten ni behöver</a><a href="${esc(urls.skatt)}">Räkna på skatten</a><a href="${esc(urls.bostad)}">Räkna på bostaden</a><a href="${esc(urls.partners)}">Partners</a></div>`;
    planEl.innerHTML = html;
    const ry = planEl.querySelector("[data-fp-resyear]");
    if(ry) ry.addEventListener("change", e => { const y = +e.target.value; state.resYear = y >= 2000 && y <= 2100 ? y : ""; save(); renderPlan(); });
    planEl.querySelectorAll("input[type=checkbox][data-fp-task]").forEach(cb => cb.addEventListener("change", e => {
      state.done[e.target.getAttribute("data-fp-task")] = e.target.checked; save(); renderPlan();
    }));
    const ed = planEl.querySelector('[data-fp-act="edit"]'); if(ed) ed.addEventListener("click", startWizard);
    const rt = planEl.querySelector('[data-fp-act="retry"]');
    if(rt) rt.addEventListener("click", async () => {
      rt.disabled = true;
      const res = await submitLead(state.email, pendingNl);
      notice = res === "fail" ? {fail:true} : {ok:true}; renderPlan();
    });
  }

  /* ---------- checklist PDF (jsPDF, loaded on first use) ---------- */
  function pdfStatus(msg){ const s = q("[data-fp-pdfmsg]"); if(s){ s.textContent = msg || ""; s.hidden = !msg; } }
  async function downloadChecklist(){
    let lib;
    pdfStatus("");
    try { lib = await loadJsPDF(); } catch(e) { pdfStatus("PDF:en kunde inte skapas just nu. Försök igen om en stund."); return; }
    const doc = new lib.jsPDF({unit:"mm", format:"a4"});
    const W = 210, L = 18, R = 192, BOTTOM = 280, a = answers();
    let y = 20;
    const ensure = h => { if(y + h > BOTTOM){ doc.addPage(); y = 20; } };
    const text = (str, size, style = "normal", color = [20,24,31], x = L, width = R - L) => {
      doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(str, width), h = lines.length * size * 0.42;
      ensure(h); doc.text(lines, x, y + size * 0.35); y += h; return h;
    };
    const box = (x, filled) => { doc.setDrawColor(120,128,140); doc.setLineWidth(0.3); doc.rect(x, y + 0.6, 3.6, 3.6); if(filled){ doc.setFillColor(14,17,22); doc.rect(x + 0.7, y + 1.3, 2.2, 2.2, "F"); } };
    const profileText = [state.hushall, ...Object.keys(LABELS).map(k => state.answers[k] && LABELS[k][state.answers[k]]), state.movedate ? "flytt " + state.movedate : null].filter(Boolean).join(" · ");

    doc.setFillColor(14,17,22); doc.rect(0, 0, W, 34, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(255,255,255);
    doc.text("s", L, 16); doc.setFillColor(23,114,74); doc.circle(L + 6.6, 13.9, 2.1, "F"); doc.text("lpass", L + 9.2, 16);
    doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(170,178,189);
    doc.text(state.hushall ? `${state.hushall}s flyttchecklista` : "Flyttchecklista, Costa del Sol", L, 25);
    y = 44;
    text(profileText, 10, "normal", [80,88,100]);
    text(`Skapad ${fmt(new Date())}${state.movedate ? " · datum räknade från flyttdagen" : ""}`, 9, "normal", [120,128,140]);
    y += 4;
    const tasks = planTasks(a);
    for(const ph of [1,2,3,4]){
      const list = tasks.filter(t => t.ph === ph); if(!list.length) continue;
      ensure(16); y += 3;
      text(`${PHASES[ph]}  ·  ${PHASE_WHEN[ph]}`, 13, "bold", [23,114,74]);
      doc.setDrawColor(228,231,235); doc.line(L, y + 1, R, y + 1); y += 4;
      for(const t of list){
        const dd = dueFor(t);
        ensure(14); box(L, !!state.done[taskKey(t)]);
        text(t.t + (dd ? `  (senast ${fmt(dd)})` : ""), 10.5, "bold", [20,24,31], L + 6, R - L - 6);
        text(t.d, 9.5, "normal", [70,78,90], L + 6, R - L - 6);
        text("Vem: " + shortWho(t.who), 8.5, "italic", [120,128,140], L + 6, R - L - 6);
        y += 2.5;
      }
    }
    y += 4;
    let docsUrl = urls.dokument;
    try{ docsUrl = new URL(urls.dokument, location.href).href; }catch(e){}
    text("Dokument att samla", 13, "bold", [23,114,74]);
    text("Listan över dokument, med länkar till myndigheternas egna blanketter, finns på Solpass:", 9.5, "normal", [80,88,100]);
    ensure(5); doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(23,114,74);
    doc.textWithLink(docsUrl.length > 92 ? docsUrl.slice(0, 89) + "..." : docsUrl, L, y + 3, {url: docsUrl}); y += 6;
    text("Regler, avgifter och blanketter ändras. Kontrollera med myndigheten eller en gestor innan ni lämnar in. Solpass är vägledning, inte juridisk eller skattemässig rådgivning.", 8.5, "italic", [120,128,140]);
    doc.save("solpass-flyttchecklista.pdf");
  }

  /* ---------- wiring ---------- */
  root.addEventListener("click", e => {
    const b = e.target.closest ? e.target.closest("[data-fp-act]") : null;
    if(!b || !root.contains(b) || wz.contains(b) || planEl.contains(b)) return;
    const act = b.getAttribute("data-fp-act");
    if(act === "start" || act === "edit") startWizard();
    else if(act === "pdf") downloadChecklist();
  });

  if(hasPlan()) openPlan(); else if(skipIntro) startWizard(); else show("intro");
}

function boot(){ document.querySelectorAll(".sp-flyttplan").forEach(init); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

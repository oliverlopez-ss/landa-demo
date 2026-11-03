// Builds the page list for the Solpass HubSpot site from the demo's content (demo-data.json, extracted from index.html).
// Output: [{name, slug, title, description, sections: [{module, params}]}]. Upload maps module names to Design Manager paths.
// Usage: node build-pages.js <demo-data.json> <out.json> <forms.json with guids> <views.json from snapshot-views.js>
const fs = require("fs");
const D = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const FORMS = JSON.parse(fs.readFileSync(process.argv[4], "utf8")); // {maklare, fraga, checklista, partner, flyttbrevet, webbplats}
const VIEWS = Object.fromEntries(JSON.parse(fs.readFileSync(process.argv[5], "utf8")).map(v => [v.key, v]));
const vy = key => ({ module: "vy", params: { html: VIEWS[key].html } });

const PORTAL = "149676609", NL = "4020326561";
const CALC = { portal_id: PORTAL, form_guid: FORMS.webbplats, newsletter_subscription_type_id: NL };
const nf = n => Math.round(n).toLocaleString("sv-SE").replace(/ /g, " ");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const ul = items => `<ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
const links = src => (src || []).map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${l} ↗</a>`).join(" · ");
const btn = (text, url, style = "primar") => ({ text, url, style });
const form = guid => ({ form_id: guid, response_type: "inline", message: "" });

const sek = p => ({ module: "sektion", params: { variant: "vit", width: "bred", cols: "3", numbered: false, heading_level: "h2", ...p } });
const faqItems = items => items.map(i => ({ q: i.q, a: i.a }));
const PT = Object.fromEntries(D.PTYPES.map(t => [t.id, t]));
const allFaq = D.FAQ.flatMap(c => c.items);
const TOP = [[0, 1], [1, 0], [2, 0], [0, 4], [0, 3]].map(([c, i]) => D.FAQ[c].items[i]);

const STEPS = [
  { title: "Svara på några korta frågor", text: "<p>Flyttdag, familj, hur ni försörjer er, bostad och bil. Det är allt som behövs för att skilja ert läge från alla andras.</p>" },
  { title: "Få er plan med datum", text: "<p>Varje steg i rätt ordning, från skatteupplägg och NIE till padrón, skola och första spanska deklarationen.</p>" },
  { title: "Bli matchade med rätt partner", text: "<p>När partnerna är på plats får de er profil innan första samtalet.</p>" },
];
const MONEY = "<p>Så tjänar Solpass pengar: partners betalar en ersättning när en introduktion leder till ett uppdrag. Det påverkar inte vilka partners vi visar; vi tar bara in dem vi själva skulle anlita.</p>";
const pages = [];

// Start page: the demo's landing page in the same order, without Solpass Plus (no product or payment in HubSpot yet).
const UNS = id => `https://images.unsplash.com/photo-${id}?fm=jpg&q=70&w=1400&auto=format&fit=crop`;
const FACTS = [
  [D.TASKS.length, "steg i rätt ordning"],
  [4, "faser, från beslutet till första deklarationen"],
  [allFaq.length, "svar på det alla frågar"],
  [D.CONTACTS.length, "myndigheter, skolor och partnerroller"],
].map(([n, l]) => ({ title: String(n), small: l }));
const PHASE_CARDS = [1, 2, 3, 4].map(ph => ({ title: D.PHASES[ph], small: D.PHASE_WHEN[ph], text: ul(D.TASKS.filter(t => t.ph === ph).slice(0, 3).map(t => t.t)) }));
const AREA_CARDS = D.AREAS.map(a => ({ title: a.name, small: a.pitch, small2: `<span><b>${nf(a.prices[0][1])} €</b>/m² att köpa</span><span>ca ${a.flyg} min till flyget</span>`, image: UNS(a.img), link_url: `/omraden/${a.id}` }));
const PARTNER_CARDS = D.PGROUPS.map(([g, gn]) => ({ title: gn, text: D.PTYPES.filter(t => t.g === g).map(t => `<a href="/partners#${t.id}">${t.name}</a>`).join("") }));
pages.push({
  name: "Startsida", slug: "", title: "Solpass – flytta till Costa del Sol",
  description: "Allt en svensk familj behöver göra för att flytta till Costa del Sol, i rätt ordning, och utvalda partners som kan hjälpa er när de är på plats.",
  sections: [
    { module: "hero", params: { show_preview: true } },
    sek({ variant: "vit rad", card_style: "siffror", cards: FACTS }),
    sek({ anchor: "sa-funkar-det", eyebrow: "Så funkar det", heading: "Från ”vi borde” till nycklar i handen", lead: "<p>Solpass samlar allt ni annars letar efter i tjugo flikar och fem Facebookgrupper, och kopplar er till de få personer som faktiskt löser det.</p>", numbered: true, cards: STEPS }),
    { module: "om-oss", params: { anchor: "vilka-vi-ar", variant: "vit linje" } },
    { module: "ekonomi", params: { ...CALC, eyebrow: "Kalkyl", background: "gra" } },
    sek({ anchor: "planen", eyebrow: "Planen", heading: "Fyra faser, rätt ordning", lead: "<p>Det mesta som går fel i en flytt till Spanien går fel för att något gjordes för sent. Planen räknar baklänges från er flyttdag.</p>", card_style: "faser", cards: PHASE_CARDS, buttons: [btn("Gör er egen plan", "/flyttplan", "gron")] }),
    sek({ anchor: "bostad", variant: "gra", eyebrow: "Bostad och bolån", heading: "Vad kostar bostaden, på riktigt?", lead: "<p>Jämför upp till sex bostäder sida vid sida: vad köpet kräver kontant på köpdagen, månadskostnaden med och utan bankens paket, och vad det blir i kronor. Byggt för den som inte bor i Spanien än.</p>", card_style: "fakta", cards: [
      { title: "70 %", small: "lånar spanska banker normalt ut till den som inte är resident, mot 80 % för residenta" },
      { title: "7 %", small: "överlåtelseskatt på en begagnad bostad i Andalusien (2026; Junta de Andalucía har föreslagit 6,75 % från 2027), plus notarie, registro och advokat" },
      { title: "3,24 %", small: "Euribor 12 månader, preliminärt oktobersnitt 2026. Rörlig ränta är Euribor plus bankens marginal." },
    ], buttons: [btn("Räkna på en bostad", "/bostad/bolanekalkyl", "gron"), btn("Hyra eller köpa, över fem år?", "/bostad/hyra-eller-kopa", "sekundar")] }),
    sek({ anchor: "omraden", eyebrow: "Områden", heading: "Var på kusten passar ni?", lead: "<p>Sex områden, sex vardagar. Skolor, tid till flyget, vem som trivs där och vad det kostar att hyra och köpa.</p>", card_style: "omraden", cards: AREA_CARDS }),
    sek({ anchor: "beckham", eyebrow: "Beckham-regimen", heading: "Vad sparar ni på Beckham?", lead: "<p>Spaniens särskilda skatteregim för inflyttade: 24 % platt skatt på lönen i sex år i stället för upp till 47 %. Den gäller distansanställda, spanskt anställda och bolagsledare, men bara om ansökan lämnas i tid.</p>", card_style: "fakta", cards: [
      { title: "24 %", small: "platt skatt på arbetsinkomst upp till 600 000 € per år, 47 % därutöver" },
      { title: "6 år", small: "flyttåret plus fem år. Lön beskattas med 24 % i Spanien oavsett varifrån den betalas. Kapitalinkomster från Sverige beskattas inte i Spanien under tiden." },
      { title: "6 mån", small: "har ni på er att lämna Modelo 149, räknat från startdatumet i registreringen hos Seguridad Social, eller i A1-intyget om ni stannar i svensk socialförsäkring." },
    ], buttons: [btn("Räkna på Beckham", "/skatt", "gron")] }),
    sek({ anchor: "partners", eyebrow: "Partners", heading: "Rätt person för varje steg", lead: "<p>Vi håller på att välja ut våra första partners: de som arbetar med svenska familjer, skriver avtal med oss och lovar att svara inom två arbetsdagar.</p>", card_style: "partners", cards: PARTNER_CARDS, buttons: [btn("Se alla partnertyper", "/partners", "gron"), btn("Arbetar ni med svenskar? Bli partner", "/bli-partner", "sekundar")], note: MONEY }),
    { module: "fragor", params: { anchor: "vanliga-fragor", variant: "vit", eyebrow: "Vanliga frågor", heading: "Det alla undrar först", items: faqItems(TOP), buttons: [btn(`Alla ${allFaq.length} svar`, "/fragor", "sekundar")] } },
    {
      module: "formular",
      params: {
        anchor: "flyttbrevet", variant: "gra", layout: "sida", eyebrow: "Flyttbrevet",
        heading: "Det som ändras, innan det påverkar er flytt.",
        lead: "<p>Regler för skatt, hyra, skola och bostad i Spanien ändras ofta, och nästan allt skrivs på spanska. En gång i månaden får ni det som är nytt, vad det betyder för en svensk familj och vad ni bör göra just nu.</p>",
        content: ul(["<b>Det som har ändrats.</b> Nya regler och beslut, förklarade på svenska och med länk till källan.", "<b>Månadens deadlines.</b> Vad som ska vara klart om ni flyttar inom ett år.", "<b>Ett område på djupet.</b> Skolor, bostadspriser och hur vardagen ser ut."]) + "<p>En gång i månaden. Partners syns bara med tydlig märkning. Avsluta med ett klick.</p>",
        form: { ...form(FORMS.flyttbrevet), message: "<p>Tack. Första brevet kommer i början av nästa månad.</p>" },
      },
    },
    { module: "formular", params: { anchor: "checklistan", variant: "band", layout: "under", eyebrow: "Checklistan", heading: "Hela flytten i en PDF.", lead: "<p>Alla steg i rätt ordning, vilka papper som behövs, vem som löser vad och länkar till de officiella blanketterna. Har ni gjort planen blir den personlig.</p>", form: { ...form(FORMS.checklista), message: "<p>Tack. Vi mejlar checklistan till er.</p>" } } },
  ],
});

pages.push({
  name: "Flyttplan", slug: "flyttplan", title: "Gör er flyttplan – Solpass",
  description: "Några korta frågor om er familj, så får ni varje steg från beslut till första deklaration, med datum och rätt kontakter.",
  sections: [{ module: "flyttplan", params: { ...CALC } }],
});

// Subpages: the demo's own views (snapshot-views.js), calculators as modules.
const page = (key, name, extra = []) => {
  const v = VIEWS[key];
  pages.push({ name, slug: v.slug, title: v.title, description: v.description, sections: [vy(key), ...extra] });
};
page("omraden", "Områden");
D.AREAS.forEach(a => page(`omrade-${a.id}`, `Område: ${a.name}`));
page("bostadsguide", "Bostad");
pages.push({
  name: "Bolånekalkyl", slug: "bostad/bolanekalkyl", title: "Vad kostar bostaden i månaden? – Solpass",
  description: "Månadskostnad med spanska bankers villkor, skatterna vid köp och de löpande kostnaderna.",
  sections: [
    { module: "bostadskostnad", params: { ...CALC, compare: true, cta_url: "/partners#bolan" } },
    { module: "jamfor", params: { ...CALC, html: VIEWS["bostad-jamfor"].html } },
  ],
});
pages.push({
  name: "Hyra eller köpa", slug: "bostad/hyra-eller-kopa", title: "Hyra först eller köpa direkt? – Solpass",
  description: "Vad som är borta efter 3, 5 eller 10 år om ni hyr först jämfört med att köpa direkt.",
  sections: [{ module: "hyra-eller-kopa", params: { ...CALC } }],
});
pages.push({
  name: "Beckham-regimen", slug: "skatt", title: "Vad sparar ni på Beckham-regimen? – Solpass",
  description: "Jämför spansk skatt med och utan Beckham-regimen, för hela hushållet och hela perioden.",
  sections: [{ module: "beckham", params: { ...CALC } }, vy("skatt-info")],
});
// Partner types: one page, like the demo's #partners/<type>. The list shows by default; /partners#gestor shows that type.
pages.push({
  name: "Partners", slug: "partners", title: VIEWS.partners.title, description: VIEWS.partners.description,
  sections: [{ module: "vy", params: { html: `<div class="ptview" data-pt="">${VIEWS.partners.html}</div>` + D.PTYPES.map(t => `<div class="ptview" data-pt="${t.id}" hidden>${VIEWS["partner-" + t.id].html}</div>`).join("") } }],
});
page("skolor", "Skolor");
page("kontakter", "Kontakter");
page("dokument", "Dokument");
page("fragor", "Frågor");
page("fraga", "Ställ en fråga");
page("bli-partner", "Bli partner");

// Footer pages
pages.push({
  name: "Om oss", slug: "om-oss", title: "Om Solpass",
  description: "Solpass är guiden vi själva hade velat ha: allt som ska göras, i rätt ordning, och människorna som kan hjälpa till.",
  sections: [
    { module: "om-oss", params: { variant: "vit" } },
    sek({ variant: "gra", width: "smal", heading: "Så tjänar Solpass pengar", content: MONEY + "<p>Solpass är en guide, inte juridisk eller skatterättslig rådgivning.</p>" }),
  ],
});
pages.push({
  name: "Integritet", slug: "integritet", title: "Integritetspolicy – Solpass",
  description: "Hur Solpass behandlar personuppgifter.",
  sections: [sek({ heading_level: "h1", width: "smal", heading: "Integritetspolicy", lead: "<p>Policyn publiceras här innan sajten öppnar.</p>" })],
});
fs.writeFileSync(process.argv[3], JSON.stringify(pages));
console.log(pages.length, "pages:", pages.map(p => "/" + p.slug).join(" "));

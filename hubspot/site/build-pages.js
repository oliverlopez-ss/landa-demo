// Builds the page list for the Solpass HubSpot site from the demo's content (demo-data.json, extracted from index.html).
// Output: [{name, slug, title, description, sections: [{module, params}]}]. Upload maps module names to Design Manager paths.
// Usage: node build-pages.js <demo-data.json> <out.json> <forms.json with guids>
const fs = require("fs");
const D = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const FORMS = JSON.parse(fs.readFileSync(process.argv[4], "utf8")); // {maklare, fraga, checklista, partner, flyttbrevet, webbplats}

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
const groupCards = D.PGROUPS.map(([g, gn]) => ({ title: gn, text: `<p>${D.PTYPES.filter(t => t.g === g).map(t => t.name).join(", ")}.</p>`, link_text: "Se partnertyperna", link_url: `/partners#${g}` }));

const BROKER = {
  module: "formular",
  params: {
    anchor: "maklare", variant: "gra", layout: "sida",
    heading: "Prata med mäklare som kan svenska familjer",
    lead: "<p>Berätta var och när ni vill köpa, så kontaktar en till tre mäklare er. Ni väljer själva hur många, och ingen annan får era uppgifter.</p>",
    content: ul(["Registrerade och verksamma i Estepona, San Pedro eller Marbella", "Kan företräda er som köpare, inte bara säljaren", "Talar svenska eller engelska", "Säger från start vad de tar betalt och av vem"]),
    form: { ...form(FORMS.maklare), message: "<p>Tack. Vi matchar er med mäklare i området, och de hör av sig till er.</p>" },
    note: "<p>Mäklarna är fristående från Solpass. Solpass kan få ersättning från dem när en introduktion leder till ett uppdrag, och vi berättar hur innan ni bestämmer er. Ni väljer själva och kan alltid anlita någon annan.</p>",
  },
};

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
    ], buttons: [btn("Räkna på en bostad", "/bostad#bolanekalkyl", "gron"), btn("Hyra eller köpa, över fem år?", "/bostad#hyra-eller-kopa", "sekundar")] }),
    sek({ anchor: "omraden", eyebrow: "Områden", heading: "Var på kusten passar ni?", lead: "<p>Sex områden, sex vardagar. Skolor, tid till flyget, vem som trivs där och vad det kostar att hyra och köpa.</p>", card_style: "omraden", cards: AREA_CARDS }),
    sek({ anchor: "beckham", eyebrow: "Beckham-regimen", heading: "Vad sparar ni på Beckham?", lead: "<p>Spaniens särskilda skatteregim för inflyttade: 24 % platt skatt på lönen i sex år i stället för upp till 47 %. Den gäller distansanställda, spanskt anställda och bolagsledare, men bara om ansökan lämnas i tid.</p>", card_style: "fakta", cards: [
      { title: "24 %", small: "platt skatt på arbetsinkomst upp till 600 000 € per år, 47 % därutöver" },
      { title: "6 år", small: "flyttåret plus fem år. Lön beskattas med 24 % i Spanien oavsett varifrån den betalas. Kapitalinkomster från Sverige beskattas inte i Spanien under tiden." },
      { title: "6 mån", small: "har ni på er att lämna Modelo 149, räknat från startdatumet i registreringen hos Seguridad Social, eller i A1-intyget om ni stannar i svensk socialförsäkring." },
    ], buttons: [btn("Räkna på Beckham", "/ekonomi#beckham", "gron")] }),
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

// Areas
const PADRON_FOR = { marbella: ["Marbella"], "san-pedro": ["San Pedro"], estepona: ["Estepona"], benahavis: ["Benahavís"], "fuengirola-mijas": ["Fuengirola", "Mijas"], malaga: ["Málaga"] };
const IDEALISTA = "https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/", PRICE_MONTH = "september 2026";
pages.push({
  name: "Områden", slug: "omraden", title: "Områden på Costa del Sol – Solpass",
  description: "Sex områden där svenska familjer bosätter sig: skolor, tid till flyget och vad det kostar att hyra och köpa.",
  sections: [sek({
    heading_level: "h1", heading: "Var på kusten passar ni?",
    lead: "<p>Skolan avgör oftast valet, sedan pendlingen till flygplatsen och hur mycket svenska ni vill höra omkring er. Här är sex områden där svenska familjer bosätter sig.</p>",
    cards: D.AREAS.map(a => ({ title: a.name, text: `<p>${a.pitch}</p><p>Ca ${a.flyg} min med bil till Málagas flygplats. Från ${nf(a.prices[0][1])} € per m² att köpa.</p>`, link_text: `Om ${a.short || a.name}`, link_url: `/omraden/${a.id}` })),
    note: `<p>Priser: genomsnittligt utbudspris per kvadratmeter enligt idealista, ${PRICE_MONTH}. Restider med bil till Málagas flygplats, ungefärliga.</p>`,
  })],
});
for (const a of D.AREAS) {
  const p = a.prices, ex = p[0];
  const padron = (PADRON_FOR[a.id] || []).map(k => `<a href="${esc(D.PADRON[k])}" target="_blank" rel="noopener">padrón i ${k === "San Pedro" ? "Marbella kommun" : k} ↗</a>`).join(" och ");
  const body = `<h3>Passar för</h3><p>${a.suits}</p>
<h3>Vardagen</h3>${ul(a.life)}
<h3>Vad kostar det?</h3><p>${p.map(x => `${x[0]}: ${nf(x[1])} € per m² att köpa och ${String(x[2]).replace(".", ",")} € per m² och månad att hyra.`).join(" ")}</p>
<p>En bostad på 100 m² i ${ex[0]} har ett utbudspris kring <b>${nf(ex[1] * 100)} €</b>, och att hyra motsvarande kostar runt <b>${nf(ex[2] * 100)} € i månaden</b>. Utbudspriser är vad säljare och hyresvärdar begär; avslutade affärer ligger ofta något lägre, och villor och nyproduktion högre.</p>
<h3>Skolor och kommun</h3><p>Skolor i närheten: ${a.schools}. Skriv er i kommunen: ${padron}.</p>`;
  pages.push({
    name: `Område: ${a.name}`, slug: `omraden/${a.id}`, title: `${a.name} – Solpass`, description: a.pitch,
    sections: [sek({
      width: "smal", heading_level: "h1", heading: a.name, lead: `<p>${a.pitch} Ca ${a.flyg} min med bil till Málagas flygplats.</p>`, content: body,
      buttons: [btn("Räkna på en bostad", "/bostad"), btn("Alla områden", "/omraden", "sekundar")],
      note: `<p>Källa: idealista, utbudspriser ${PRICE_MONTH}: ${p.map(x => `<a href="${IDEALISTA + x[3]}" target="_blank" rel="noopener">köp ${x[0]}</a>, <a href="${IDEALISTA + x[4]}" target="_blank" rel="noopener">hyra ${x[0]}</a>`).join(", ")}.</p>`,
    })],
  });
}

// Housing
const guideRent = [
  ["Hyresavtal och padrón", "Välj ett avtal som motsvarar hur bostaden faktiskt ska användas. För padrón bedöms var ni verkligen bor, inte bara kontraktets rubrik. Ett tillfälligt avtal kan kräva mer underlag eller kontroll från kommunen. Det är padrón som låser upp skola, vård och bil."],
  ["Ni bestämmer hur länge ni bor kvar", "Som hyresgäst kan ni förlänga kontraktet år för år upp till fem år om hyresvärden är en privatperson, och sju år om det är ett bolag (hyreslagen LAU, artikel 9)."],
  ["Deposition och garantier har ett tak", "Depositionen (fianza) är en månadshyra. Extra garantier får vara högst två månadshyror på kontrakt upp till fem år, eller sju om hyresvärden är ett bolag (artikel 36)."],
  ["Mäklarens arvode betalas av hyresvärden", "Avgifter för förmedling och kontrakt får inte läggas på hyresgästen (artikel 20). Ber någon om det, säg nej."],
];
const guideBuy = [
  ["NIE och spanskt bankkonto", "Utan NIE kan ni inte skriva köpekontrakt. Kontot behövs för betalningen hos notarien."],
  ["Egen advokat innan ni betalar något", "Advokaten kontrollerar lagfart, skulder, bygglov och föreningens ekonomi. Mäklaren företräder nästan alltid säljaren."],
  ["Reservation och handpenning (arras)", "En mindre reservationsavgift tar bostaden från marknaden. Sedan skrivs ett kontrakt med handpenning, oftast 10 % av priset. Om kontraktet uttryckligen anger arras penitenciales (artikel 1454 Código Civil) kan båda backa: köparen förlorar handpenningen och säljaren betalar tillbaka det dubbla. Står det inte så kan motparten i stället kräva att köpet genomförs eller skadestånd."],
  ["Finansiering", "Som icke-resident lånar bankerna oftast högst 70 % och med kortare löptid. Ha lånebeskedet klart innan ni skriver kontrakt med handpenning."],
  ["Notarien och tillträdet", "Köpebrevet (escritura) skrivs under hos notarien, resten betalas och ni får nycklarna samma dag."],
  ["Skatter och registrering", "Begagnad bostad i Andalusien: 7 % överlåtelseskatt (ITP) (2026; Junta de Andalucía har föreslagit 6,75 % från 2027). Reducerad skattesats 3,5 % finns för permanentbostad för den som är under 35 år (pris upp till 150 000 €) eller har stor familj (upp till 250 000 €). Nyproduktion: 10 % moms plus 1,2 % stämpelskatt. Därtill notarie, registro och advokat, ofta 1,5–2 %. Lagfarten registreras i Registro de la Propiedad."],
];
const ol = steps => `<ol>${steps.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}</ol>`;
pages.push({
  name: "Bostad", slug: "bostad", title: "Bostad på Costa del Sol – Solpass",
  description: "Hyra först eller köpa direkt? Bostadsguide, månadskostnad med spanska banker och jämförelse av hyra och köp.",
  sections: [
    sek({
      heading_level: "h1", heading: "Hyra först eller köpa direkt?", cols: "2",
      lead: "<p>De flesta som flyttar till kusten hyr det första året och köper när de vet var de vill bo. Det är inte alltid rätt, men det är det säkra valet. Här är hur båda vägarna fungerar.</p>",
      cards: [
        { title: "Hyr först om", text: ul(["ni inte har bott på kusten och vet vilket område som passar", "barnens skola inte är bestämd", "ni kanske flyttar hem inom några år, eftersom köp och försäljning tillsammans kostar runt 15 % av priset"]) },
        { title: "Köp direkt om", text: ul(["ni känner området, ofta efter flera år som semesterboende", "ni räknar med att stanna i minst fem till sju år", "ni har kontantinsatsen: som icke-resident lånar bankerna normalt ut högst 70 %"]) },
      ],
      buttons: [btn("Prata med mäklare", "#maklare", "sekundar")],
    }),
    { module: "bostadskostnad", params: { ...CALC } },
    { module: "hyra-eller-kopa", params: { ...CALC } },
    sek({
      variant: "vit", width: "smal", heading: "Så går det till",
      content: `<h3>Att hyra</h3>${ol(guideRent)}<h3>Att köpa, steg för steg</h3>${ol(guideBuy)}`,
      note: "<p>Källa: Ley de Arrendamientos Urbanos, konsoliderad text i BOE, kontrollerad 30 oktober 2026. Hyreslagen har ändrats flera gånger under hösten 2026. Real Decreto-ley 29/2026 gäller sedan 8 oktober 2026 men ska godkännas av Kongressen i november. Röstas det ned faller ändringarna. Grundreglerna (5 eller 7 år, en månads deposition, högst två månaders extra garanti, hyresvärden betalar sin mäklare) gällde redan före dekretet. Låt advokat eller gestor läsa kontraktet.</p>",
    }),
    BROKER,
  ],
});

pages.push({
  name: "Ekonomi", slug: "ekonomi", title: "Ekonomi och Beckham-regimen – Solpass",
  description: "Levnadskostnad och netto i Spanien jämfört med Sverige, och vad Beckham-regimen kan betyda för er.",
  sections: [{ module: "ekonomi", params: { ...CALC } }, { module: "beckham", params: { ...CALC } }],
});

// Partners: one page, four groups, one card per type with an anchor the moving plan links to.
pages.push({
  name: "Partners", slug: "partners", title: "Partners – Solpass",
  description: "Gestor, skatterådgivare, advokat, mäklare och fler: vad de gör och när i flytten ni behöver dem.",
  sections: [
    sek({ heading_level: "h1", heading: "Rätt person för varje steg", lead: "<p>Vi håller på att välja ut ett fåtal partners per kategori och område: de som arbetar med svenska familjer, skriver avtal med oss och lovar att svara inom två arbetsdagar. Här är vad de olika rollerna gör och när ni behöver dem.</p>", note: MONEY }),
    ...D.PGROUPS.map(([g, gn], gi) => sek({
      anchor: g, variant: gi % 2 ? "vit tat" : "gra tat", heading: gn, cols: "3",
      cards: D.PTYPES.filter(t => t.g === g).map(t => ({
        anchor: t.id, title: t.name,
        text: `<p><b>${t.short}</b></p><p>${t.lead}</p>${ul(t.does)}<p><b>När:</b> ${t.when}</p>${t.ask?.length ? `<p><b>Fråga dem:</b></p>${ul(t.ask)}` : ""}${t.src?.length ? `<p class="small">${links(t.src)}</p>` : ""}`,
      })),
    })),
    sek({ heading: "Arbetar ni med svenskar på kusten?", lead: "<p>Vi tar nu in våra första partners.</p>", buttons: [btn("Bli partner", "/bli-partner")] }),
  ],
});

// Documents
pages.push({
  name: "Dokument", slug: "dokument", title: "Dokument och checklista – Solpass",
  description: "Allt ni kommer att bli ombedda att visa, i den ordning ni behöver det, med länkar till de officiella blanketterna.",
  sections: [
    sek({ heading_level: "h1", width: "smal", heading: "Allt ni kommer att bli ombedda att visa", lead: "<p>I den ordning ni behöver det, med länkar direkt till myndigheternas egna blanketter.</p>" }),
    { module: "formular", params: { anchor: "checklista", variant: "gra tat", layout: "sida", heading: "Checklistan som PDF", lead: "<p>Alla dokument i rätt ordning, med länkar till de officiella blanketterna.</p>", form: { ...form(FORMS.checklista), message: "<p>Tack. Vi mejlar checklistan till er.</p>" } } },
    sek({
      width: "smal",
      content: D.DOCS.map(d => `<h3>${d.t}</h3><p>${d.d}</p>${d.tpl?.length ? `<p><b>Så fyller ni i</b></p><ol>${d.tpl.map(s => `<li>${s}</li>`).join("")}</ol>` : ""}${d.src?.length ? `<p>${links(d.src)}</p>` : ""}`).join(""),
      note: `<p>Länkarna går direkt till myndigheternas egna blanketter, kontrollerade ${D.DOCS_CHECKED}. Använd alltid senaste versionen därifrån.</p>`,
    }),
  ],
});

// FAQ
pages.push({
  name: "Frågor", slug: "fragor", title: "Vanliga frågor – Solpass",
  description: "Korta svar för svenska familjer som flyttar till Costa del Sol: skatt, papper, skola, bostad, bil och vård.",
  sections: [
    sek({ heading_level: "h1", width: "smal", heading: "Det alla frågar", lead: "<p>Korta svar skrivna för svenskar. Regler ändras; kontrollera datum och belopp hos källan innan ni agerar.</p>" }),
    ...D.FAQ.map(c => ({ module: "fragor", params: { variant: "vit tat", heading: c.cat, items: faqItems(c.items) } })),
    { module: "formular", params: { anchor: "fraga", variant: "gra", layout: "sida", heading: "Hittar ni inte svaret?", lead: "<p>Ställ frågan här. Vi svarar inom två arbetsdagar, och de vanligaste frågorna blir nya svar på sajten.</p>", form: { ...form(FORMS.fraga), message: "<p>Tack. Vi svarar inom två arbetsdagar.</p>" } } },
  ],
});

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
pages.push({
  name: "Bli partner", slug: "bli-partner", title: "Bli partner – Solpass",
  description: "Svenska familjer som har bestämt sig för att flytta. Bli en av Solpass första partners på Costa del Sol.",
  sections: [
    sek({
      heading_level: "h1", heading: "Svenska familjer som har bestämt sig för att flytta.", numbered: true,
      lead: "<p>Solpass hjälper svenska familjer att planera flytten till Costa del Sol. När de behöver en gestor, skatterådgivare, advokat eller mäklare kopplar vi dem till ett fåtal partners per kategori och område.</p>",
      cards: [
        { title: "Kvalificerade förfrågningar", text: "<p>Ni får familjens flyttdatum, situation och vad de vill ha hjälp med innan första samtalet.</p>" },
        { title: "Få partners per område", text: "<p>Vi tar bara in ett par partners per kategori och område, så att varje förfrågan blir värd att svara på.</p>" },
        { title: "Betala för resultat", text: "<p>Ni betalar bara när en introduktion leder till ett uppdrag. Vi kräver svar inom två arbetsdagar.</p>" },
      ],
    }),
    { module: "formular", params: { anchor: "anmalan", variant: "gra", layout: "sida", heading: "Arbetar ni med svenskar på kusten?", lead: "<p>Vi är nya och tar nu in våra första partners. Vi börjar med gestorer, skatterådgivare och mäklare, och tar sedan in fler kategorier.</p>", form: { ...form(FORMS.partner), message: "<p>Tack. Vi hör av oss inom två arbetsdagar.</p>" } } },
  ],
});

fs.writeFileSync(process.argv[3], JSON.stringify(pages));
console.log(pages.length, "pages:", pages.map(p => "/" + p.slug).join(" "));

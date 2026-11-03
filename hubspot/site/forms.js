// The visible HubSpot forms on solpass.se. Field names are contact properties; `hidden` fields carry a fixed value.
// legal is HubSpot's consent block: processing consent plus an optional Flyttbrevet checkbox.
const NL = { id: 4020326561, label: "Skicka mig Flyttbrevet: nya regler och deadlines, en gång i månaden" };
const PRIVACY = 'Vi använder uppgifterna för att svara er. Läs mer i vår <a href="/integritet">integritetspolicy</a>.';

module.exports = [
  {
    name: "Solpass – Flyttbrevet",
    submitText: "Prenumerera",
    message: "Tack. Första brevet kommer i början av nästa månad.",
    fields: [{ name: "email", label: "E-post", required: true }],
    legal: { newsletter: { ...NL, label: "Ja, skicka mig Flyttbrevet en gång i månaden", required: true }, privacy: 'Avsluta med ett klick i varje brev. Läs mer i vår <a href="/integritet">integritetspolicy</a>.' },
  },
  {
    name: "Solpass – mäklare",
    submitText: "Bli kontaktade",
    message: "Tack. Vi matchar er med mäklare i området, och de hör av sig till er.",
    fields: [
      { name: "firstname", label: "Förnamn", required: true },
      { name: "email", label: "E-post", required: true },
      { name: "phone", label: "Telefon", required: true },
      { name: "solpass_omraden", label: "Var vill ni köpa?", required: true, only: ["estepona", "san-pedro", "marbella"] },
      { name: "solpass_budget", label: "Budget", required: true, only: ["k1", "k2", "k3", "k4"] },
      { name: "solpass_koptidpunkt", label: "När vill ni köpa?", required: true },
      { name: "solpass_antal_maklare", label: "Hur många mäklare får kontakta er? (1–3)", required: true },
      { name: "solpass_kalla", hidden: "maklare" },
      { name: "solpass_bostad", hidden: "kopa" },
    ],
    legal: { newsletter: NL, consentCheckbox: "Ni får dela våra uppgifter med det antal mäklare vi valt ovan, och bara med dem.", privacy: 'Mäklarna är fristående från Solpass. Solpass kan få ersättning från dem när en introduktion leder till ett uppdrag. Läs mer i vår <a href="/integritet">integritetspolicy</a>.' },
  },
  {
    name: "Solpass – fråga",
    submitText: "Skicka frågan",
    message: "Tack. Vi svarar inom två arbetsdagar.",
    fields: [
      { name: "message", label: "Vad undrar ni?", required: true },
      { name: "email", label: "E-post för svaret", required: true },
      { name: "solpass_kalla", hidden: "fraga" },
    ],
    legal: { newsletter: NL, privacy: PRIVACY },
  },
  {
    name: "Solpass – checklista",
    submitText: "Skicka checklistan",
    message: "Tack. Vi mejlar checklistan till er.",
    fields: [
      { name: "email", label: "E-post", required: true },
      { name: "solpass_kalla", hidden: "checklista" },
    ],
    legal: { newsletter: NL, privacy: PRIVACY },
  },
  {
    name: "Solpass – bli partner",
    submitText: "Skicka intresseanmälan",
    message: "Tack. Vi hör av oss inom två arbetsdagar.",
    fields: [
      { name: "firstname", label: "Namn", required: true },
      { name: "company", label: "Företag", required: true },
      { name: "email", label: "E-post", required: true },
      { name: "phone", label: "Telefon", required: false },
      { name: "message", label: "Berätta kort: vad ni gör, i vilket område, på vilka språk och ungefär hur många svenska kunder ni har per år", required: true },
      { name: "solpass_kalla", hidden: "partner" },
    ],
    legal: { privacy: 'Vi använder uppgifterna för att återkomma om ett partnersamarbete. Läs mer i vår <a href="/integritet">integritetspolicy</a>.' },
  },
];

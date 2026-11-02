# Solpass – moduler för HubSpot

Fem egna moduler för HubSpot CMS, byggda från demon och kontrollerade mot den: samma uträkningar, samma texter.

| Modul | Vad den gör | Källa i HubSpot (`solpass_kalla`) |
|---|---|---|
| `solpass-flyttplan` | Frågeguiden och den färdiga flyttplanen med datum, PDF och sparad plan i webbläsaren | `plan` |
| `solpass-bostadskostnad` | Vad bostaden kostar per månad: reglage, räntelägen och scenarier | `kalkyl-bostad` |
| `solpass-hyra-eller-kopa` | Hyra eller köpa över 3, 5 eller 10 år | `kalkyl-hyra-kopa` |
| `solpass-beckham` | Spansk skatt med och utan Beckham, bästa val per person | `kalkyl-beckham` |
| `solpass-ekonomi` | Levnadskostnad och netto i Spanien jämfört med nettot i Sverige | `kalkyl-ekonomi` |

Varje modul har egna fält i sidredigeraren: rubrik, ingress, accentfärg, formulärkoppling och samtyckestext. Två moduler kan ligga på samma sida.

## 1. Skapa kontaktegenskaperna

Inställningar → Egenskaper → Kontaktegenskaper. Lägg dem i en egen grupp, "Solpass". De interna namnen måste vara exakt som nedan.

| Internt namn | Typ | Värden |
|---|---|---|
| `solpass_kalla` | Rullgardin | `plan`, `kalkyl-bostad`, `kalkyl-hyra-kopa`, `kalkyl-beckham`, `kalkyl-ekonomi`, `checklista`, `maklare`, `fraga`, `partner` |
| `solpass_flyttdatum` | Datum | |
| `solpass_omraden` | Flerval | `costa` (Costa del Sol), `annat` (annan region) |
| `solpass_vuxna` | Tal | |
| `solpass_barn` | Tal | |
| `solpass_inkomsttyp` | Rullgardin | `distans`, `bolag`, `spansk`, `pension` |
| `solpass_bostad` | Rullgardin | `hyra`, `kopa` |
| `solpass_budget` | Rullgardin | `k1` under 300 000 €, `k2` 300–600 000 €, `k3` 600 000–1 milj. €, `k4` över 1 milj. €, `h1` hyra under 1 500 €, `h2` hyra 1 500–2 500 €, `h3` hyra 2 500–4 000 €, `h4` hyra över 4 000 €, `vet` ej satt |
| `solpass_koptidpunkt` | Rullgardin | `6m` inom 6 månader, `12m` 6–12 månader, `senare` om mer än ett år (används av mäklarformuläret) |
| `solpass_antal_maklare` | Tal | 1–3 (mäklarformuläret) |
| `solpass_partnerbehov` | Flerval | `skatt`, `skola-int`, `natverk`, `maklare`, `advokat`, `bank`, `flytt` |
| `solpass_kalkyl` | Flerradig text | Kort sammanfattning av svaren och resultatet |

## 2. Skapa formulär och prenumerationstyp

1. **Prenumerationstyp:** Inställningar → Marknadsföring → E-post → Prenumerationer. Skapa "Flyttbrevet" och notera dess id.
2. **Formulär:** skapa ett formulär, "Solpass – webbplats", med e-post och samtliga egenskaper ovan som dolda fält. Modulerna skickar till formuläret via HubSpots Forms API, så själva formuläret visas aldrig. Notera formulärets GUID och ert portal-id (kontots id).
3. **Uppföljningsmejl:** lägg ett enkelt uppföljningsmejl på formuläret, så att "Vi mejlar kalkylen till er" stämmer. Annars behöver texten ändras i modulens fält.

## 3. Ladda upp modulerna

Med HubSpots kommandoverktyg (rekommenderas):

```bash
npm install -g @hubspot/cli
```

```bash
hs init
```

```bash
hs upload hubspot/modules solpass/modules
```

Kör kommandona från repots rot. Utan kommandoverktyget går det att skapa varje modul i Design Manager och klistra in innehållet i `module.html`, `module.css` och `module.js`. Fälten (`fields.json`) måste då läggas in för hand.

## 4. Lägg modulerna på sidorna

Fyll i på varje modul: portal-id, formulär-GUID och prenumerationstypens id för Flyttbrevet. Så länge portal-id eller formulär-GUID saknas skickar modulen ingenting och visar bara bekräftelsen. Det är förhandsläget.

I flyttplanen finns fält för länkarna till sidorna partners, dokument, ekonomi och bostad. Standard är `/partners`, `/dokument`, `/ekonomi` och `/bostad`.

## 5. Testa innan lansering

- Skicka in varje formulär med en egen testadress och kontrollera kontakten i HubSpot: rätt källa, rätt egenskaper, en kontakt och inte flera.
- Kryssa i Flyttbrevet och kontrollera att kontakten får prenumerationen.
- Kontrollera att uppföljningsmejlet kommer fram.
- Samtyckestexten hänvisar till integritetspolicyn. Den skrivs när bolaget är registrerat.

## Förhandsgranska lokalt

```bash
cd hubspot/preview && node build-preview.js && node preview-flyttplan.js
```

Öppna sedan `hubspot/preview/<modul>.html` i en webbläsare. Testerna (`node test-modules.js` och `node flyttplan-test.js`) jämför modulerna med demon och kräver Playwright.

## Skillnader mot demon

- Flyttplanen visar datum på alla steg; demon låste dem bakom Plus.
- Bostadskostnaden saknar jämförelsen av flera bostäder men har ett eget formulär för att spara kalkylen.
- Kryssrutan för Flyttbrevet visas bara när en prenumerationstyp är inlagd.
- Flyttplanens PDF har checklistan men inte demons sida med alla blanketter; den länkar i stället till dokumentsidan.
- Guiden frågar "Vilka flyttar?", inte antal personer. För familjer med barn skickas därför inte `solpass_vuxna` och `solpass_barn`.
- `module.html` är bara provat med förhandsbyggaren, inte i en riktig HubSpot-portal. Kontrollera första uppladdningen.

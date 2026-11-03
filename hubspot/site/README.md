# Solpass – sajten i HubSpot

Källan till det som ligger i Solpass-portalen (149676609): sidmallen, innehållsmodulerna, formulären och sidornas innehåll. Kalkylmodulerna ligger i `../modules/`.

| Fil | Vad |
|---|---|
| `templates/solpass-sida.html` | Sidmallen "Solpass sida": sidhuvud, en dra-och-släpp-yta, sidfot och all CSS. Har `noindex` tills solpass.se går live. |
| `content-modules.js` | Innehållsmodulerna: hero, sektion (med kort och knappar), frågor, om oss, formulär. `node content-modules.js <ut>` skriver JSON. |
| `forms.js` | De synliga formulären: Flyttbrevet, mäklare, fråga, checklista, bli partner. |
| `extract-demo-data.js` | Plockar ut FAQ, DOCS, AREAS, PTYPES m.m. ur demons `index.html`. |
| `build-pages.js` | Bygger alla 17 sidor från demons data. `node build-pages.js demo-data.json pages.json form-guids.json` |
| `form-guids.json` | Formulärens GUID i portalen. |

## Det som finns i portalen

Allt ligger i mappen `solpass/` i Design Manager.

| Vad | Id |
|---|---|
| Mall `solpass/Solpass sida` | 506130889939 |
| solpass-hero / -sektion / -fragor / -om-oss / -formular | 506166104275 / 506130889951 / 506130889941 / 506166104278 / 506166104285 |
| solpass-flyttplan / -bostadskostnad / -hyra-eller-kopa / -beckham / -ekonomi | 506097955018 / 506166101213 / 506166101215 / 506130887918 / 506166101217 |
| Prenumerationstyp Flyttbrevet | 4020326561 |
| Formulär | se `form-guids.json` (`webbplats` är det dolda formuläret som kalkylerna skickar till) |

Sidorna är utkast, inte publicerade: `/`, `/flyttplan`, `/omraden` och sex områdessidor, `/bostad`, `/ekonomi`, `/partners`, `/dokument`, `/fragor`, `/om-oss`, `/integritet`, `/bli-partner`.

## Så laddades det upp

Utan HubSpots kommandoverktyg: från en inloggad flik i portalen, med HubSpots egna API:er (`/api/designmanager/v1/modules`, `/api/designmanager/v1/templates`, `/api/forms/v2/forms`, `/api/cms/v3/pages/site-pages`). Filerna hämtades från en lokal server. Vill ni byta till kommandoverktyget går det: mallen och modulerna här är vanliga HubL-filer.

Ändras texten i sidredigeraren gäller den. Kör inte `build-pages.js` mot befintliga sidor utan att först ta in de ändringarna, annars skrivs de över.

## Avvikelser och gränser

- Portalen stoppade nya kontaktegenskaper efter tio (`OBJECT_CREATION property limit of 10`). Partner- och frågeformulären använder därför standardfältet `message`.
- `solpass_omraden` har fått sex områdesval utöver `costa` och `annat`, för mäklarformuläret.
- Mäklarformulärets samtycke till delning är HubSpots obligatoriska samtyckesruta, inte en egen egenskap.

# Solpass – handoff for the next session

Read this first. It is the state of the project as of 3 November 2026 and the plan for moving the site to HubSpot. Agent-facing text is English; everything shown to Oliver and all site copy is Swedish.

## What Solpass is

A lead-generation site for Swedish families moving to Costa del Sol. Primary goal: capture leads (home buyers most valuable) without feeling salesy. Also: build an audience (the monthly newsletter Flyttbrevet) and connect families with partners (brokers, gestor, tax advisor, lawyer, etc.). Business model: introductions to partners, who pay Solpass.

- Founders: Oliver Lopez and Emelie Svedberg. Two children (6 and 10). Leave Oliver's adult daughter out of all copy.
- Legal entity: **Commercial Architects** (the Swedish company is being registered now). It will be the data controller. Not Structsales, not Oliver Lopez AB. The brand must not appear on the site except in the footer, privacy policy and terms.
- Not live. The demo is `noindex`.

## Where things are

| What | Where |
|---|---|
| Demo site (source of truth for content and logic) | repo `oliverlopez-ss/landa-demo`, `index.html` (single-file app, hash routing). Live: https://oliverlopez-ss.github.io/landa-demo/ |
| Admin page for demo leads | `landa-demo/admin.html` |
| HubSpot modules (ready to upload) | `landa-demo/hubspot/modules/` – five modules |
| Setup guide for the modules (properties, form, upload, test) | `landa-demo/hubspot/README.md` |
| Previews and tests of the modules against the demo | `landa-demo/hubspot/preview/` (`node build-preview.js`, `node preview-flyttplan.js`, `node test-modules.js`, `node flyttplan-test.js`; need Playwright) |
| Paused Solpass app (Next.js, Supabase project `landa`, ref `zdgxdwlztcjtjgxvmfjn`) | repo `oliverlopez-ss/upgraded-happiness`, folder `landa/` |

Demo lead saving is **off** (`const SAVE_LEADS = false` in `index.html`). A small notice says the forms save nothing. Turn it on only when Commercial Architects is registered and a privacy policy exists – or, better, never: leads go to HubSpot.

## Decisions already made (do not reopen)

- **Architecture:** solpass.se on **HubSpot Starter** (Oliver has all Starter hubs; Oliver owns solpass.se), in a **separate Solpass portal**. Later: app.solpass.se on Vercel for login, household, saved plan and Stripe payments, synced to HubSpot via API. HubSpot owns contacts, forms, Flyttbrevet, lists and partner hand-off. Supabase only for the future app.
- **Do not use the HubSpot MCP connector in sessions where it points at the Structsales portal (account 301000).** Check `get_organization_details` first; only work in the Solpass portal.
- **One primary path:** the moving plan ("Gör er flyttplan"). Everything else is secondary. Checklist PDF is the only secondary capture; newsletter is a checkbox.
- **Buyer advisory removed.** Instead: "Prata med mäklare som kan svenska familjer" – the family chooses 1–3 brokers who may contact them, explicit consent to share, disclosure that Solpass may be paid by partners.
- **About section** ("Vilka vi är", right after "Så funkar det"), Oliver's exact text:
  > Därför finns Solpass.
  > Vi är Oliver och Emelie. Vi har två barn och har valt Costa del Sol för vår familj: för vädret, maten och tempot.
  > Solpass är guiden vi själva hade velat ha: allt som ska göras, i rätt ordning, och människorna som kan hjälpa till.
  > Oliver Lopez och Emelie Svedberg

  Needs a real photo of the two of them. No children's photos. Never write when or where they are registered (tax-residence reasons).
- **Flyttbrevet:** monthly. Section copy is in the demo ("Det som ändras, innan det påverkar er flytt." + three bullets). No "from our own move" item. Format and content to be designed in a separate conversation.
- **Calculators:** shown as estimates ("Estimat, inte beslutsunderlag" box under every result); Beckham amounts rounded ("ca"). The economy calculator asks for the household's current Swedish net instead of modelling Swedish tax. Pension/capital/own company: no comparison, refer to a tax advisor.
- **Response promise:** one promise everywhere: "inom två arbetsdagar".
- **Facebook groups:** to be handled in a separate conversation (no technical integration possible; use as research, helpful answers, admin partnerships, push to email).

## HubSpot build plan

### Sitemap

Start page, seven sections:
1. Hero with the moving plan and one button "Gör er flyttplan".
2. Så funkar det, three steps.
3. Vilka vi är (text above + photo).
4. Bostad: housing-cost calculator + "Prata med mäklare".
5. Partners: how we choose them, four groups.
6. Flyttbrevet.
7. Five most common questions.

Subpages:

| Page | Content | Module |
|---|---|---|
| /flyttplan | Wizard and generated plan | `solpass-flyttplan` |
| /omraden + 6 pages | One page per area (Marbella, San Pedro, Estepona, Benahavís, Fuengirola och Mijas, Málaga) | text from demo `AREAS` |
| /bostad | Housing guide, housing-cost calculator, rent vs buy, broker form | `solpass-bostadskostnad`, `solpass-hyra-eller-kopa` |
| /ekonomi | Economy calculator and Beckham calculator | `solpass-ekonomi`, `solpass-beckham` |
| /partners | All 15 partner types on one page in four groups (no HubDB on Starter) | text from demo `PTYPES` |
| /dokument | Documents, links, checklist PDF form | text from demo `DOCS` |
| /fragor | All FAQ + "Ställ en fråga" | text from demo `FAQ` |
| /om-oss, /integritet, /bli-partner | Footer only | |

### Steps in the Solpass portal

Follow `hubspot/README.md` exactly:
1. Create the 12 contact properties (group "Solpass"; exact internal names and option values are in the README table).
2. Create subscription type "Flyttbrevet"; create form "Solpass – webbplats" with email and all properties as hidden fields; add a follow-up email so "Vi mejlar …" becomes true.
3. Upload modules: `hs upload hubspot/modules solpass/modules` (HubSpot CLI, authenticated against the Solpass portal), or paste into Design Manager.
4. Build the pages from the sitemap; put modules on them and fill portal id, form GUID and the Flyttbrevet subscription type id in each module.
5. Separate HubSpot form for the broker introduction (properties `solpass_bostad=kopa`, `solpass_omraden`, `solpass_budget`, `solpass_koptidpunkt`, `solpass_antal_maklare`, phone, consent checkbox for sharing with the chosen brokers), the "Ställ en fråga" form, the checklist form and the partner application form.
6. Hot-lead segment as an active list (Starter has no lead scoring): budget above threshold AND move date within 12 months AND phone known AND Number of Form Submissions ≥ 2.
7. Test every form end to end with a test address. Only then point solpass.se to HubSpot and remove noindex there (the demo keeps noindex).

### How to operate HubSpot from a session

A cloud session cannot reach Oliver's Chrome. Options, best first:
- Run the session in the **Claude desktop app on Oliver's computer** with Claude in Chrome, logged into the Solpass portal.
- Or connect the **HubSpot connector to the Solpass portal** at claude.ai (Settings → Connectors) and start a new session; verify the account id is not 301000. The connector can create properties and pages but not forms.
- For the CLI upload: a HubSpot personal access key for the Solpass portal stored as an environment secret (never pasted in chat).

## Open before launch (Oliver's decisions, in order)

1. **Commercial Architects registered** → org number → privacy policy (GDPR art. 13: controller, purposes, legal basis, recipients incl. chosen partners, retention, rights), cookie banner, sender for Flyttbrevet.
2. **Tax advisor** reviews the Beckham and economy calculators and the about text. Could be the first partner.
3. **Partners:** 2–3 brokers plus a gestor and a tax advisor; decide how Solpass is paid; ask a Spanish lawyer whether commissions from mortgage brokers (Ley 5/2019, credit intermediation) and lawyers (professional rules) are allowed.
4. **Who answers leads** and keeps "inom två arbetsdagar".
5. **Photo** of Oliver and Emelie.
6. **First Flyttbrevet issue.**
7. **Domain** solpass.se to HubSpot.

## Time-sensitive facts to update in HubSpot

- Euribor October 2026 is shown as "3,24 % (preliminärt)"; Banco de España was scheduled to publish the official value on 3 Nov 2026 – check and replace.
- Real Decreto-ley 29/2026 (rental law, in force since 8 Oct 2026) is voted on in November; if it falls, update the rental texts.
- Click-check two links that block bots: Policía cita previa (icp.administracionelectronica.gob.es/icpplus/index.html) and Benahavís padrón (benahavis.es/379/empadronamiento).
- Not verified: Andalusian wealth-tax arrangement for 2026; catastral revision years per municipality (calculators use 2 % imputed income as the cautious default).

## Working rules

- Swedish to Oliver, concise, direct. Agent-facing text in English.
- Verify facts with sources; never guess. The site's content was fact-checked twice on 2 Nov 2026 (tax, residency, housing, schools, promises); keep that standard for anything new.
- No "AI-looking" design: no default colours, pills, eyebrow labels or stock photos. Design direction "D", accent "Tall" #17724A, ink #0E1116, white, font Schibsted Grotesk, logo "s●lpass" with a green dot.
- Don't overbuild. Prefer cutting scope to building complex models.
- Do not delete anything (projects, repos, data) without Oliver's explicit yes.
- Pushes to `oliverlopez-ss/upgraded-happiness` go to `claude/*` branches only. `landa-demo` is pushed to `main` (GitHub Pages deploys from it).

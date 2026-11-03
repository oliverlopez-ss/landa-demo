// Content modules for the Solpass HubSpot site. Markup only; styles live in the page template.
// Each module is {name, label, html, fields} in the same field format as hubspot/modules/*/fields.json.

const text = (name, label, def = "", extra = {}) => ({ name, label, type: "text", required: false, locked: false, default: def, ...extra });
const rich = (name, label, def = "") => ({ name, label, type: "richtext", required: false, locked: false, default: def });
const choice = (name, label, choices, def) => ({ name, label, type: "choice", display: "select", required: false, locked: false, choices, default: def });
const bool = (name, label, def = false) => ({ name, label, type: "boolean", required: false, locked: false, default: def });
const group = (name, label, children, extra = {}) => ({ name, label, type: "group", required: false, locked: false, children, ...extra });
const repeat = (name, label, children, def = []) => group(name, label, children, { occurrence: { min: 0, max: 40, default: 0 }, default: def });

const anchor = text("anchor", "Ankare (id i adressen, t.ex. partners)");
const variant = choice("variant", "Bakgrund", [["vit", "Vit"], ["gra", "Grå"], ["band", "Mörk"], ["vit tat", "Vit, mindre luft"], ["gra tat", "Grå, mindre luft"]], "vit");
const buttons = repeat("buttons", "Knappar", [
  text("text", "Text"),
  text("url", "Länk"),
  choice("style", "Stil", [["primar", "Svart"], ["gron", "Grön"], ["sekundar", "Kontur"]], "primar"),
]);

const BUTTONS = `{% if module.buttons|length %}<div class="row knappar">{% for b in module.buttons %}<a class="btn {{ b.style }}" href="{{ b.url|escape_attr }}">{{ b.text }}</a>{% endfor %}</div>{% endif %}`;
const OPEN = `<section class="sec {{ module.variant }}"{% if module.anchor %} id="{{ module.anchor|escape_attr }}"{% endif %}>`;

module.exports = [
  {
    name: "solpass-hero",
    label: "Solpass hero",
    fields: [
      text("eyebrow", "Liten text ovanför rubriken", "För svenska familjer som flyttar till Costa del Sol"),
      text("heading", "Rubrik", "Flytten till Spanien,"),
      text("heading_muted", "Rubrik, andra raden", "i rätt ordning."),
      rich("lead", "Ingress", "<p>En personlig plan för hela flytten: varje myndighetssteg med datum, vad det kostar och rätt person att ringa. Svara på några korta frågor, det tar två minuter.</p>"),
      text("button_text", "Knapptext", "Gör er flyttplan, gratis"),
      text("button_url", "Knapplänk", "/flyttplan"),
      text("button2_text", "Andra knappen, text", "Räkna på ekonomin"),
      text("button2_url", "Andra knappen, länk", "/ekonomi"),
      text("fine", "Liten text under knapparna", "Tar två minuter. Ingen inloggning."),
      { name: "image", label: "Bakgrundsbild", type: "image", required: false, locked: false, responsive: true, resizable: false, default: { src: "https://images.unsplash.com/photo-1774208671069-c2e5a00689c3?fm=jpg&q=70&w=2200&auto=format&fit=crop", alt: "", loading: "eager" } },
      bool("show_preview", "Visa exempel på en plan", true),
    ],
    // Same as the demo's landing hero: photo with a slow zoom, dark gradient, white text, example plan to the right.
    html: `<section class="hero">
  {% if module.image.src %}<div class="hero-bg" style="background-image:url('{{ module.image.src|escape_attr }}')"></div>{% endif %}
  <div class="wrap">
    <div>
      {% if module.eyebrow %}<div class="eyebrow">{{ module.eyebrow }}</div>{% endif %}
      <h1>{{ module.heading }}{% if module.heading_muted %} <span class="mute">{{ module.heading_muted }}</span>{% endif %}</h1>
      <div class="lead">{{ module.lead }}</div>
      <div class="row">
        <a class="btn sun" href="{{ module.button_url|escape_attr }}">{{ module.button_text }}</a>
        {% if module.button2_text %}<a class="btn light" href="{{ module.button2_url|escape_attr }}">{{ module.button2_text }}</a>{% endif %}
      </div>
      {% if module.fine %}<p class="fine">{{ module.fine }}</p>{% endif %}
    </div>
    {% if module.show_preview %}
    <div class="preview" aria-hidden="true">
      <div class="ph"><div><b>Familjen Andersson</b> <span class="pill">Exempel</span></div><span class="small muted">flytt 1 aug 2027 · Marbella</span></div>
      <div class="ptask done"><span class="box"></span><div><div class="tt">Boka möte med skatterådgivare</div></div></div>
      <div class="ptask"><span class="box"></span><div><div class="tt">Ansök om NIE för alla i familjen</div><div class="meta"><span class="due soon">senast 3 maj</span><span class="who">Policía Nacional</span></div></div></div>
      <div class="ptask"><span class="box"></span><div><div class="tt">Säkra bostad med långtidskontrakt</div><div class="meta"><span class="due">senast 2 jun</span><span class="who">Mäklare</span></div></div></div>
      <div class="ptask"><span class="box"></span><div><div class="tt">Skriv in barnen i skolan</div><div class="meta"><span class="due">senast 15 aug</span><span class="who">Skola</span></div></div></div>
    </div>
    {% endif %}
  </div>
</section>`,
  },
  {
    name: "solpass-sektion",
    label: "Solpass sektion",
    fields: [
      anchor, variant,
      choice("width", "Bredd", [["bred", "Bred"], ["smal", "Smal (text)"]], "bred"),
      text("heading_level", "Rubriknivå (h1 eller h2)", "h2"),
      text("heading", "Rubrik"),
      rich("lead", "Ingress"),
      rich("content", "Brödtext"),
      choice("cols", "Kort per rad", [["2", "2"], ["3", "3"], ["4", "4"]], "3"),
      bool("numbered", "Numrera korten", false),
      repeat("cards", "Kort", [text("title", "Rubrik"), rich("text", "Text"), text("link_text", "Länktext"), text("link_url", "Länk"), text("anchor", "Ankare (t.ex. gestor)")]),
      rich("after", "Text efter korten"),
      buttons,
      rich("note", "Liten text längst ner"),
    ],
    html: `${OPEN}
  <div class="wrap{% if module.width == 'smal' %} narrow{% endif %}">
    {% if module.heading or module.lead %}<div class="sec-head">
      {% if module.heading %}{% if module.heading_level == 'h1' %}<h1>{{ module.heading }}</h1>{% else %}<h2>{{ module.heading }}</h2>{% endif %}{% endif %}
      {% if module.lead %}<div class="lead">{{ module.lead }}</div>{% endif %}
    </div>{% endif %}
    {% if module.content %}<div class="prose">{{ module.content }}</div>{% endif %}
    {% if module.cards|length %}<div class="cards" style="--cols:{{ module.cols }}{% if module.content %};margin-top:40px{% endif %}">
      {% for c in module.cards %}<div class="card"{% if c.anchor %} id="{{ c.anchor|escape_attr }}"{% endif %}>{% if module.numbered %}<div class="n">{{ loop.index }}</div>{% endif %}<h3>{{ c.title }}</h3>{% if c.text %}<div class="txt">{{ c.text }}</div>{% endif %}{% if c.link_url %}<a class="more" href="{{ c.link_url|escape_attr }}">{{ c.link_text or "Läs mer" }} →</a>{% endif %}</div>{% endfor %}
    </div>{% endif %}
    {% if module.after %}<div class="prose" style="margin-top:32px">{{ module.after }}</div>{% endif %}
    ${BUTTONS}
    {% if module.note %}<div class="note">{{ module.note }}</div>{% endif %}
  </div>
</section>`,
  },
  {
    name: "solpass-fragor",
    label: "Solpass frågor",
    fields: [
      anchor, variant,
      text("heading", "Rubrik", "Vanliga frågor"),
      rich("lead", "Ingress"),
      repeat("items", "Frågor", [text("q", "Fråga"), rich("a", "Svar")]),
      buttons,
    ],
    html: `${OPEN}
  <div class="wrap narrow">
    {% if module.heading or module.lead %}<div class="sec-head">{% if module.heading %}<h2>{{ module.heading }}</h2>{% endif %}{% if module.lead %}<div class="lead">{{ module.lead }}</div>{% endif %}</div>{% endif %}
    <div>{% for i in module.items %}<details class="qa"><summary>{{ i.q }}</summary><div class="a">{{ i.a }}</div></details>{% endfor %}</div>
    ${BUTTONS}
  </div>
</section>`,
  },
  {
    name: "solpass-om-oss",
    label: "Solpass om oss",
    fields: [
      anchor, variant,
      text("heading", "Rubrik", "Därför finns Solpass."),
      rich("text", "Text", "<p>Vi är Oliver och Emelie. Vi har två barn och har valt Costa del Sol för vår familj: för vädret, maten och tempot.</p><p>Solpass är guiden vi själva hade velat ha: allt som ska göras, i rätt ordning, och människorna som kan hjälpa till.</p>"),
      text("signature", "Namn", "Oliver Lopez och Emelie Svedberg"),
      { name: "image", label: "Foto", type: "image", required: false, locked: false, responsive: true, resizable: false, default: { src: "", alt: "Oliver och Emelie", loading: "lazy" } },
    ],
    html: `${OPEN}
  <div class="wrap two">
    <div class="stack">
      <h2>{{ module.heading }}</h2>
      <div class="lead">{{ module.text }}</div>
      {% if module.signature %}<p class="sign">{{ module.signature }}</p>{% endif %}
    </div>
    {% if module.image.src %}<div class="photo"><img src="{{ module.image.src }}" alt="{{ module.image.alt|escape_attr }}" loading="lazy"></div>
    {% else %}<div class="photo tom" role="img" aria-label="Foto på Oliver och Emelie kommer">Foto på Oliver och Emelie</div>{% endif %}
  </div>
</section>`,
  },
  {
    name: "solpass-formular",
    label: "Solpass formulär",
    fields: [
      anchor, variant,
      choice("layout", "Layout", [["sida", "Text till vänster, formulär till höger"], ["under", "Formulär under texten"]], "sida"),
      text("heading", "Rubrik"),
      rich("lead", "Ingress"),
      rich("content", "Text"),
      { name: "form", label: "Formulär", type: "form", required: false, locked: false, default: { response_type: "inline", message: "<p>Tack! Vi har tagit emot det.</p>" } },
      rich("note", "Liten text under formuläret"),
    ],
    html: `${OPEN}
  <div class="wrap{% if module.layout == 'sida' %} two top{% else %} narrow{% endif %}">
    <div class="stack">
      {% if module.heading %}<h2>{{ module.heading }}</h2>{% endif %}
      {% if module.lead %}<div class="lead">{{ module.lead }}</div>{% endif %}
      {% if module.content %}<div class="prose">{{ module.content }}</div>{% endif %}
    </div>
    <div>
      <div class="formcard"{% if module.layout != 'sida' %} style="margin-top:24px"{% endif %}>
        {% if module.form.form_id %}{% form form_to_use="{{ module.form.form_id }}" response_response_type="{{ module.form.response_type }}" response_message="{{ module.form.message }}" response_redirect_id="{{ module.form.redirect_id }}" response_redirect_url="{{ module.form.redirect_url }}" %}
        {% else %}<p class="muted small">Välj ett formulär i modulens inställningar.</p>{% endif %}
      </div>
      {% if module.note %}<div class="note">{{ module.note }}</div>{% endif %}
    </div>
  </div>
</section>`,
  },
];

if (require.main === module) {
  const fs = require("fs"), path = require("path");
  const out = process.argv[2] || path.join(__dirname, "out");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "content-modules.json"), JSON.stringify(module.exports));
  fs.copyFileSync(path.join(__dirname, "templates/solpass-sida.html"), path.join(out, "solpass-sida.html"));
  console.log("wrote", module.exports.length, "modules");
}

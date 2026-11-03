/* Solpass vy: the few behaviours the demo views had, for static HTML. Each root works on its own. */
(function () {
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return (s || "").toLowerCase(); };

  // HubSpot forms (rendered by the module) into the visible slot for each; a page can have several views sharing one form
  function forms(root) {
    qsa("[data-hsf-key]", root).forEach(function (src) {
      var key = src.getAttribute("data-hsf-key");
      var slot = qsa('.hsf[data-form="' + key + '"]', root).filter(function (s) { return !s.closest("[hidden]"); })[0];
      if (slot && src.parentElement !== slot) slot.appendChild(src);
    });
  }

  // partner type switcher (button + list)
  function ptSwitch(root) {
    qsa(".ptswitch", root).forEach(function (sw) {
      var btn = sw.querySelector(".ptbtn"), list = sw.querySelector(".ptlist");
      if (!btn || !list) return;
      btn.addEventListener("click", function () { list.hidden = !list.hidden; btn.setAttribute("aria-expanded", String(!list.hidden)); });
      document.addEventListener("click", function (e) { if (!list.hidden && !sw.contains(e.target)) { list.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !list.hidden) { list.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
    });
  }

  // FAQ search: hide questions that do not match, and groups left empty
  function faqSearch(root) {
    var input = root.querySelector("input.search");
    if (!input) return;
    var items = qsa("details.qa", root);
    var empty = document.createElement("p");
    empty.className = "lead"; empty.style.marginTop = "24px"; empty.hidden = true;
    empty.innerHTML = 'Inget svar matchar. <a href="/fraga">Ställ frågan</a>, så blir den ett nytt svar.';
    if (items.length) items[items.length - 1].parentElement.parentElement.appendChild(empty);
    input.addEventListener("input", function () {
      var f = norm(input.value.trim()), any = false;
      items.forEach(function (d) { var hit = !f || norm(d.textContent).indexOf(f) > -1; d.hidden = !hit; d.open = !!f && hit; any = any || hit; });
      qsa("details.qa", root).map(function (d) { return d.parentElement; }).filter(function (g, i, a) { return a.indexOf(g) === i; })
        .forEach(function (g) { g.hidden = !qsa("details.qa", g).some(function (d) { return !d.hidden; }); });
      empty.hidden = any;
    });
  }

  // filter buttons on the schools and contacts pages
  function filters(root) {
    qsa(".filters", root).forEach(function (bar) {
      var buttons = qsa("button", bar);
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          var sf = b.getAttribute("data-sf"), cf = b.getAttribute("data-f");
          if (sf) {
            qsa(".school", root).forEach(function (s) { s.hidden = sf !== "Alla" && !qsa(".tag", s).some(function (t) { return t.textContent === sf; }); });
            qsa(".sgroup", root).forEach(function (g) { g.hidden = !qsa(".school", g).some(function (s) { return !s.hidden; }); });
          }
          if (cf) {
            qsa(".ccard", root).forEach(function (c) {
              var k = (c.querySelector(".k") || {}).textContent, partner = !c.querySelector("a.ext");
              c.hidden = !(cf === "alla" || (cf === "partner" ? partner : k === cf));
            });
          }
        });
      });
    });
  }

  // document vault: status per document, kept in this browser
  function docs(root) {
    var selects = qsa("select[data-doc]", root);
    if (!selects.length) return;
    var KEY = "solpass.docs.v1", st = {};
    try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    var count = qsa("p.small.muted", root).filter(function (p) { return /dokument klara/.test(p.textContent); })[0];
    var update = function () {
      var have = 0;
      selects.forEach(function (s) { var d = s.closest(".doc"); if (d) d.classList.toggle("has", s.value === "har"); if (s.value === "har") have++; });
      if (count) count.innerHTML = count.innerHTML.replace(/^\d+ av \d+/, have + " av " + selects.length);
    };
    selects.forEach(function (s) {
      s.disabled = false;
      if (st[s.getAttribute("data-doc")]) s.value = st[s.getAttribute("data-doc")];
      s.addEventListener("change", function () { st[s.getAttribute("data-doc")] = s.value; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} update(); });
    });
    update();
  }

  // several views on one page (partner types): the hash picks one, like the demo's #partners/gestor
  function views(root) {
    var all = qsa(".ptview", root);
    if (!all.length) return;
    var base = document.title;
    var show = function (first) {
      var id = location.hash.slice(1);
      var target = all.filter(function (v) { return v.getAttribute("data-pt") === id; })[0];
      if (!target && id && !first) return; // an anchor inside the current view
      target = target || all[0];
      all.forEach(function (v) { v.hidden = v !== target; });
      var h = target.getAttribute("data-pt") && target.querySelector("h1,h2");
      document.title = h ? h.textContent + " – Solpass" : base;
      if (!first) { window.scrollTo(0, 0); forms(root); }
    };
    window.addEventListener("hashchange", function () { show(false); });
    show(true);
  }

  function init(root) {
    if (root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");
    views(root); forms(root); ptSwitch(root); faqSearch(root); filters(root); docs(root);
  }
  var run = function () { qsa(".dv").forEach(init); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();

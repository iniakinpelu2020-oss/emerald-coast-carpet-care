/* Emerald Coast Carpet Care — room calculator */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + n; };

  var PHONE = "+18506128840";
  var TZ = "America/Chicago";
  var PRICES = { rooms3: 129, rooms5: 199, sofa: 115, rug: 85, pet: 65 };
  var LABELS = {
    rooms3: "3-Room Steam",
    rooms5: "5-Room Whole-Home",
    sofa: "Sofa / Sectional",
    rug: "Area Rug Wash",
    pet: "Pet Enzyme Treatment"
  };

  var state = { pkg: "rooms3", sofa: 0, rug: 0, pet: false };

  /* ---------- boot failsafe ---------- */
  var boot = $("#boot");
  if (boot) {
    window.setTimeout(function () {
      if (boot && boot.parentNode) { boot.parentNode.removeChild(boot); }
    }, 2600);
  }

  /* ---------- today in Pensacola ---------- */
  (function today() {
    var rows = $$(".hours tr[data-day]");
    if (!rows.length) { return; }
    var label;
    try {
      label = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(new Date());
    } catch (err) {
      label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    }
    rows.forEach(function (row) {
      if (row.getAttribute("data-day") === label) {
        row.classList.add("is-today");
        var cell = $(".hours__now", row);
        if (cell) { cell.textContent = "Today"; }
      }
    });
  })();

  /* ---------- elements ---------- */
  var totalEl = $("#calcTotal");
  var subEl = $("#calcSub");
  var listEl = $("#calcList");
  var drawerNum = $("#drawerNum");
  var drawerSub = $("#drawerSub");
  var drawerList = $("#drawerList");
  var drawerCall = $("#drawerCall");
  var drawerText = $("#drawerText");
  var petToggle = $("#petToggle");

  var pkgPills = $$('.pills[data-group="package"] .pill');
  var qtyEls = $$("[data-qty]");

  function items() {
    var out = [{ label: state.pkg === "rooms5" ? LABELS.rooms5 : LABELS.rooms3, amount: PRICES[state.pkg] }];
    if (state.sofa) { out.push({ label: LABELS.sofa + " × " + state.sofa, amount: PRICES.sofa * state.sofa }); }
    if (state.rug) { out.push({ label: LABELS.rug + " × " + state.rug, amount: PRICES.rug * state.rug }); }
    if (state.pet) { out.push({ label: LABELS.pet, amount: PRICES.pet }); }
    return out;
  }

  function message(rows, total) {
    var parts = rows.map(function (r) { return r.label + " " + money(r.amount); });
    return "Hi Emerald Coast — booking from your site: " + parts.join(" · ") + " = " + money(total) + " (starting). Can you confirm a time?";
  }

  function render(pop) {
    var rows = items();
    var total = rows.reduce(function (s, r) { return s + r.amount; }, 0);
    var sub = (state.pkg === "rooms5" ? "5 rooms + hallway" : "3 rooms");
    var extra = (state.sofa ? 1 : 0) + (state.rug ? 1 : 0) + (state.pet ? 1 : 0);
    if (extra) { sub += " · " + extra + (extra === 1 ? " add-on" : " add-ons"); }

    if (totalEl) {
      totalEl.textContent = money(total);
      if (pop) {
        totalEl.classList.add("pop");
        window.setTimeout(function () { totalEl.classList.remove("pop"); }, 220);
      }
    }
    if (subEl) { subEl.textContent = sub; }

    var html = rows.map(function (r) {
      return "<li><span>" + r.label + "</span><span>" + (r.amount ? money(r.amount) : "Included") + "</span></li>";
    }).join("");
    if (listEl) { listEl.innerHTML = html; }
    if (drawerNum) { drawerNum.textContent = money(total); }
    if (drawerSub) { drawerSub.textContent = sub; }
    if (drawerList) { drawerList.innerHTML = html; }
    if (drawerCall) { drawerCall.href = "tel:" + PHONE; }
    if (drawerText) { drawerText.href = "sms:" + PHONE + "?&body=" + encodeURIComponent(message(rows, total)); }

    pkgPills.forEach(function (p) {
      p.setAttribute("aria-pressed", p.getAttribute("data-item") === state.pkg ? "true" : "false");
    });

    qtyEls.forEach(function (el) {
      var key = el.getAttribute("data-qty");
      el.textContent = state[key] || 0;
    });

    $$(".addon").forEach(function (row) {
      var key = row.getAttribute("data-item");
      var on = key === "pet" ? state.pet : state[key] > 0;
      row.classList.toggle("is-on", !!on);
    });

    if (petToggle) { petToggle.checked = state.pet; }

    $$(".room[data-item]").forEach(function (card) {
      var key = card.getAttribute("data-item");
      var on = (key === "rooms3" || key === "rooms5") ? state.pkg === key
        : (key === "pet" ? state.pet : state[key] > 0);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function bump(key, delta) {
    var next = Math.max(0, Math.min(6, (state[key] || 0) + delta));
    state[key] = next;
    render(delta > 0);
  }

  /* ---------- package pills ---------- */
  pkgPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      state.pkg = pill.getAttribute("data-item") === "rooms5" ? "rooms5" : "rooms3";
      render(true);
    });
  });

  /* ---------- steppers ---------- */
  $$(".stepper").forEach(function (stepper) {
    var row = stepper.closest(".addon");
    var key = row ? row.getAttribute("data-item") : null;
    if (!key) { return; }
    $$("button", stepper).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.getAttribute("data-step"), 10) || 0;
        bump(key, dir);
      });
    });
  });

  /* ---------- pet switch ---------- */
  if (petToggle) {
    petToggle.addEventListener("change", function () {
      state.pet = petToggle.checked;
      render(state.pet);
    });
  }

  /* ---------- room cards ---------- */
  $$(".room[data-item]").forEach(function (card) {
    var act = function () {
      var key = card.getAttribute("data-item");
      if (key === "rooms3" || key === "rooms5") {
        state.pkg = key;
        render(true);
        return;
      }
      if (key === "pet") {
        state.pet = !state.pet;
        render(state.pet);
        return;
      }
      bump(key, 1);
    };
    card.addEventListener("click", act);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      }
    });
  });

  render(false);

  /* ---------- drawer ---------- */
  var drawer = $("#drawer");
  var scrim = $("#scrim");
  var drawerClose = $("#drawerClose");
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) { return; }
    lastFocus = document.activeElement;
    render(false);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) { scrim.hidden = false; window.requestAnimationFrame(function () { scrim.classList.add("is-open"); }); }
    document.body.style.overflow = "hidden";
    if (drawerClose) { drawerClose.focus(); }
  }

  function closeDrawer() {
    if (!drawer) { return; }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) {
      scrim.classList.remove("is-open");
      window.setTimeout(function () { if (!drawer.classList.contains("is-open")) { scrim.hidden = true; } }, 400);
    }
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  $$("[data-open-estimate]").forEach(function (b) { b.addEventListener("click", openDrawer); });
  if (drawerClose) { drawerClose.addEventListener("click", closeDrawer); }
  if (scrim) { scrim.addEventListener("click", closeDrawer); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) { closeDrawer(); }
  });
})();

/* build r2 */

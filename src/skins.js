(function () {
  "use strict";

  const STORAGE_KEY = "hssae.locker.v1";
  const CREDIT_PER_ENTRY_DOLLAR = 100;

  const skins = [
    { id: "varsity-blue-chrome", weapon: "Varsity Marker", name: "Blue Chrome", rarity: "common", color: [0.25, 0.78, 1.0], tier: 1 },
    { id: "varsity-campus-green", weapon: "Varsity Marker", name: "Campus Green", rarity: "common", color: [0.36, 0.92, 0.52], tier: 1 },
    { id: "hallpass-graphite", weapon: "Hall Pass Classic", name: "Graphite Pass", rarity: "common", color: [0.62, 0.68, 0.73], tier: 1 },
    { id: "hallpass-copper", weapon: "Hall Pass Classic", name: "Copper Pass", rarity: "common", color: [0.95, 0.52, 0.28], tier: 1 },
    { id: "knife-matte", weapon: "Foam Knife", name: "Matte Grip", rarity: "common", color: [0.68, 0.72, 0.78], tier: 1 },
    { id: "pep-prism", weapon: "Pep Rally Sprayer", name: "Pep Prism", rarity: "rare", color: [0.8, 0.38, 1.0], tier: 1 },
    { id: "eagle-gold-pass", weapon: "Eagle Marker", name: "Gold Hall Pass", rarity: "rare", color: [1.0, 0.76, 0.24], tier: 1 },
    { id: "dmr-yearbook", weapon: "Honor Roll DMR", name: "Yearbook Mint", rarity: "rare", color: [0.34, 1.0, 0.78], tier: 2 },
    { id: "awp-yearbook-scope", weapon: "AWP Marker", name: "Yearbook Scope", rarity: "rare", color: [0.74, 0.94, 1.0], tier: 2 },
    { id: "flame-cafeteria-heat", weapon: "Foam Flamethrower", name: "Cafeteria Heat", rarity: "rare", color: [1.0, 0.48, 0.16], tier: 2 },
    { id: "varsity-homecoming", weapon: "Varsity Marker", name: "Homecoming", rarity: "epic", color: [1.0, 0.3, 0.68], tier: 2 },
    { id: "eagle-attendance", weapon: "Eagle Marker", name: "Perfect Attendance", rarity: "epic", color: [0.28, 0.92, 1.0], tier: 2 },
    { id: "awp-skyline", weapon: "AWP Marker", name: "Open Campus Skyline", rarity: "epic", color: [0.44, 0.62, 1.0], tier: 3 },
    { id: "flame-lab-safety", weapon: "Foam Flamethrower", name: "Lab Safety", rarity: "epic", color: [0.92, 1.0, 0.34], tier: 3 },
    { id: "awp-valedictorian", weapon: "AWP Marker", name: "Valedictorian", rarity: "legendary", color: [1.0, 0.86, 0.32], tier: 3 },
    { id: "flame-stadium-lights", weapon: "Foam Flamethrower", name: "Stadium Lights", rarity: "legendary", color: [1.0, 0.36, 0.24], tier: 3 }
  ];

  const cases = [
    {
      id: "freshman",
      name: "Freshman Case",
      cost: 350,
      tier: 1,
      description: "Starter skins for core round gear.",
      weights: { common: 76, rare: 22, epic: 2, legendary: 0 }
    },
    {
      id: "varsity",
      name: "Varsity Case",
      cost: 950,
      tier: 2,
      description: "Better odds and stronger weapon skins.",
      weights: { common: 50, rare: 38, epic: 11, legendary: 1 }
    },
    {
      id: "final-bell",
      name: "Final Bell Case",
      cost: 2200,
      tier: 3,
      description: "Full pool with the rarest drops.",
      weights: { common: 33, rare: 42, epic: 21, legendary: 4 }
    }
  ];

  const defaultStore = {
    credits: 0,
    inventory: {},
    selected: {},
    round: { kills: 0, deaths: 0, headshots: 0, backstabs: 0 },
    lifetime: { kills: 0, deaths: 0, headshots: 0, backstabs: 0, rounds: 0, creditsEarned: 0 },
    lastPayout: null,
    lastDrop: null,
    payments: []
  };

  let store = loadStore();
  let initialized = false;

  const api = {
    init,
    recordKill,
    recordDeath,
    completeRound,
    getSkinColor,
    getSelectedSkin,
    getState: () => clone(store)
  };

  window.hssSkins = api;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    if (initialized) {
      render();
      return;
    }
    initialized = true;
    injectStyles();

    const caseGrid = document.getElementById("caseGrid");
    const inventory = document.getElementById("skinInventory");
    const paymentButton = document.getElementById("paymentRecordButton");

    if (caseGrid) {
      caseGrid.addEventListener("click", (event) => {
        const card = event.target.closest("[data-case-id]");
        if (card) openCase(card.dataset.caseId);
      });
    }

    if (inventory) {
      inventory.addEventListener("click", (event) => {
        const card = event.target.closest("[data-skin-id]");
        if (card) equipSkin(card.dataset.skinId);
      });
    }

    if (paymentButton) {
      paymentButton.addEventListener("click", recordPaymentEntry);
    }

    render();
  }

  function recordKill(event = {}) {
    store.round.kills += 1;
    store.lifetime.kills += 1;
    if (event.headshot) {
      store.round.headshots += 1;
      store.lifetime.headshots += 1;
    }
    if (event.backstab) {
      store.round.backstabs += 1;
      store.lifetime.backstabs += 1;
    }
    saveStore();
    render();
  }

  function recordDeath() {
    store.round.deaths += 1;
    store.lifetime.deaths += 1;
    saveStore();
    render();
  }

  function completeRound(result = {}) {
    const kills = store.round.kills;
    const deaths = store.round.deaths;
    const headshots = store.round.headshots;
    const backstabs = store.round.backstabs;
    const kdr = deaths === 0 ? kills : kills / Math.max(1, deaths);
    const headshotRate = kills === 0 ? 0 : headshots / kills;
    const winBonus = result.won ? 125 : 45;
    const payout = Math.round(winBonus + kills * 45 + headshots * 35 + backstabs * 45 + Math.max(0, kdr - 1) * 30 + headshotRate * 160);

    store.credits += payout;
    store.lifetime.rounds += 1;
    store.lifetime.creditsEarned += payout;
    store.lastPayout = {
      credits: payout,
      kills,
      deaths,
      headshots,
      backstabs,
      kdr,
      headshotRate,
      won: Boolean(result.won),
      at: Date.now()
    };
    store.round = { kills: 0, deaths: 0, headshots: 0, backstabs: 0 };
    saveStore();
    render();
  }

  function getSelectedSkin(weaponName) {
    const skinId = store.selected[weaponName];
    if (!skinId || !store.inventory[skinId]) return null;
    return skins.find((skin) => skin.id === skinId) || null;
  }

  function getSkinColor(weaponName, fallback) {
    const skin = getSelectedSkin(weaponName);
    return skin ? skin.color : fallback;
  }

  function openCase(caseId) {
    const caseDef = cases.find((entry) => entry.id === caseId);
    if (!caseDef || store.credits < caseDef.cost) return;
    const skin = rollSkin(caseDef);
    store.credits -= caseDef.cost;
    store.inventory[skin.id] = (store.inventory[skin.id] || 0) + 1;
    if (!store.selected[skin.weapon]) store.selected[skin.weapon] = skin.id;
    store.lastDrop = { skinId: skin.id, caseId, at: Date.now() };
    saveStore();
    render();
  }

  function equipSkin(skinId) {
    const skin = skins.find((entry) => entry.id === skinId);
    if (!skin || !store.inventory[skinId]) return;
    store.selected[skin.weapon] = skin.id;
    saveStore();
    render();
  }

  function rollSkin(caseDef) {
    const rarity = weightedChoice(caseDef.weights);
    const exact = skins.filter((skin) => skin.rarity === rarity && skin.tier <= caseDef.tier);
    const pool = exact.length ? exact : skins.filter((skin) => skin.tier <= caseDef.tier);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function recordPaymentEntry() {
    const referenceInput = document.getElementById("paymentReference");
    const amountInput = document.getElementById("paymentAmount");
    const amount = Math.max(1, Math.min(100, Math.round(Number(amountInput && amountInput.value) || 0)));
    const reference = sanitizeText(referenceInput && referenceInput.value ? referenceInput.value : "local-entry");
    const credits = amount * CREDIT_PER_ENTRY_DOLLAR;

    store.credits += credits;
    store.payments.unshift({
      reference,
      amount,
      credits,
      status: "local",
      at: Date.now()
    });
    store.payments = store.payments.slice(0, 8);
    if (referenceInput) referenceInput.value = "";
    saveStore();
    render();
  }

  function render() {
    const credits = document.getElementById("lockerCredits");
    const payout = document.getElementById("lockerPayout");
    const stats = document.getElementById("lockerStats");
    const caseGrid = document.getElementById("caseGrid");
    const inventory = document.getElementById("skinInventory");
    const paymentLog = document.getElementById("paymentLog");
    if (!credits || !stats || !caseGrid || !inventory) return;

    credits.textContent = String(store.credits);
    payout.textContent = store.lastPayout
      ? `Last round: +${store.lastPayout.credits} credits from ${store.lastPayout.kills} KOs, ${formatKdr(store.lastPayout.kdr)} KDR, ${formatPercent(store.lastPayout.headshotRate)} HS.`
      : "Finish rounds to earn credits from KOs, KDR, and headshot rate.";

    stats.innerHTML = [
      statCard("Round KOs", store.round.kills),
      statCard("Round Deaths", store.round.deaths),
      statCard("Round KDR", formatKdr(currentKdr())),
      statCard("Round HS%", formatPercent(currentHeadshotRate())),
      statCard("Lifetime KOs", store.lifetime.kills),
      statCard("Credits Earned", store.lifetime.creditsEarned)
    ].join("");

    caseGrid.innerHTML = cases.map((caseDef) => {
      const locked = store.credits < caseDef.cost;
      const odds = describeOdds(caseDef.weights);
      return `
        <button class="case-card${locked ? " locked" : ""}" type="button" data-case-id="${caseDef.id}" ${locked ? "disabled" : ""}>
          <span>${caseDef.cost} credits</span>
          <strong>${caseDef.name}</strong>
          <small>${caseDef.description}</small>
          <em>${odds}</em>
        </button>
      `;
    }).join("");

    const owned = skins.filter((skin) => store.inventory[skin.id]);
    inventory.innerHTML = owned.length
      ? owned.map(renderSkinCard).join("")
      : `<div class="stat-card"><span>Inventory</span><strong>Empty</strong><small>Open cases with Campus Credits.</small></div>`;

    if (paymentLog) {
      paymentLog.innerHTML = store.payments.length
        ? store.payments.map((entry) => `
          <div>
            <span>${entry.reference}</span>
            <strong>+${entry.credits} credits</strong>
          </div>
        `).join("")
        : `<div><span>No entries</span><strong>Local only</strong></div>`;
    }
  }

  function renderSkinCard(skin) {
    const count = store.inventory[skin.id] || 0;
    const equipped = store.selected[skin.weapon] === skin.id;
    return `
      <button class="skin-card ${skin.rarity}${equipped ? " equipped" : ""}" type="button" data-skin-id="${skin.id}">
        <span>${skin.rarity}</span>
        <strong>${skin.name}</strong>
        <small>${skin.weapon}${count > 1 ? ` x${count}` : ""}</small>
        <div class="skin-swatch" style="--skin-color: ${cssColor(skin.color)}"></div>
        <em>${equipped ? "Equipped" : "Equip"}</em>
      </button>
    `;
  }

  function statCard(label, value) {
    return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function currentKdr() {
    return store.round.deaths === 0 ? store.round.kills : store.round.kills / Math.max(1, store.round.deaths);
  }

  function currentHeadshotRate() {
    return store.round.kills === 0 ? 0 : store.round.headshots / store.round.kills;
  }

  function formatKdr(value) {
    return Number(value).toFixed(2);
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function describeOdds(weights) {
    return `Epic ${weights.epic}% / Legendary ${weights.legendary}%`;
  }

  function weightedChoice(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return key;
    }
    return entries[0][0];
  }

  function cssColor(rgb) {
    return `rgb(${rgb.map((channel) => Math.round(channel * 255)).join(" ")})`;
  }

  function sanitizeText(value) {
    return String(value).replace(/[^\w .:-]/g, "").slice(0, 32) || "local-entry";
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return normalizeStore(parsed);
    } catch (error) {
      return clone(defaultStore);
    }
  }

  function normalizeStore(value) {
    const base = clone(defaultStore);
    if (!value || typeof value !== "object") return base;
    return {
      credits: Number.isFinite(value.credits) ? value.credits : base.credits,
      inventory: value.inventory && typeof value.inventory === "object" ? value.inventory : base.inventory,
      selected: value.selected && typeof value.selected === "object" ? value.selected : base.selected,
      round: { ...base.round, ...(value.round || {}) },
      lifetime: { ...base.lifetime, ...(value.lifetime || {}) },
      lastPayout: value.lastPayout || null,
      lastDrop: value.lastDrop || null,
      payments: Array.isArray(value.payments) ? value.payments.slice(0, 8) : base.payments
    };
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.warn("Could not save locker data", error);
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function injectStyles() {
    if (document.getElementById("lockerDynamicStyles")) return;
    const style = document.createElement("style");
    style.id = "lockerDynamicStyles";
    style.textContent = `
      .menu-tabs { grid-template-columns: repeat(5, minmax(76px, 1fr)); min-width: min(520px, 100%); }
      .locker-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
      .locker-toolbar small { color: var(--muted); font-weight: 800; text-align: right; }
      .currency-pill { display: flex; align-items: center; gap: 10px; min-height: 38px; padding: 0 12px; border: 1px solid rgba(149, 245, 109, 0.42); border-radius: 8px; background: rgba(149, 245, 109, 0.12); }
      .currency-pill span, .payment-entry span, .payment-log span { color: var(--muted); font-size: 11px; font-weight: 900; text-transform: uppercase; }
      .currency-pill strong { color: var(--lime); }
      .locker-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 10px; max-height: min(560px, calc(100vh - 250px)); overflow: auto; padding-right: 4px; }
      .locker-panel { min-height: 156px; padding: 14px; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; background: rgba(255, 255, 255, 0.075); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); }
      .locker-panel.wide { grid-column: 1 / -1; }
      .locker-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 12px; }
      .locker-heading strong { font-size: 18px; }
      .stat-grid, .case-grid, .skin-grid { display: grid; gap: 10px; }
      .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stat-card, .case-card, .skin-card { min-width: 0; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; background: rgba(0, 0, 0, 0.17); }
      .stat-card { min-height: 72px; padding: 12px; }
      .stat-card span, .case-card span, .skin-card span { display: block; color: var(--muted); font-size: 11px; font-weight: 900; text-transform: uppercase; }
      .stat-card strong { display: block; margin-top: 8px; font-size: 26px; line-height: 1; }
      .case-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .case-card, .skin-card { color: var(--ink); text-align: left; transition: transform 120ms ease, border-color 120ms ease, background 120ms ease; }
      .case-card:hover, .skin-card:hover { transform: translateY(-1px); border-color: rgba(69, 217, 255, 0.34); background: rgba(255, 255, 255, 0.095); }
      .case-card { min-height: 152px; padding: 13px; cursor: pointer; }
      .case-card strong, .skin-card strong { display: block; margin-top: 10px; font-size: 18px; line-height: 1.08; }
      .case-card small, .skin-card small { display: block; margin-top: 8px; color: var(--muted); font-size: 12px; line-height: 1.35; }
      .case-card em, .skin-card em { display: inline-flex; margin-top: 10px; color: var(--amber); font-style: normal; font-size: 12px; font-weight: 900; }
      .case-card.locked { opacity: 0.64; }
      .skin-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .skin-card { min-height: 150px; padding: 12px; }
      .skin-card.equipped { border-color: rgba(149, 245, 109, 0.58); background: rgba(149, 245, 109, 0.11); }
      .skin-swatch { width: 100%; height: 24px; margin-top: 10px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 6px; background: var(--skin-color); }
      .skin-card.common { border-color: rgba(255, 255, 255, 0.16); }
      .skin-card.rare { border-color: rgba(92, 200, 255, 0.44); }
      .skin-card.epic { border-color: rgba(196, 118, 255, 0.48); }
      .skin-card.legendary { border-color: rgba(255, 184, 77, 0.56); }
      .payment-entry { display: grid; grid-template-columns: minmax(180px, 1fr) 110px auto; gap: 10px; align-items: end; }
      .payment-entry label { display: grid; gap: 6px; }
      .payment-entry input { width: 100%; min-width: 0; min-height: 38px; color: var(--ink); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 6px; background: rgba(0, 0, 0, 0.22); padding: 0 10px; font-weight: 800; outline: none; }
      .payment-log { display: grid; gap: 8px; margin-top: 12px; }
      .payment-log div { display: flex; justify-content: space-between; gap: 10px; min-height: 34px; padding: 8px 10px; border: 1px solid rgba(255, 255, 255, 0.11); border-radius: 6px; background: rgba(255, 255, 255, 0.055); color: var(--muted); font-size: 12px; font-weight: 800; }
      @media (max-width: 760px) {
        .locker-grid, .case-grid, .skin-grid, .stat-grid, .payment-entry { grid-template-columns: 1fr; }
        .locker-toolbar, .payment-log div { align-items: stretch; flex-direction: column; }
        .locker-toolbar small { text-align: left; }
      }
    `;
    document.head.appendChild(style);
  }
})();

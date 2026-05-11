(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const unsupported = document.getElementById("unsupported");
  const diagnostics = document.getElementById("webglDiagnostics");
  const contextOptions = { antialias: true, alpha: false };
  const contextErrors = [];
  canvas.addEventListener("webglcontextcreationerror", (event) => {
    if (event.statusMessage) contextErrors.push(event.statusMessage);
  });

  const gl = createRenderingContext(canvas, contextOptions, contextErrors);
  const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

  if (!gl) {
    unsupported.hidden = false;
    if (diagnostics) diagnostics.textContent = buildWebGLDiagnostics(contextErrors);
    return;
  }

  document.body.dataset.webgl = isWebGL2 ? "webgl2" : "webgl";
  canvas.title = `Rendering with ${document.body.dataset.webgl.toUpperCase()}`;

  const ui = {
    hud: document.getElementById("hud"),
    menu: document.getElementById("menu"),
    menuSubtitle: document.getElementById("menuSubtitle"),
    menuTabs: document.querySelectorAll("[data-menu-view]"),
    menuViews: document.querySelectorAll("[data-view]"),
    nameTags: document.getElementById("nameTags"),
    playerNameInput: document.getElementById("playerNameInput"),
    onlineNameInput: document.getElementById("onlineNameInput"),
    homeNetworkStatus: document.getElementById("homeNetworkStatus"),
    networkRole: document.getElementById("networkRole"),
    networkStatus: document.getElementById("networkStatus"),
    peerCount: document.getElementById("peerCount"),
    localSignal: document.getElementById("localSignal"),
    remoteSignal: document.getElementById("remoteSignal"),
    hostOfferButton: document.getElementById("hostOfferButton"),
    joinOfferButton: document.getElementById("joinOfferButton"),
    acceptAnswerButton: document.getElementById("acceptAnswerButton"),
    disconnectButton: document.getElementById("disconnectButton"),
    startButton: document.getElementById("startButton"),
    resetButton: document.getElementById("resetButton"),
    resetSettingsButton: document.getElementById("resetSettingsButton"),
    loadoutGrid: document.getElementById("loadoutGrid"),
    cashValue: document.getElementById("cashValue"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsCount: document.getElementById("settingsCount"),
    matchSummary: document.getElementById("matchSummary"),
    homeWeapon: document.getElementById("homeWeapon"),
    homeRenderMode: document.getElementById("homeRenderMode"),
    homeFov: document.getElementById("homeFov"),
    playerScore: document.getElementById("playerScore"),
    enemyScore: document.getElementById("enemyScore"),
    roundLabel: document.getElementById("roundLabel"),
    roundTimer: document.getElementById("roundTimer"),
    healthValue: document.getElementById("healthValue"),
    healthBar: document.getElementById("healthBar"),
    armorValue: document.getElementById("armorValue"),
    armorBar: document.getElementById("armorBar"),
    staminaValue: document.getElementById("staminaValue"),
    staminaBar: document.getElementById("staminaBar"),
    weaponName: document.getElementById("weaponName"),
    ammoCount: document.getElementById("ammoCount"),
    reserveCount: document.getElementById("reserveCount"),
    reloadBar: document.getElementById("reloadBar"),
    weaponSlots: document.getElementById("weaponSlots"),
    dashButton: document.getElementById("dashButton"),
    dashCooldown: document.getElementById("dashCooldown"),
    grenadeCooldown: document.getElementById("grenadeCooldown"),
    meleeCooldown: document.getElementById("meleeCooldown"),
    crosshair: document.getElementById("crosshair"),
    killFeed: document.getElementById("killFeed"),
    damageFlash: document.getElementById("damageFlash"),
    roundBanner: document.getElementById("roundBanner"),
    roundBannerTitle: document.getElementById("roundBannerTitle"),
    roundBannerText: document.getElementById("roundBannerText"),
    minimap: document.getElementById("minimap")
  };

  const mini = ui.minimap.getContext("2d");

  const TAU = Math.PI * 2;
  const MAP_SCALE = 5;
  const WORLD_LIMIT = 25 * MAP_SCALE;
  const EYE_HEIGHT = 1.62;
  const PLAYER_RADIUS = 0.42;
  const ROUND_SECONDS = 300;
  const SCORE_LIMIT = 35;
  const PLAYER_MOVE_SPEED = 8.4;
  const PLAYER_SPRINT_SPEED = 11.2;
  const PLAYER_CROUCH_SPEED = 4.8;
  const PLAYER_ADS_SPEED = 5.4;
  const PLAYER_JUMP_POWER = 7.2;
  const PLAYER_DASH_POWER = 16;
  const PLAYER_DASH_COOLDOWN = 4.2;
  const PLAYER_MAX_HEALTH = 100;
  const PLAYER_MAX_ARMOR = 25;
  const PLAYER_MAX_STAMINA = 100;
  const STAMINA_SPRINT_DRAIN = 18;
  const STAMINA_SLIDE_COST = 18;
  const STAMINA_REGEN = 30;
  const STAMINA_REGEN_DELAY = 0.65;
  const STAMINA_EXHAUST_RECOVER = 32;
  const PICKUP_HEAL = 28;
  const PICKUP_RESPAWN = 10;
  const BOT_SIGHT_RANGE = 140;
  const BOT_DAMAGE = 10;
  const BOT_FIRE_MIN = 0.45;
  const BOT_FIRE_SPREAD = 0.11;
  const GRENADE_COOLDOWN = 7.5;
  const GRENADE_DAMAGE = 62;
  const GRENADE_RADIUS = 7.5;
  const MELEE_COOLDOWN = 1.1;
  const MELEE_DAMAGE = 44;
  const SPAWN_PROTECTION = 1.8;
  const ARMOR_REGEN_DELAY = 5.5;
  const ARMOR_REGEN_RATE = 5;
  const DROP_OFF_START = 0.42;
  const DROP_OFF_MIN = 0.55;
  const START_CASH = 800;
  const MAX_CASH = 16000;
  const KO_CASH = 300;
  const HEADSHOT_CASH = 100;
  const BACKSTAB_CASH = 150;
  const WIN_CASH = 3250;
  const LOSS_CASH = 1900;
  const GRAVITY = 19;
  const SETTINGS_STORAGE_KEY = "hss-american-edition-settings";
  const PLAYER_NAME_STORAGE_KEY = "hss-american-edition-player-name";
  const SIGNAL_VERSION = 1;
  const NETWORK_SEND_INTERVAL = 0.05;
  const NETWORK_TIMEOUT = 5;
  const RTC_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  };

  const DEFAULT_SETTINGS = {
    mouseSensitivity: 1,
    invertX: false,
    invertY: false,
    mouseSmoothing: 0,
    toggleSprint: false,
    toggleSneak: false,
    toggleAim: false,
    fov: 70,
    resolutionScale: 1,
    brightness: 1,
    arenaGlow: true,
    renderTracers: true,
    renderParticles: true,
    showWeapon: true,
    weaponBob: true,
    idleCamera: true,
    hudScale: 1,
    showMinimap: true,
    showNameTags: true,
    showKillFeed: true,
    showHitMarker: true,
    showDamageFlash: true,
    crosshairSize: 64,
    crosshairGap: 8,
    crosshairLength: 13,
    crosshairThickness: 2,
    crosshairDot: true,
    crosshairColor: "#ffffff",
    keybinds: {
      forward: "w",
      backward: "s",
      left: "a",
      right: "d",
      jump: "space",
      sprint: "shift",
      crouch: "control",
      dash: "q",
      reload: "r",
      melee: "f",
      grenade: "g",
      weapon1: "1",
      weapon2: "2",
      weapon3: "3",
      weapon4: "4"
    }
  };

  let settings = loadSettings();
  let playerName = loadPlayerName();

  const weapons = [
    {
      name: "Varsity Marker",
      short: "MARK",
      category: "rifle",
      damage: 24,
      price: 0,
      description: "Balanced foam-marker duels and low recoil.",
      fireRate: 8.4,
      magazineSize: 28,
      reserveSize: 84,
      reloadTime: 1.35,
      range: 135,
      spread: 0.010,
      recoil: 0.010,
      automatic: true,
      color: [0.27, 0.85, 1.0]
    },
    {
      name: "Pep Rally Sprayer",
      short: "PEP",
      category: "rifle",
      damage: 14,
      price: 350,
      description: "Fast close-range hallway pressure.",
      fireRate: 13,
      magazineSize: 36,
      reserveSize: 108,
      reloadTime: 1.1,
      range: 95,
      spread: 0.022,
      recoil: 0.006,
      automatic: true,
      color: [0.58, 0.96, 0.43]
    },
    {
      name: "Hall Pass Classic",
      short: "HPC",
      category: "pistol",
      damage: 24,
      price: 0,
      description: "Reliable free sidearm for every round.",
      fireRate: 4.4,
      magazineSize: 12,
      reserveSize: 48,
      reloadTime: 0.95,
      range: 110,
      spread: 0.012,
      recoil: 0.009,
      headshotMultiplier: 1.65,
      automatic: false,
      color: [0.72, 0.86, 1.0]
    },
    {
      name: "Eagle Marker",
      short: "EAGL",
      category: "pistol",
      damage: 52,
      price: 700,
      description: "Heavy precision sidearm with huge headshot payoff.",
      fireRate: 2.3,
      magazineSize: 8,
      reserveSize: 32,
      reloadTime: 1.05,
      range: 170,
      spread: 0.004,
      recoil: 0.018,
      headshotMultiplier: 2.1,
      automatic: false,
      color: [1.0, 0.72, 0.30]
    },
    {
      name: "Honor Burst",
      short: "HNBR",
      category: "rifle",
      damage: 19,
      price: 700,
      description: "Three-shot burst built for courtyard peeks.",
      fireRate: 9.5,
      burst: 3,
      magazineSize: 30,
      reserveSize: 90,
      reloadTime: 1.45,
      range: 150,
      spread: 0.009,
      recoil: 0.012,
      automatic: false,
      color: [0.78, 0.52, 1.0]
    },
    {
      name: "Hall Pass Auto",
      short: "HPA",
      category: "pistol",
      damage: 18,
      price: 420,
      description: "Quick sidearm for cleanup tags.",
      fireRate: 7.8,
      magazineSize: 16,
      reserveSize: 64,
      reloadTime: 1.05,
      range: 92,
      spread: 0.014,
      recoil: 0.009,
      headshotMultiplier: 1.75,
      automatic: false,
      color: [0.62, 0.82, 1.0]
    },
    {
      name: "Cafeteria Pump",
      short: "PUMP",
      category: "rifle",
      damage: 13,
      price: 900,
      description: "Close-range foam pellet burst.",
      fireRate: 1.35,
      pellets: 7,
      magazineSize: 6,
      reserveSize: 30,
      reloadTime: 1.55,
      range: 58,
      spread: 0.058,
      recoil: 0.032,
      automatic: false,
      color: [1.0, 0.48, 0.28]
    },
    {
      name: "Yearbook Drum",
      short: "DRUM",
      category: "rifle",
      damage: 20,
      price: 1100,
      description: "Huge magazine, slower homeroom handling.",
      fireRate: 7.1,
      magazineSize: 62,
      reserveSize: 124,
      reloadTime: 2.25,
      range: 145,
      spread: 0.017,
      recoil: 0.015,
      automatic: true,
      color: [0.98, 0.78, 0.36]
    },
    {
      name: "Honor Roll DMR",
      short: "DMR",
      category: "rifle",
      damage: 39,
      price: 1300,
      description: "Accurate taps with strong head tags.",
      fireRate: 3.6,
      magazineSize: 14,
      reserveSize: 56,
      reloadTime: 1.4,
      range: 190,
      spread: 0.003,
      recoil: 0.018,
      automatic: false,
      color: [0.34, 1.0, 0.78]
    }
  ];

  const meleeWeapons = [
    {
      name: "Foam Knife",
      short: "KNIFE",
      category: "melee",
      price: 0,
      description: "Fast tag. Backstabs instantly drop bots.",
      damage: 44,
      backstabDamage: 140,
      range: 3.0,
      cooldown: MELEE_COOLDOWN,
      color: [0.92, 0.96, 1.0]
    },
    {
      name: "Hall Monitor Baton",
      short: "BATON",
      category: "melee",
      price: 450,
      description: "Longer reach, weaker backstab burst.",
      damage: 58,
      backstabDamage: 95,
      range: 3.8,
      cooldown: 1.35,
      color: [0.78, 0.9, 1.0]
    }
  ];

  const utilityItems = [
    {
      name: "Confetti Charge",
      short: "CONF",
      category: "utility",
      price: 0,
      description: "Timed foam burst with splash damage.",
      cooldown: GRENADE_COOLDOWN,
      damage: GRENADE_DAMAGE,
      radius: GRENADE_RADIUS,
      color: [1.0, 0.62, 0.22]
    },
    {
      name: "Pep Rally Popper",
      short: "MINE",
      category: "utility",
      price: 650,
      description: "Short-fuse burst with smaller radius.",
      cooldown: 6.0,
      damage: 48,
      radius: 5.4,
      color: [0.42, 0.86, 1.0]
    }
  ];

  const DEFAULT_ROUND_LOADOUT = {
    rifle: "Varsity Marker",
    pistol: "Hall Pass Classic",
    melee: "Foam Knife",
    utility: "Confetti Charge"
  };

  const settingsSchema = [
    { group: "Controls", key: "mouseSensitivity", label: "Mouse Sensitivity", type: "range", min: 0.2, max: 3, step: 0.05, suffix: "x" },
    { group: "Controls", key: "invertX", label: "Invert Horizontal Look", type: "checkbox" },
    { group: "Controls", key: "invertY", label: "Invert Vertical Look", type: "checkbox" },
    { group: "Controls", key: "mouseSmoothing", label: "Mouse Smoothing", type: "range", min: 0, max: 0.85, step: 0.05, suffix: "" },
    { group: "Controls", key: "toggleSprint", label: "Toggle Sprint", type: "checkbox" },
    { group: "Controls", key: "toggleSneak", label: "Toggle Sneak", type: "checkbox" },
    { group: "Controls", key: "toggleAim", label: "Toggle Aim", type: "checkbox" },
    { group: "Keybinds", key: "forward", label: "Move Forward", type: "keybind" },
    { group: "Keybinds", key: "backward", label: "Move Back", type: "keybind" },
    { group: "Keybinds", key: "left", label: "Move Left", type: "keybind" },
    { group: "Keybinds", key: "right", label: "Move Right", type: "keybind" },
    { group: "Keybinds", key: "jump", label: "Jump", type: "keybind" },
    { group: "Keybinds", key: "sprint", label: "Sprint", type: "keybind" },
    { group: "Keybinds", key: "crouch", label: "Crouch / Slide", type: "keybind" },
    { group: "Keybinds", key: "dash", label: "Dash", type: "keybind" },
    { group: "Keybinds", key: "reload", label: "Reload", type: "keybind" },
    { group: "Keybinds", key: "melee", label: "Melee", type: "keybind" },
    { group: "Keybinds", key: "grenade", label: "Grenade", type: "keybind" },
    { group: "Keybinds", key: "weapon1", label: "Weapon 1", type: "keybind" },
    { group: "Keybinds", key: "weapon2", label: "Weapon 2", type: "keybind" },
    { group: "Keybinds", key: "weapon3", label: "Weapon 3", type: "keybind" },
    { group: "Keybinds", key: "weapon4", label: "Weapon 4", type: "keybind" },
    { group: "Video", key: "fov", label: "Field Of View", type: "range", min: 55, max: 105, step: 1, suffix: "°" },
    { group: "Video", key: "resolutionScale", label: "Resolution Scale", type: "range", min: 0.5, max: 1.5, step: 0.05, suffix: "x" },
    { group: "Video", key: "brightness", label: "Brightness", type: "range", min: 0.65, max: 1.4, step: 0.05, suffix: "x" },
    { group: "Video", key: "arenaGlow", label: "Arena Glow", type: "checkbox" },
    { group: "Video", key: "renderTracers", label: "Bullet Tracers", type: "checkbox" },
    { group: "Video", key: "renderParticles", label: "Impact Sparks", type: "checkbox" },
    { group: "Video", key: "showWeapon", label: "Weapon Model", type: "checkbox" },
    { group: "Video", key: "weaponBob", label: "Weapon Bob", type: "checkbox" },
    { group: "Video", key: "idleCamera", label: "Menu Camera Motion", type: "checkbox" },
    { group: "HUD", key: "hudScale", label: "HUD Scale", type: "range", min: 0.75, max: 1.35, step: 0.05, suffix: "x" },
    { group: "HUD", key: "showMinimap", label: "Minimap", type: "checkbox" },
    { group: "HUD", key: "showNameTags", label: "Name Tags", type: "checkbox" },
    { group: "HUD", key: "showKillFeed", label: "Kill Feed", type: "checkbox" },
    { group: "HUD", key: "showHitMarker", label: "Hit Marker", type: "checkbox" },
    { group: "HUD", key: "showDamageFlash", label: "Damage Flash", type: "checkbox" },
    { group: "Crosshair", key: "crosshairSize", label: "Canvas Size", type: "range", min: 36, max: 108, step: 1, suffix: "px" },
    { group: "Crosshair", key: "crosshairGap", label: "Gap", type: "range", min: 2, max: 22, step: 1, suffix: "px" },
    { group: "Crosshair", key: "crosshairLength", label: "Line Length", type: "range", min: 6, max: 28, step: 1, suffix: "px" },
    { group: "Crosshair", key: "crosshairThickness", label: "Line Thickness", type: "range", min: 1, max: 6, step: 1, suffix: "px" },
    { group: "Crosshair", key: "crosshairDot", label: "Center Dot", type: "checkbox" },
    { group: "Crosshair", key: "crosshairColor", label: "Color", type: "color" }
  ];

  const state = {
    running: false,
    paused: false,
    round: 1,
    roundTime: ROUND_SECONDS,
    roundCooldown: 0,
    buyPhase: true,
    cash: START_CASH,
    loadout: { ...DEFAULT_ROUND_LOADOUT },
    playerScore: 0,
    enemyScore: 0,
    activeSlot: "rifle",
    selectedWeapon: findWeaponIndex(DEFAULT_ROUND_LOADOUT.rifle),
    activeWeapon: findWeaponIndex(DEFAULT_ROUND_LOADOUT.rifle),
    lastTime: 0,
    mouseDown: false,
    hitTimer: 0,
    damageTimer: 0,
    recoilKick: 0,
    killFeed: [],
    tracers: [],
    particles: [],
    grenades: [],
    shockwaves: [],
    remotePlayers: new Map(),
    lookDelta: [0, 0],
    keys: new Set(),
    capturingKey: null,
    clientId: createClientId(),
    network: {
      peer: null,
      channel: null,
      role: "local",
      status: "offline",
      sendTimer: 0
    }
  };

  const player = {
    pos: [0, EYE_HEIGHT, 12],
    vel: [0, 0, 0],
    yaw: Math.PI,
    pitch: 0,
    health: 100,
    armor: 25,
    stamina: PLAYER_MAX_STAMINA,
    staminaRegenDelay: 0,
    staminaExhausted: false,
    dead: false,
    respawnTimer: 0,
    aiming: false,
    sprintToggled: false,
    sneakToggled: false,
    crouchAmount: 0,
    slideTimer: 0,
    slideCooldown: 0,
    dashCooldown: 0,
    dashTimer: 0,
    grenadeCooldown: 0,
    meleeCooldown: 0,
    spawnProtection: 0,
    damageRegenDelay: 0,
    spree: 0
  };

  const ammo = weapons.map((weapon) => ({
    magazine: weapon.magazineSize,
    reserve: weapon.reserveSize,
    reloadRemaining: 0,
    reloadTotal: 0,
    fireTimer: 0
  }));

  const playerSpawn = mapPoint(0, EYE_HEIGHT, 19);
  const blueSpawnPoints = [
    mapPoint(-16, EYE_HEIGHT, 17),
    mapPoint(16, EYE_HEIGHT, 17),
    mapPoint(-7, EYE_HEIGHT, 21),
    mapPoint(7, EYE_HEIGHT, 21),
    mapPoint(0, EYE_HEIGHT, 14)
  ];
  const redSpawnPoints = [
    mapPoint(-16, EYE_HEIGHT, -17),
    mapPoint(16, EYE_HEIGHT, -17),
    mapPoint(-7, EYE_HEIGHT, -21),
    mapPoint(7, EYE_HEIGHT, -21),
    mapPoint(0, EYE_HEIGHT, -14)
  ];

  const botRoster = [
    { name: "Nova", team: "blue" },
    { name: "Echo", team: "blue" },
    { name: "Mako", team: "blue" },
    { name: "Iris", team: "blue" },
    { name: "Jett", team: "red" },
    { name: "Knox", team: "red" },
    { name: "Vex", team: "red" },
    { name: "Rune", team: "red" },
    { name: "Sable", team: "red" }
  ];
  const teamColors = {
    blue: [0.24, 0.76, 1.0],
    red: [1.0, 0.26, 0.36]
  };
  const uniformPalettes = {
    blue: {
      blazer: [0.04, 0.14, 0.28],
      sweater: [0.11, 0.29, 0.46],
      tie: [0.24, 0.78, 1.0],
      pants: [0.08, 0.1, 0.16],
      backpack: [0.08, 0.13, 0.18],
      badge: [0.92, 0.96, 1.0]
    },
    red: {
      blazer: [0.28, 0.06, 0.1],
      sweater: [0.48, 0.12, 0.16],
      tie: [1.0, 0.34, 0.42],
      pants: [0.11, 0.09, 0.12],
      backpack: [0.18, 0.1, 0.12],
      badge: [1.0, 0.9, 0.88]
    }
  };
  const skinTones = [
    [0.86, 0.58, 0.38],
    [0.72, 0.44, 0.28],
    [0.95, 0.72, 0.52],
    [0.52, 0.32, 0.23],
    [0.78, 0.54, 0.36]
  ];
  const hairColors = [
    [0.06, 0.045, 0.035],
    [0.22, 0.13, 0.07],
    [0.48, 0.33, 0.14],
    [0.12, 0.1, 0.09],
    [0.62, 0.48, 0.25]
  ];
  const gradeTags = ["SENIOR", "JUNIOR", "SOPH", "FRESH", "CAPT"];

  const bots = botRoster.map((bot, index) => createBot(bot.name, bot.team, index));

  const solids = [
    arenaBox("floor", [0, -0.08, 0], [52, 0.16, 52], [0.13, 0.16, 0.18], false),
    arenaBox("north-wall", [0, 2.4, -26.2], [52, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("south-wall", [0, 2.4, 26.2], [52, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("west-wall", [-26.2, 2.4, 0], [0.8, 4.8, 52], [0.22, 0.30, 0.35], true),
    arenaBox("east-wall", [26.2, 2.4, 0], [0.8, 4.8, 52], [0.22, 0.30, 0.35], true),
    arenaBox("center-low-a", [-4.2, 0.75, 0], [5.2, 1.5, 2.8], [0.23, 0.26, 0.27], true),
    arenaBox("center-low-b", [4.2, 0.75, 0], [5.2, 1.5, 2.8], [0.23, 0.26, 0.27], true),
    arenaBox("center-core", [0, 1.1, 0], [2.4, 2.2, 2.4], [0.18, 0.24, 0.26], true),
    arenaBox("lane-left-a", [-13.5, 1.0, -6], [2.4, 2.0, 8.2], [0.24, 0.29, 0.31], true),
    arenaBox("lane-right-a", [13.5, 1.0, 6], [2.4, 2.0, 8.2], [0.24, 0.29, 0.31], true),
    arenaBox("back-left", [-13.8, 1.0, 16.4], [6.0, 2.0, 2.2], [0.26, 0.24, 0.22], true),
    arenaBox("back-right", [13.8, 1.0, -16.4], [6.0, 2.0, 2.2], [0.26, 0.24, 0.22], true),
    arenaBox("mid-cover-a", [-6.2, 0.65, -12.0], [4.0, 1.3, 1.6], [0.31, 0.28, 0.24], true),
    arenaBox("mid-cover-b", [6.2, 0.65, 12.0], [4.0, 1.3, 1.6], [0.31, 0.28, 0.24], true),
    arenaBox("pillar-a", [-20.0, 1.4, 0], [1.8, 2.8, 1.8], [0.25, 0.29, 0.33], true),
    arenaBox("pillar-b", [20.0, 1.4, 0], [1.8, 2.8, 1.8], [0.25, 0.29, 0.33], true),
    arenaBox("blue-bunker-a", [-10, 1.15, 20], [5.8, 2.3, 1.6], [0.18, 0.28, 0.34], true),
    arenaBox("blue-bunker-b", [10, 1.15, 20], [5.8, 2.3, 1.6], [0.18, 0.28, 0.34], true),
    arenaBox("red-bunker-a", [-10, 1.15, -20], [5.8, 2.3, 1.6], [0.34, 0.2, 0.22], true),
    arenaBox("red-bunker-b", [10, 1.15, -20], [5.8, 2.3, 1.6], [0.34, 0.2, 0.22], true),
    arenaBox("mid-ring-n", [0, 0.8, -5.5], [7.5, 1.6, 1.1], [0.22, 0.25, 0.28], true),
    arenaBox("mid-ring-s", [0, 0.8, 5.5], [7.5, 1.6, 1.1], [0.22, 0.25, 0.28], true),
    arenaBox("mid-ring-e", [5.5, 0.8, 0], [1.1, 1.6, 7.5], [0.22, 0.25, 0.28], true),
    arenaBox("mid-ring-w", [-5.5, 0.8, 0], [1.1, 1.6, 7.5], [0.22, 0.25, 0.28], true),
    arenaBox("side-maze-a", [-20, 0.8, -12], [1.2, 1.6, 9.5], [0.2, 0.24, 0.26], true),
    arenaBox("side-maze-b", [-18, 0.8, 12], [1.2, 1.6, 9.5], [0.2, 0.24, 0.26], true),
    arenaBox("side-maze-c", [20, 0.8, 12], [1.2, 1.6, 9.5], [0.2, 0.24, 0.26], true),
    arenaBox("side-maze-d", [18, 0.8, -12], [1.2, 1.6, 9.5], [0.2, 0.24, 0.26], true)
  ];

  const decals = [
    arenaBox("stripe-1", [0, 0.015, -8.5], [42, 0.04, 0.18], [0.12, 0.67, 0.78], false),
    arenaBox("stripe-2", [0, 0.016, 8.5], [42, 0.04, 0.18], [0.56, 0.86, 0.32], false),
    arenaBox("stripe-3", [-8.5, 0.017, 0], [0.18, 0.04, 42], [0.12, 0.67, 0.78], false),
    arenaBox("stripe-4", [8.5, 0.018, 0], [0.18, 0.04, 42], [0.56, 0.86, 0.32], false),
    arenaBox("spawn-a", [0, 0.02, 18.8], [7.0, 0.05, 0.24], [0.27, 0.85, 1.0], false),
    arenaBox("spawn-b", [0, 0.02, -18.8], [7.0, 0.05, 0.24], [1.0, 0.32, 0.42], false),
    arenaBox("speed-lane-blue", [0, 0.025, 11.5], [28, 0.05, 0.38], [0.2, 0.8, 1.0], false),
    arenaBox("speed-lane-red", [0, 0.025, -11.5], [28, 0.05, 0.38], [1.0, 0.32, 0.42], false)
  ];

  const pickups = [
    { pos: mapPoint(-18, 0.55, 7), cooldown: 0 },
    { pos: mapPoint(18, 0.55, -7), cooldown: 0 },
    { pos: mapPoint(-6, 0.55, -12), cooldown: 0 },
    { pos: mapPoint(6, 0.55, 12), cooldown: 0 },
    { pos: mapPoint(0, 0.55, 0), cooldown: 0 }
  ];

  const jumpPads = [
    { pos: mapPoint(-19, 0.08, 0), cooldown: 0 },
    { pos: mapPoint(19, 0.08, 0), cooldown: 0 },
    { pos: mapPoint(0, 0.08, -18), cooldown: 0 },
    { pos: mapPoint(0, 0.08, 18), cooldown: 0 }
  ];

  const speedPads = [
    { pos: mapPoint(-11, 0.08, 11.5), dir: [1, 0, 0], cooldown: 0 },
    { pos: mapPoint(11, 0.08, -11.5), dir: [-1, 0, 0], cooldown: 0 },
    { pos: mapPoint(-19, 0.08, -18), dir: [0, 0, 1], cooldown: 0 },
    { pos: mapPoint(19, 0.08, 18), dir: [0, 0, -1], cooldown: 0 }
  ];

  const teleporters = [
    { pos: mapPoint(-23, 0.2, 22), target: mapPoint(23, EYE_HEIGHT, -22), cooldown: 0, color: [0.42, 0.86, 1.0] },
    { pos: mapPoint(23, 0.2, -22), target: mapPoint(-23, EYE_HEIGHT, 22), cooldown: 0, color: [1.0, 0.44, 0.72] }
  ];

  solids.push(...campusSolids());
  decals.push(...campusDecals());

  const vertexSource = isWebGL2
    ? `#version 300 es
      precision highp float;

      in vec3 aPosition;
      in vec3 aNormal;

      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      uniform vec3 uColor;
      uniform vec3 uCamera;

      out vec3 vColor;
      out vec3 vNormal;
      out vec3 vWorld;

      void main() {
        vec4 world = uModel * vec4(aPosition, 1.0);
        vWorld = world.xyz;
        vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
        vColor = uColor;
        gl_Position = uProjection * uView * world;
      }
    `
    : `
      precision highp float;

      attribute vec3 aPosition;
      attribute vec3 aNormal;

      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      uniform vec3 uColor;
      uniform vec3 uCamera;

      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorld;

      void main() {
        vec4 world = uModel * vec4(aPosition, 1.0);
        vWorld = world.xyz;
        vNormal = (uModel * vec4(aNormal, 0.0)).xyz;
        vColor = uColor;
        gl_Position = uProjection * uView * world;
      }
    `;

  const fragmentSource = isWebGL2
    ? `#version 300 es
      precision highp float;

      in vec3 vColor;
      in vec3 vNormal;
      in vec3 vWorld;

      uniform vec3 uCamera;
      uniform vec3 uLightDir;
      uniform vec3 uFogColor;

      out vec4 outColor;

      void main() {
        vec3 normal = normalize(vNormal);
        float sun = max(dot(normal, normalize(-uLightDir)), 0.0);
        float rim = pow(max(1.0 - abs(dot(normal, normalize(uCamera - vWorld))), 0.0), 2.0);
        float topLight = pow(max(normal.y, 0.0), 2.0) * 0.16;
        float gymGloss = pow(max(dot(normalize(uCamera - vWorld), reflect(uLightDir, normal)), 0.0), 16.0) * 0.12;
        float shade = 0.38 + sun * 0.66 + rim * 0.24 + topLight;
        vec3 lit = vColor * shade + vec3(0.025, 0.04, 0.05) * rim + vec3(1.0, 0.84, 0.42) * gymGloss;
        float fog = smoothstep(130.0, 330.0, distance(vWorld, uCamera));
        outColor = vec4(mix(lit, uFogColor, fog), 1.0);
      }
    `
    : `
      precision highp float;

      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorld;

      uniform vec3 uCamera;
      uniform vec3 uLightDir;
      uniform vec3 uFogColor;

      void main() {
        vec3 normal = normalize(vNormal);
        float sun = max(dot(normal, normalize(-uLightDir)), 0.0);
        float rim = pow(max(1.0 - abs(dot(normal, normalize(uCamera - vWorld))), 0.0), 2.0);
        float topLight = pow(max(normal.y, 0.0), 2.0) * 0.16;
        float gymGloss = pow(max(dot(normalize(uCamera - vWorld), reflect(uLightDir, normal)), 0.0), 16.0) * 0.12;
        float shade = 0.38 + sun * 0.66 + rim * 0.24 + topLight;
        vec3 lit = vColor * shade + vec3(0.025, 0.04, 0.05) * rim + vec3(1.0, 0.84, 0.42) * gymGloss;
        float fog = smoothstep(130.0, 330.0, distance(vWorld, uCamera));
        gl_FragColor = vec4(mix(lit, uFogColor, fog), 1.0);
      }
    `;

  const program = createProgram(gl, vertexSource, fragmentSource);
  const attrs = {
    position: gl.getAttribLocation(program, "aPosition"),
    normal: gl.getAttribLocation(program, "aNormal")
  };
  const uniforms = {
    projection: gl.getUniformLocation(program, "uProjection"),
    view: gl.getUniformLocation(program, "uView"),
    model: gl.getUniformLocation(program, "uModel"),
    color: gl.getUniformLocation(program, "uColor"),
    camera: gl.getUniformLocation(program, "uCamera"),
    lightDir: gl.getUniformLocation(program, "uLightDir"),
    fogColor: gl.getUniformLocation(program, "uFogColor")
  };

  const cube = createCubeMesh();
  const cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube, gl.STATIC_DRAW);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.035, 0.052, 0.06, 1);

  const projection = mat4();
  const view = mat4();
  let cameraForward = [0, 0, -1];
  let cameraRight = [1, 0, 0];
  let cameraUp = [0, 1, 0];

  setupUi();
  applySettings(false);
  buildSettingsPanel();
  buildLoadoutPanel();
  resetMatch();
  requestAnimationFrame(loop);

  function setupUi() {
    ["rifle", "pistol", "melee", "utility"].forEach((slot, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${index + 1} ${slot.toUpperCase()}`;
      button.addEventListener("click", () => switchSlot(slot));
      ui.weaponSlots.appendChild(button);
    });

    ui.nameTags.innerHTML = "";
    bots.forEach((bot) => {
      const tag = document.createElement("div");
      tag.className = `name-tag ${bot.team}`;
      tag.innerHTML = `<span>${bot.name}</span><small>${bot.uniform.grade} - ${bot.uniform.number}</small>`;
      ui.nameTags.appendChild(tag);
      bot.nameTag = tag;
    });

    setupNameInputs();
    setupNetworkUi();

    ui.loadoutGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".loadout-card");
      if (!card) return;
      handleLoadoutCard(card);
    });

    ui.menuTabs.forEach((button) => {
      button.addEventListener("click", () => showMenuView(button.dataset.menuView));
    });

    document.querySelectorAll("[data-open-view]").forEach((button) => {
      button.addEventListener("click", () => showMenuView(button.dataset.openView));
    });

    ui.startButton.addEventListener("click", () => {
      startMatch();
    });

    ui.resetButton.addEventListener("click", () => {
      resetMatch();
      startMatch();
    });

    ui.resetSettingsButton.addEventListener("click", () => {
      settings = cloneSettings(DEFAULT_SETTINGS);
      state.capturingKey = null;
      saveSettings();
      buildSettingsPanel();
      applySettings(true);
    });

    ui.dashButton.addEventListener("click", () => dash());

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === canvas;
      if (state.running && !locked && state.roundCooldown <= 0) {
        state.paused = true;
        ui.menu.classList.remove("hidden");
        ui.startButton.textContent = "Resume";
        showMenuView("home");
      }
    });

    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement !== canvas || state.paused || player.dead) return;
      const dx = event.movementX * 0.0024 * settings.mouseSensitivity;
      const dy = event.movementY * 0.0021 * settings.mouseSensitivity;
      if (settings.mouseSmoothing > 0) {
        state.lookDelta[0] += dx;
        state.lookDelta[1] += dy;
      } else {
        applyLook(dx, dy);
      }
    });

    document.addEventListener("keydown", (event) => {
      const key = normalizeKey(event);
      if (state.capturingKey) {
        event.preventDefault();
        settings.keybinds[state.capturingKey.action] = key;
        state.capturingKey.button.classList.remove("capturing");
        state.capturingKey.button.textContent = keyLabel(key);
        const value = document.getElementById(`setting-value-${state.capturingKey.action}`);
        if (value) value.textContent = keyLabel(key);
        state.capturingKey = null;
        saveSettings();
        return;
      }

      state.keys.add(key);

      if (isBoundNavigationKey(key) || ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }

      if (!state.running) return;

      if (!event.repeat && key === settings.keybinds.sprint && settings.toggleSprint) {
        player.sprintToggled = !player.sprintToggled;
      }
      if (!event.repeat && key === settings.keybinds.crouch && settings.toggleSneak) {
        if (!trySlide()) player.sneakToggled = !player.sneakToggled;
      }
      if (key === settings.keybinds.reload) reload();
      if (key === settings.keybinds.dash) dash();
      if (key === settings.keybinds.crouch && !settings.toggleSneak) trySlide();
      if (key === settings.keybinds.melee) melee();
      if (key === settings.keybinds.grenade) throwGrenade();
      if (key === settings.keybinds.weapon1) switchSlot("rifle");
      if (key === settings.keybinds.weapon2) switchSlot("pistol");
      if (key === settings.keybinds.weapon3) switchSlot("melee");
      if (key === settings.keybinds.weapon4) switchSlot("utility");
      if (key === "escape") {
        state.paused = true;
        ui.menu.classList.remove("hidden");
        showMenuView("home");
      }
    });

    document.addEventListener("keyup", (event) => {
      state.keys.delete(normalizeKey(event));
    });

    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 2) {
        player.aiming = settings.toggleAim ? !player.aiming : true;
        return;
      }
      if (event.button !== 0) return;
      state.mouseDown = true;
      if (state.running && !state.paused) fire();
    });

    document.addEventListener("mouseup", (event) => {
      if (event.button === 2 && !settings.toggleAim) player.aiming = false;
      if (event.button === 0) state.mouseDown = false;
    });

    canvas.addEventListener("click", () => {
      if (state.running && !state.paused && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    });
  }

  function setupNameInputs() {
    [ui.playerNameInput, ui.onlineNameInput].forEach((input) => {
      if (!input) return;
      input.value = playerName;
      input.addEventListener("input", () => {
        setPlayerName(input.value);
      });
      input.addEventListener("change", () => {
        setPlayerName(input.value, true);
      });
    });
  }

  function setupNetworkUi() {
    if (!supportsWebRtc()) {
      setNetworkStatus("unsupported");
      [ui.hostOfferButton, ui.joinOfferButton, ui.acceptAnswerButton, ui.disconnectButton].forEach((button) => {
        if (button) button.disabled = true;
      });
      return;
    }

    ui.hostOfferButton.addEventListener("click", () => hostOffer());
    ui.joinOfferButton.addEventListener("click", () => joinOffer());
    ui.acceptAnswerButton.addEventListener("click", () => acceptAnswer());
    ui.disconnectButton.addEventListener("click", () => disconnectPeer("offline"));
    ui.localSignal.addEventListener("click", () => ui.localSignal.select());
    updateNetworkUi();
  }

  function showMenuView(name) {
    ui.menuTabs.forEach((button) => {
      button.classList.toggle("active", button.dataset.menuView === name);
    });
    ui.menuViews.forEach((view) => {
      view.classList.toggle("active", view.dataset.view === name);
    });

    const labels = {
      home: state.paused ? "Paused" : "Arena home",
      loadout: "Round buy menu",
      online: "WebRTC link",
      settings: "Settings"
    };
    ui.menuSubtitle.textContent = labels[name] || "Arena home";
  }

  function buildLoadoutPanel() {
    ui.loadoutGrid.innerHTML = "";
    ui.cashValue.textContent = String(state.cash);
    ["rifle", "pistol", "melee", "utility"].forEach((category) => {
      getItemsForCategory(category).forEach((item) => {
        const active = state.loadout[category] === item.name;
        const affordable = state.buyPhase && state.cash >= item.price;
        const card = document.createElement("button");
        card.type = "button";
        card.disabled = !state.buyPhase && !active;
        card.className = `loadout-card${active ? " active" : ""}${affordable || active ? "" : " locked"}`;
        card.dataset.category = category;
        card.dataset.itemName = item.name;
        card.innerHTML = `
          <span class="card-kicker">${category}</span>
          <strong>${item.name}</strong>
          <small>${item.description}</small>
          <span class="loadout-meta">
            <span>${item.short}</span>
            <em>${active ? "EQUIPPED" : !state.buyPhase ? "ROUND LOCKED" : item.price === 0 ? "FREE" : `$${item.price}`}</em>
          </span>
        `;
        ui.loadoutGrid.appendChild(card);
      });
    });
  }

  function handleLoadoutCard(card) {
    const category = card.dataset.category;
    const item = getItemsForCategory(category).find((entry) => entry.name === card.dataset.itemName);
    if (!item) return;
    if (!state.buyPhase && state.loadout[category] !== item.name) {
      addFeed("Buy Menu", "Opens next round");
      return;
    }

    if (state.loadout[category] !== item.name && item.price > 0) {
      if (state.cash < item.price) {
        addFeed("Buy Menu", `$${item.price - state.cash} short`);
        return;
      }
      state.cash -= item.price;
    }

    state.loadout[category] = item.name;
    addFeed("Equipped", item.name);
    buildLoadoutPanel();
    if (category === state.activeSlot || isFirearmSlot(category)) switchSlot(category);
    updateMenuSummary();
  }

  function getItemsForCategory(category) {
    if (category === "rifle" || category === "pistol") return weapons.filter((weapon) => weapon.category === category);
    if (category === "melee") return meleeWeapons;
    return utilityItems;
  }

  function loadoutSummary() {
    return `${state.loadout.rifle} / ${state.loadout.pistol}`;
  }

  function buildSettingsPanel() {
    ui.settingsPanel.innerHTML = "";
    const groups = new Map();

    settingsSchema.forEach((item) => {
      if (!groups.has(item.group)) {
        const group = document.createElement("section");
        group.className = "settings-group";
        const heading = document.createElement("h2");
        heading.textContent = item.group;
        group.appendChild(heading);
        groups.set(item.group, group);
        ui.settingsPanel.appendChild(group);
      }

      groups.get(item.group).appendChild(createSettingRow(item));
    });

    ui.settingsCount.textContent = String(settingsSchema.length);
  }

  function createSettingRow(item) {
    const row = document.createElement("label");
    row.className = "setting-row";
    row.htmlFor = `setting-${item.key}`;

    const name = document.createElement("span");
    name.className = "setting-label";
    name.textContent = item.label;

    const control = createSettingControl(item);
    const value = document.createElement("span");
    value.className = "setting-value";
    value.id = `setting-value-${item.key}`;
    value.textContent = formatSettingValue(item);

    row.append(name, control, value);
    return row;
  }

  function createSettingControl(item) {
    if (item.type === "keybind") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "keybind-button";
      button.id = `setting-${item.key}`;
      button.textContent = keyLabel(settings.keybinds[item.key]);
      button.addEventListener("click", () => {
        state.capturingKey = { action: item.key, button };
        button.classList.add("capturing");
        button.textContent = "PRESS KEY";
      });
      return button;
    }

    const input = document.createElement("input");
    input.id = `setting-${item.key}`;
    input.dataset.settingKey = item.key;
    input.type = item.type;

    if (item.type === "checkbox") {
      input.checked = Boolean(settings[item.key]);
    } else if (item.type === "color") {
      input.value = settings[item.key];
    } else {
      input.min = String(item.min);
      input.max = String(item.max);
      input.step = String(item.step);
      input.value = String(settings[item.key]);
    }

    input.addEventListener("input", () => {
      updateSettingFromInput(item, input);
    });
    input.addEventListener("change", () => {
      updateSettingFromInput(item, input);
      saveSettings();
    });

    return input;
  }

  function updateSettingFromInput(item, input) {
    if (item.type === "checkbox") settings[item.key] = input.checked;
    else if (item.type === "color") settings[item.key] = input.value;
    else settings[item.key] = Number(input.value);

    const value = document.getElementById(`setting-value-${item.key}`);
    if (value) value.textContent = formatSettingValue(item);
    applySettings(true);
  }

  function formatSettingValue(item) {
    if (item.type === "keybind") return keyLabel(settings.keybinds[item.key]);
    const value = settings[item.key];
    if (item.type === "checkbox") return value ? "ON" : "OFF";
    if (item.type === "color") return String(value).toUpperCase();
    const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${rounded}${item.suffix || ""}`;
  }

  function applySettings(adjustLivePlayer) {
    const root = document.documentElement;
    root.style.setProperty("--hud-scale", String(settings.hudScale));
    root.style.setProperty("--crosshair-size", `${settings.crosshairSize}px`);
    root.style.setProperty("--crosshair-gap", `${settings.crosshairGap}px`);
    root.style.setProperty("--crosshair-line", `${settings.crosshairLength}px`);
    root.style.setProperty("--crosshair-thickness", `${settings.crosshairThickness}px`);
    root.style.setProperty("--crosshair-dot", `${Math.max(2, settings.crosshairThickness + 3)}px`);
    root.style.setProperty("--crosshair-color", hexToRgba(settings.crosshairColor, 0.94));
    ui.crosshair.classList.toggle("no-dot", !settings.crosshairDot);
    ui.minimap.hidden = !settings.showMinimap;
    ui.nameTags.hidden = !settings.showNameTags;
    ui.killFeed.hidden = !settings.showKillFeed;

    updateMenuSummary();
  }

  function updateMenuSummary() {
    ui.matchSummary.textContent = `Blue team vs red team - ${SCORE_LIMIT} score - ${formatTime(ROUND_SECONDS)}`;
    ui.homeWeapon.textContent = loadoutSummary();
    ui.homeRenderMode.textContent = document.body.dataset.webgl.toUpperCase();
    ui.homeFov.textContent = `${settings.fov} FOV`;
  }

  function applyLook(dx, dy) {
    const xSign = settings.invertX ? -1 : 1;
    const ySign = settings.invertY ? 1 : -1;
    player.yaw += dx * xSign;
    player.pitch += dy * ySign;
    player.pitch = clamp(player.pitch, -1.32, 1.18);
  }

  function processLook(dt) {
    if (state.lookDelta[0] === 0 && state.lookDelta[1] === 0) return;
    const smoothing = clamp(settings.mouseSmoothing, 0, 0.85);
    const amount = smoothing > 0 ? clamp(dt * (28 - smoothing * 22), 0.08, 1) : 1;
    const dx = state.lookDelta[0] * amount;
    const dy = state.lookDelta[1] * amount;
    state.lookDelta[0] -= dx;
    state.lookDelta[1] -= dy;
    applyLook(dx, dy);
  }

  function normalizeKey(event) {
    if (event.code === "Space") return "space";
    if (event.key === " ") return "space";
    return event.key.toLowerCase();
  }

  function keyLabel(key) {
    const labels = {
      " ": "SPACE",
      space: "SPACE",
      control: "CTRL",
      shift: "SHIFT",
      alt: "ALT",
      meta: "META"
    };
    return labels[key] || String(key || "").toUpperCase();
  }

  function isBoundNavigationKey(key) {
    const movementKeys = [
      settings.keybinds.forward,
      settings.keybinds.backward,
      settings.keybinds.left,
      settings.keybinds.right,
      settings.keybinds.jump,
      settings.keybinds.sprint,
      settings.keybinds.crouch
    ];
    return movementKeys.includes(key);
  }

  function actionDown(action) {
    return state.keys.has(settings.keybinds[action]);
  }

  function startMatch() {
    state.running = true;
    state.paused = false;
    state.buyPhase = false;
    player.aiming = false;
    ui.menu.classList.add("hidden");
    ui.startButton.textContent = "Start Match";
    ui.roundBanner.hidden = true;
    switchSlot(state.activeSlot);
    canvas.requestPointerLock();
  }

  function resetMatch() {
    state.running = false;
    state.paused = false;
    state.round = 1;
    state.roundTime = ROUND_SECONDS;
    state.roundCooldown = 0;
    state.buyPhase = true;
    state.cash = START_CASH;
    state.loadout = { ...DEFAULT_ROUND_LOADOUT };
    state.playerScore = 0;
    state.enemyScore = 0;
    state.killFeed.length = 0;
    resetPlayer();
    activeBots().forEach((bot, index) => resetBot(bot, index));
    ammo.forEach((slot, index) => {
      slot.magazine = weapons[index].magazineSize;
      slot.reserve = weapons[index].reserveSize;
      slot.reloadRemaining = 0;
      slot.reloadTotal = 0;
      slot.fireTimer = 0;
    });
    switchSlot("rifle");
    buildLoadoutPanel();
    ui.menu.classList.remove("hidden");
    showMenuView("loadout");
    ui.startButton.textContent = "Start Round";
  }

  function loop(time) {
    const now = time / 1000;
    const dt = Math.min(0.033, now - (state.lastTime || now));
    state.lastTime = now;

    update(dt);
    render(now);
    updateHud();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    resize();
    updateNetwork(dt);

    if (!state.running || state.paused) {
      idleCamera(dt);
      updateTransient(dt);
      return;
    }

    if (state.roundCooldown > 0) {
      state.roundCooldown -= dt;
      if (state.roundCooldown <= 0) nextRound();
      updateTransient(dt);
      return;
    }

    processLook(dt);
    state.roundTime -= dt;
    if (state.roundTime <= 0) {
      endRound(state.playerScore >= state.enemyScore);
    }

    updatePlayer(dt);
    updateWeapons(dt);
    updateBots(dt);
    updatePickups(dt);
    updateTransient(dt);

    const weapon = isFirearmSlot(state.activeSlot) ? weapons[state.activeWeapon] : state.activeSlot === "melee" ? getEquippedMelee() : getEquippedUtility();
    if (state.mouseDown && isFirearmSlot(state.activeSlot) && weapon.automatic) fire();

    if (state.playerScore >= SCORE_LIMIT) endRound(true);
    if (state.enemyScore >= SCORE_LIMIT) endRound(false);
  }

  function idleCamera(dt) {
    if (state.running || !settings.idleCamera) return;
    player.yaw += dt * 0.08;
    player.pitch = Math.sin(performance.now() * 0.0006) * 0.08;
  }

  function updatePlayer(dt) {
    if (player.dead) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) resetPlayer();
      return;
    }

    const forward = [Math.sin(player.yaw), 0, -Math.cos(player.yaw)];
    const right = [Math.cos(player.yaw), 0, Math.sin(player.yaw)];
    let wishX = 0;
    let wishZ = 0;

    const grounded = player.pos[1] <= EYE_HEIGHT + 0.02;
    const wantsSprint = settings.toggleSprint ? player.sprintToggled : actionDown("sprint");
    const wantsSneak = settings.toggleSneak ? player.sneakToggled : actionDown("crouch");
    const crouching = wantsSneak || player.slideTimer > 0;

    if (actionDown("forward")) {
      wishX += forward[0];
      wishZ += forward[2];
    }
    if (actionDown("backward")) {
      wishX -= forward[0];
      wishZ -= forward[2];
    }
    if (actionDown("right")) {
      wishX += right[0];
      wishZ += right[2];
    }
    if (actionDown("left")) {
      wishX -= right[0];
      wishZ -= right[2];
    }

    const rawWishLength = Math.hypot(wishX, wishZ);
    const wishLength = rawWishLength || 1;
    const moving = rawWishLength > 0.01;
    const sprinting = wantsSprint && !player.staminaExhausted && player.stamina > 0 && moving;
    let speed = PLAYER_MOVE_SPEED;
    if (player.aiming) speed = PLAYER_ADS_SPEED;
    if (crouching) speed = PLAYER_CROUCH_SPEED;
    if (sprinting && moving && grounded && !player.aiming && !crouching) {
      speed = PLAYER_SPRINT_SPEED;
      player.stamina = Math.max(0, player.stamina - STAMINA_SPRINT_DRAIN * dt);
      player.staminaRegenDelay = STAMINA_REGEN_DELAY;
      if (player.stamina <= 0) {
        player.staminaExhausted = true;
        player.sprintToggled = false;
      }
    } else {
      player.staminaRegenDelay = Math.max(0, player.staminaRegenDelay - dt);
      if (player.staminaRegenDelay <= 0) {
        const regenBonus = crouching || !moving ? 1.35 : 1;
        player.stamina = Math.min(PLAYER_MAX_STAMINA, player.stamina + STAMINA_REGEN * regenBonus * dt);
      }
      if (player.stamina >= STAMINA_EXHAUST_RECOVER) player.staminaExhausted = false;
    }
    if (player.slideTimer > 0) speed = PLAYER_SPRINT_SPEED * 1.2;
    if (player.dashTimer > 0) speed = PLAYER_MOVE_SPEED * 2.05;
    wishX = (wishX / wishLength) * speed;
    wishZ = (wishZ / wishLength) * speed;

    const control = player.slideTimer > 0 ? 2.2 : 12;
    player.vel[0] += (wishX - player.vel[0]) * Math.min(1, dt * control);
    player.vel[2] += (wishZ - player.vel[2]) * Math.min(1, dt * control);
    player.vel[1] -= GRAVITY * dt;

    if (actionDown("jump") && grounded && player.slideTimer <= 0) {
      player.vel[1] = PLAYER_JUMP_POWER;
    }

    player.crouchAmount += ((crouching ? 1 : 0) - player.crouchAmount) * Math.min(1, dt * 14);
    player.slideTimer = Math.max(0, player.slideTimer - dt);
    player.slideCooldown = Math.max(0, player.slideCooldown - dt);
    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
    }
    if (player.dashCooldown > 0) {
      player.dashCooldown -= dt;
    }
    player.grenadeCooldown = Math.max(0, player.grenadeCooldown - dt);
    player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
    player.spawnProtection = Math.max(0, player.spawnProtection - dt);
    player.damageRegenDelay = Math.max(0, player.damageRegenDelay - dt);
    if (player.damageRegenDelay <= 0 && player.armor < PLAYER_MAX_ARMOR) {
      player.armor = Math.min(PLAYER_MAX_ARMOR, player.armor + ARMOR_REGEN_RATE * dt);
    }

    player.pos[0] += player.vel[0] * dt;
    player.pos[1] += player.vel[1] * dt;
    player.pos[2] += player.vel[2] * dt;

    if (player.pos[1] < EYE_HEIGHT) {
      player.pos[1] = EYE_HEIGHT;
      player.vel[1] = 0;
    }

    player.pos[0] = clamp(player.pos[0], -WORLD_LIMIT + 1.2, WORLD_LIMIT - 1.2);
    player.pos[2] = clamp(player.pos[2], -WORLD_LIMIT + 1.2, WORLD_LIMIT - 1.2);
    collidePlayer();
    updateJumpPads(dt);
    updateSpeedPads(dt);
    updateTeleporters(dt);

    state.recoilKick = Math.max(0, state.recoilKick - dt * 7);
  }

  function trySlide() {
    if (!state.running || state.paused || player.dead) return false;
    const grounded = player.pos[1] <= EYE_HEIGHT + 0.05;
    const horizontalSpeed = Math.hypot(player.vel[0], player.vel[2]);
    if (!grounded || player.slideCooldown > 0 || player.stamina < STAMINA_SLIDE_COST || horizontalSpeed < PLAYER_MOVE_SPEED * 0.75) return false;

    const forward = [Math.sin(player.yaw), 0, -Math.cos(player.yaw)];
    player.vel[0] += forward[0] * 10;
    player.vel[2] += forward[2] * 10;
    player.slideTimer = 0.72;
    player.slideCooldown = 1.25;
    player.stamina = Math.max(0, player.stamina - STAMINA_SLIDE_COST);
    player.staminaRegenDelay = STAMINA_REGEN_DELAY;
    player.sneakToggled = false;
    return true;
  }

  function updateJumpPads(dt) {
    jumpPads.forEach((pad) => {
      pad.cooldown = Math.max(0, pad.cooldown - dt);
      if (pad.cooldown > 0) return;
      if (distance2d(player.pos, pad.pos) < 3.4 && player.pos[1] <= EYE_HEIGHT + 0.4) {
        const away = normalize([player.pos[0] - pad.pos[0], 0, player.pos[2] - pad.pos[2]]);
        player.vel[0] += away[0] * 8;
        player.vel[1] = 14.5;
        player.vel[2] += away[2] * 8;
        pad.cooldown = 0.8;
        addFeed("Jump Pad", "Launched");
      }
    });
  }

  function updateBotJumpPads(bot) {
    jumpPads.forEach((pad) => {
      if (distance2d(bot.pos, pad.pos) < 2.8 && Math.random() < 0.018) {
        const away = normalize([bot.pos[0] - pad.pos[0], 0, bot.pos[2] - pad.pos[2]]);
        bot.vel[0] += away[0] * 5;
        bot.vel[2] += away[2] * 5;
      }
    });
  }

  function updateSpeedPads(dt) {
    speedPads.forEach((pad) => {
      pad.cooldown = Math.max(0, pad.cooldown - dt);
      if (pad.cooldown > 0) return;
      if (distance2d(player.pos, pad.pos) < 3.2 && player.pos[1] <= EYE_HEIGHT + 0.4) {
        player.vel[0] += pad.dir[0] * 14;
        player.vel[2] += pad.dir[2] * 14;
        pad.cooldown = 0.65;
        addFeed("Speed Lane", "Boosted");
      }
    });
  }

  function updateTeleporters(dt) {
    teleporters.forEach((gate) => {
      gate.cooldown = Math.max(0, gate.cooldown - dt);
      if (gate.cooldown > 0) return;
      if (distance2d(player.pos, gate.pos) < 3.0) {
        player.pos = gate.target.slice();
        player.vel[0] *= 0.35;
        player.vel[2] *= 0.35;
        gate.cooldown = 1.8;
        addFeed("Teleporter", "Rotated");
      }
    });
  }

  function updateWeapons(dt) {
    ammo.forEach((slot, index) => {
      slot.fireTimer = Math.max(0, slot.fireTimer - dt);
      if (slot.reloadRemaining > 0) {
        slot.reloadRemaining = Math.max(0, slot.reloadRemaining - dt);
        if (slot.reloadRemaining === 0) {
          const weapon = weapons[index];
          const needed = weapon.magazineSize - slot.magazine;
          const taken = Math.min(needed, slot.reserve);
          slot.magazine += taken;
          slot.reserve -= taken;
          slot.reloadTotal = 0;
        }
      }
    });
  }

  function updateBots(dt) {
    activeBots().forEach((bot) => {
      if (!bot.alive) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) respawnBot(bot);
        return;
      }

      bot.fireTimer = Math.max(0, bot.fireTimer - dt);
      bot.retargetTimer -= dt;

      const enemy = findBotTarget(bot);

      if (enemy) {
        const toEnemy = sub(enemy.pos, [bot.pos[0], EYE_HEIGHT, bot.pos[2]]);
        bot.target = [enemy.pos[0] + Math.sin(performance.now() * 0.001 + bot.index) * 2.5, 0, enemy.pos[2]];
        bot.yaw = Math.atan2(toEnemy[0], -toEnemy[2]);
        if (bot.fireTimer <= 0) botFire(bot, enemy);
      } else if (bot.retargetTimer <= 0 || distance2d(bot.pos, bot.target) < 1.5) {
        bot.target = randomArenaPoint();
        bot.retargetTimer = 1.2 + Math.random() * 2.4;
      }

      const toTarget = sub(bot.target, bot.pos);
      const dist = Math.hypot(toTarget[0], toTarget[2]) || 1;
      const moveX = (toTarget[0] / dist) * bot.baseSpeed;
      const moveZ = (toTarget[2] / dist) * bot.baseSpeed;
      bot.vel[0] += (moveX - bot.vel[0]) * Math.min(1, dt * 5);
      bot.vel[2] += (moveZ - bot.vel[2]) * Math.min(1, dt * 5);
      bot.pos[0] += bot.vel[0] * dt;
      bot.pos[2] += bot.vel[2] * dt;
      bot.pos[0] = clamp(bot.pos[0], -WORLD_LIMIT + 1.5, WORLD_LIMIT - 1.5);
      bot.pos[2] = clamp(bot.pos[2], -WORLD_LIMIT + 1.5, WORLD_LIMIT - 1.5);
      collideBot(bot);
      updateBotJumpPads(bot);

      if (!enemy && Math.hypot(bot.vel[0], bot.vel[2]) > 0.1) {
        bot.yaw = Math.atan2(bot.vel[0], -bot.vel[2]);
      }
    });
  }

  function updatePickups(dt) {
    pickups.forEach((pickup) => {
      pickup.cooldown = Math.max(0, pickup.cooldown - dt);
      if (pickup.cooldown > 0 || player.dead) return;
      if (distance2d(player.pos, pickup.pos) < 1.2 && player.health < PLAYER_MAX_HEALTH) {
        const healAmount = PICKUP_HEAL;
        player.health = Math.min(PLAYER_MAX_HEALTH, player.health + healAmount);
        player.armor = Math.min(Math.max(PLAYER_MAX_ARMOR, 50), player.armor + 8);
        pickup.cooldown = PICKUP_RESPAWN;
        addFeed("Pickup", `+${healAmount} HP`);
      }
    });
  }

  function updateTransient(dt) {
    state.hitTimer = Math.max(0, state.hitTimer - dt);
    state.damageTimer = Math.max(0, state.damageTimer - dt);
    ui.crosshair.classList.toggle("hit", settings.showHitMarker && state.hitTimer > 0);
    ui.damageFlash.style.opacity = settings.showDamageFlash ? String(Math.min(0.65, state.damageTimer * 2.5)) : "0";

    for (let index = state.tracers.length - 1; index >= 0; index--) {
      state.tracers[index].life -= dt;
      if (state.tracers[index].life <= 0) state.tracers.splice(index, 1);
    }

    for (let index = state.particles.length - 1; index >= 0; index--) {
      const p = state.particles[index];
      p.life -= dt;
      p.pos[0] += p.vel[0] * dt;
      p.pos[1] += p.vel[1] * dt;
      p.pos[2] += p.vel[2] * dt;
      p.vel[1] -= 7 * dt;
      if (p.life <= 0) state.particles.splice(index, 1);
    }

    for (let index = state.grenades.length - 1; index >= 0; index--) {
      const grenade = state.grenades[index];
      grenade.life -= dt;
      grenade.vel[1] -= GRAVITY * dt;
      grenade.pos[0] += grenade.vel[0] * dt;
      grenade.pos[1] += grenade.vel[1] * dt;
      grenade.pos[2] += grenade.vel[2] * dt;
      if (grenade.pos[1] < 0.32) {
        grenade.pos[1] = 0.32;
        grenade.vel[1] = Math.abs(grenade.vel[1]) * 0.42;
        grenade.vel[0] *= 0.76;
        grenade.vel[2] *= 0.76;
      }
      if (grenade.life <= 0) {
        explodeGrenade(grenade);
        state.grenades.splice(index, 1);
      }
    }

    for (let index = state.shockwaves.length - 1; index >= 0; index--) {
      state.shockwaves[index].life -= dt;
      if (state.shockwaves[index].life <= 0) state.shockwaves.splice(index, 1);
    }

    for (let index = state.killFeed.length - 1; index >= 0; index--) {
      state.killFeed[index].time -= dt;
      if (state.killFeed[index].time <= 0) state.killFeed.splice(index, 1);
    }
  }

  function fire() {
    if (!state.running || state.paused || player.dead || state.roundCooldown > 0) return;
    if (state.activeSlot === "melee") {
      melee();
      return;
    }
    if (state.activeSlot === "utility") {
      throwGrenade();
      return;
    }

    const weapon = weapons[state.activeWeapon];
    const slot = ammo[state.activeWeapon];
    if (slot.reloadRemaining > 0 || slot.fireTimer > 0) return;
    if (slot.magazine <= 0) {
      reload();
      return;
    }

    slot.magazine -= 1;
    slot.fireTimer = 1 / weapon.fireRate;
    const aimModifier = player.aiming ? 0.48 : 1;
    state.recoilKick = Math.min(0.12, state.recoilKick + weapon.recoil * aimModifier);
    player.pitch = clamp(player.pitch + weapon.recoil * 0.36 * aimModifier, -1.32, 1.18);

    const origin = add(getCameraPos(), [0, -0.05, 0]);
    const dir = spreadDirection(getForward(), weapon.spread * aimModifier);
    let bestT = weapon.range;
    let hitBot = null;
    let hitPoint = add(origin, scale(dir, weapon.range));

    for (const solid of solids) {
      if (!solid.solid) continue;
      const t = rayAabb(origin, dir, solidMin(solid), solidMax(solid));
      if (t !== null && t > 0.02 && t < bestT) {
        bestT = t;
        hitPoint = add(origin, scale(dir, t));
      }
    }

    for (const bot of activeBots()) {
      if (!bot.alive || bot.team === "blue") continue;
      const bodyT = raySphere(origin, dir, [bot.pos[0], 1.15, bot.pos[2]], 0.62);
      const headT = raySphere(origin, dir, [bot.pos[0], 1.95, bot.pos[2]], 0.34);
      const t = headT !== null ? headT : bodyT;
      if (t !== null && t > 0.05 && t < bestT) {
        bestT = t;
        hitBot = bot;
        hitPoint = add(origin, scale(dir, t));
        bot.headshot = headT !== null;
      }
    }

    addTracer(origin, hitPoint, weapon.color, 0.12);
    sendNetworkFire(origin, hitPoint, weapon.color);

    if (hitBot) {
      const falloff = damageFalloff(weapon, bestT);
      const multiplier = hitBot.headshot ? (weapon.headshotMultiplier || 1.7) : 1;
      damageBot(hitBot, Math.round(weapon.damage * multiplier * falloff), hitPoint, { name: "You", team: "blue", type: "player", headshot: hitBot.headshot, weapon: weapon.name });
    }
  }

  function reload() {
    const weapon = weapons[state.activeWeapon];
    const slot = ammo[state.activeWeapon];
    if (slot.reloadRemaining > 0) return;
    if (slot.magazine >= weapon.magazineSize || slot.reserve <= 0) return;
    slot.reloadRemaining = weapon.reloadTime;
    slot.reloadTotal = weapon.reloadTime;
  }

  function damageFalloff(weapon, distance) {
    const start = weapon.range * DROP_OFF_START;
    if (distance <= start) return 1;
    const t = clamp((distance - start) / Math.max(1, weapon.range - start), 0, 1);
    return 1 - (1 - DROP_OFF_MIN) * t;
  }

  function switchWeapon(index) {
    if (index < 0 || index >= weapons.length) return;
    state.activeWeapon = index;
    state.activeSlot = weapons[index].category;
    [...ui.weaponSlots.children].forEach((button, buttonIndex) => {
      const slots = ["rifle", "pistol", "melee", "utility"];
      button.classList.toggle("active", slots[buttonIndex] === state.activeSlot);
    });
    updateMenuSummary();
  }

  function switchSlot(slot) {
    state.activeSlot = slot;
    if (isFirearmSlot(slot)) {
      switchWeapon(findWeaponIndex(state.loadout[slot]));
    } else {
      [...ui.weaponSlots.children].forEach((button, buttonIndex) => {
        const slots = ["rifle", "pistol", "melee", "utility"];
        button.classList.toggle("active", slots[buttonIndex] === slot);
      });
      updateMenuSummary();
    }
  }

  function isFirearmSlot(slot) {
    return slot === "rifle" || slot === "pistol";
  }

  function findWeaponIndex(name) {
    const index = weapons.findIndex((weapon) => weapon.name === name);
    return index >= 0 ? index : 0;
  }

  function getEquippedMelee() {
    return meleeWeapons.find((item) => item.name === state.loadout.melee) || meleeWeapons[0];
  }

  function getEquippedUtility() {
    return utilityItems.find((item) => item.name === state.loadout.utility) || utilityItems[0];
  }

  function dash() {
    if (!state.running || state.paused || player.dead) return;
    if (player.dashCooldown > 0) return;
    const forward = getForward();
    player.vel[0] += forward[0] * PLAYER_DASH_POWER;
    player.vel[2] += forward[2] * PLAYER_DASH_POWER;
    player.dashTimer = 0.18;
    player.dashCooldown = PLAYER_DASH_COOLDOWN;
  }

  function melee() {
    if (!state.running || state.paused || player.dead || player.meleeCooldown > 0) return;
    const meleeWeapon = getEquippedMelee();
    player.meleeCooldown = meleeWeapon.cooldown;
    const origin = getCameraPos();
    const dir = getForward();
    let best = null;

    activeBots().forEach((bot) => {
      if (!bot.alive || bot.team === "blue") return;
      const t = raySphere(origin, dir, [bot.pos[0], 1.25, bot.pos[2]], 0.82);
      if (t !== null && t < meleeWeapon.range && (!best || t < best.t)) best = { bot, t };
    });

    const end = add(origin, scale(dir, meleeWeapon.range));
    addTracer(origin, end, meleeWeapon.color, 0.08);
    if (best) {
      const backstab = isBackstab(best.bot);
      damageBot(best.bot, backstab ? meleeWeapon.backstabDamage : meleeWeapon.damage, [best.bot.pos[0], 1.3, best.bot.pos[2]], { name: "You", team: "blue", type: "player", backstab });
    }
  }

  function isBackstab(bot) {
    const botForward = [Math.sin(bot.yaw), 0, -Math.cos(bot.yaw)];
    const fromBotToPlayer = normalize([player.pos[0] - bot.pos[0], 0, player.pos[2] - bot.pos[2]]);
    return dot(botForward, fromBotToPlayer) < -0.45;
  }

  function throwGrenade() {
    if (!state.running || state.paused || player.dead || player.grenadeCooldown > 0) return;
    const utility = getEquippedUtility();
    player.grenadeCooldown = utility.cooldown;
    const origin = add(getCameraPos(), scale(cameraRight, 0.18));
    const forward = getForward();
    state.grenades.push({
      pos: add(origin, scale(forward, 0.8)),
      vel: add(scale(forward, 28), [0, 7.5, 0]),
      life: 1.8,
      team: "blue",
      utility
    });
  }

  function explodeGrenade(grenade) {
    const utility = grenade.utility || getEquippedUtility();
    state.shockwaves.push({ pos: grenade.pos.slice(), life: 0.28, maxLife: 0.28, radius: utility.radius, color: utility.color });
    spawnSparks(grenade.pos, utility.color, 34);

    activeBots().forEach((bot) => {
      if (!bot.alive || bot.team === grenade.team) return;
      const dist = distance2d(bot.pos, grenade.pos);
      if (dist > utility.radius) return;
      const damage = Math.round(utility.damage * (1 - dist / utility.radius * 0.65));
      damageBot(bot, damage, [bot.pos[0], 1.1, bot.pos[2]], { name: "You", team: grenade.team, type: "player" });
    });
  }

  function findBotTarget(bot) {
    const origin = [bot.pos[0], 1.35, bot.pos[2]];
    let best = null;

    if (bot.team === "red" && !player.dead) {
      considerTarget({
        type: "player",
        name: "You",
        team: "blue",
        pos: player.pos
      });
    }

    activeBots().forEach((other) => {
      if (other === bot || !other.alive || other.team === bot.team) return;
      considerTarget({
        type: "bot",
        name: other.name,
        team: other.team,
        bot: other,
        pos: [other.pos[0], EYE_HEIGHT, other.pos[2]]
      });
    });

    return best;

    function considerTarget(target) {
      const distance = length(sub(target.pos, origin));
      if (distance > BOT_SIGHT_RANGE) return;
      if (!hasLineOfSight(origin, target.pos)) return;
      if (!best || distance < best.distance) {
        best = { ...target, distance };
      }
    }
  }

  function botFire(bot, target) {
    bot.fireTimer = BOT_FIRE_MIN + Math.random() * 0.34;
    const origin = [bot.pos[0], 1.35, bot.pos[2]];
    const aim = normalize(sub(target.pos, origin));
    const miss = Math.max(0.035, target.distance / 360 + BOT_FIRE_SPREAD * 0.24);
    const dir = spreadDirectionFromBasis(aim, miss);
    const end = add(origin, scale(dir, Math.min(BOT_SIGHT_RANGE, target.distance + 8)));
    addTracer(origin, end, bot.color, 0.11);

    const hitRadius = target.type === "player" ? 0.55 : 0.62;
    const t = raySphere(origin, dir, target.pos, hitRadius);
    if (t !== null && t < target.distance + 0.8) {
      const damage = BOT_DAMAGE + Math.floor(Math.random() * 5);
      if (target.type === "player") {
        damagePlayer(damage, bot.name);
      } else {
        damageBot(target.bot, damage, target.pos, bot);
      }
    }
  }

  function damageBot(bot, amount, hitPoint, attacker) {
    bot.health -= amount;
    const fromPlayer = !attacker || attacker.type === "player";
    if (fromPlayer) state.hitTimer = 0.16;
    spawnSparks(hitPoint, bot.color, 8);
    if (bot.health <= 0) {
      bot.alive = false;
      bot.respawnTimer = 2.2;
      const attackerTeam = attacker && attacker.team ? attacker.team : "blue";
      if (attackerTeam === "blue") state.playerScore += 1;
      else state.enemyScore += 1;
      const attackerName = attacker && attacker.name ? attacker.name : "You";
      const tag = attacker && attacker.backstab ? "BACKSTAB" : attacker && attacker.headshot ? (attacker.weapon === "Eagle Marker" ? "EAGLE HS" : "HEADSHOT") : "";
      addFeed(attackerName, tag ? `${bot.name} ${tag}` : bot.name);
      if (attackerName === "You") {
        player.spree += 1;
        awardCash(KO_CASH + (attacker && attacker.headshot ? HEADSHOT_CASH : 0) + (attacker && attacker.backstab ? BACKSTAB_CASH : 0), tag || "KO");
      }
      if (player.spree > 0 && player.spree % 5 === 0) {
        addFeed("Streak", `${player.spree} KOs`);
        awardCash(150, "Streak bonus");
      }
      spawnSparks([bot.pos[0], 1.0, bot.pos[2]], [1.0, 0.95, 0.55], 20);
    }
  }

  function damagePlayer(amount, source) {
    if (player.dead || state.roundCooldown > 0) return;
    if (player.spawnProtection > 0) {
      state.damageTimer = 0.12;
      return;
    }
    const armorTake = Math.min(player.armor, Math.floor(amount * 0.55));
    player.armor -= armorTake;
    player.health -= amount - armorTake;
    state.damageTimer = 0.32;
    player.damageRegenDelay = ARMOR_REGEN_DELAY;

    if (player.health <= 0) {
      player.health = 0;
      player.dead = true;
      player.respawnTimer = 2.4;
      state.enemyScore += 1;
      player.spree = 0;
      addFeed(source, "You");
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }
  }

  function endRound(playerWon) {
    if (state.roundCooldown > 0) return;
    state.roundCooldown = 4;
    ui.roundBanner.hidden = false;
    ui.roundBannerTitle.textContent = playerWon ? "Blue Team Won" : "Red Team Won";
    ui.roundBannerText.textContent = `${state.playerScore} - ${state.enemyScore}`;
    awardCash(playerWon ? WIN_CASH : LOSS_CASH, playerWon ? "Win payout" : "Loss payout");
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }

  function nextRound() {
    state.round += 1;
    state.roundTime = ROUND_SECONDS;
    state.buyPhase = true;
    state.loadout = { ...DEFAULT_ROUND_LOADOUT };
    state.playerScore = 0;
    state.enemyScore = 0;
    ui.roundBanner.hidden = true;
    resetPlayer();
    activeBots().forEach((bot, index) => resetBot(bot, index));
    pickups.forEach((pickup) => {
      pickup.cooldown = 0;
    });
    ammo.forEach((slot, index) => {
      slot.magazine = weapons[index].magazineSize;
      slot.reserve = weapons[index].reserveSize;
      slot.reloadRemaining = 0;
      slot.reloadTotal = 0;
      slot.fireTimer = 0;
    });
    switchSlot("rifle");
    if (state.running) {
      state.paused = true;
      ui.menu.classList.remove("hidden");
      showMenuView("loadout");
      ui.startButton.textContent = "Start Round";
      buildLoadoutPanel();
    }
  }

  function render(now) {
    const width = canvas.width;
    const height = canvas.height;
    const bg = 0.035 * settings.brightness;
    gl.clearColor(bg, 0.052 * settings.brightness, 0.06 * settings.brightness, 1);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    const aspect = width / Math.max(1, height);
    const fov = player.aiming ? Math.max(48, settings.fov - 16) : settings.fov;
    const cameraPos = getCameraPos();
    mat4Perspective(projection, degToRad(fov), aspect, 0.04, 420);
    updateCameraBasis();
    mat4LookAt(view, cameraPos, add(cameraPos, cameraForward), cameraUp);

    gl.uniformMatrix4fv(uniforms.projection, false, projection);
    gl.uniformMatrix4fv(uniforms.view, false, view);
    gl.uniform3fv(uniforms.camera, cameraPos);
    gl.uniform3fv(uniforms.lightDir, [0.45, -0.9, 0.25]);
    gl.uniform3fv(uniforms.fogColor, [0.035 * settings.brightness, 0.052 * settings.brightness, 0.06 * settings.brightness]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.enableVertexAttribArray(attrs.position);
    gl.vertexAttribPointer(attrs.position, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(attrs.normal);
    gl.vertexAttribPointer(attrs.normal, 3, gl.FLOAT, false, 24, 12);

    renderSkyBand(now);
    renderCampusGlow(now);
    renderCampusDetails(now);
    solids.forEach(drawWorldBox);
    decals.forEach(drawWorldBox);
    renderJumpPads(now);
    renderMapFeatures(now);
    renderPickups(now);
    renderBots(now);
    renderRemotePlayers(now);
    renderGrenades();
    renderShockwaves();
    if (settings.renderTracers) renderTracers();
    if (settings.renderParticles) renderParticles();
    if (settings.showWeapon) renderWeapon(now);
    if (settings.showMinimap) renderMinimap();
    updateNameTags();
  }

  function renderSkyBand(now) {
    if (!settings.arenaGlow) return;
    const pulse = 0.5 + Math.sin(now * 0.8) * 0.5;
    drawBox(mapPoint(0, 8, -27.0), [36 * MAP_SCALE, 8, 0.1 * MAP_SCALE], [0.03 + pulse * 0.015, 0.14, 0.18], 0);
    drawBox(mapPoint(-27.0, 8, 0), [0.1 * MAP_SCALE, 8, 36 * MAP_SCALE], [0.04, 0.11 + pulse * 0.02, 0.14], 0);
    drawBox(mapPoint(27.0, 8, 0), [0.1 * MAP_SCALE, 8, 36 * MAP_SCALE], [0.11 + pulse * 0.03, 0.08, 0.09], 0);
  }

  function renderCampusGlow(now) {
    if (!settings.arenaGlow) return;
    const pulse = 0.72 + Math.sin(now * 1.8) * 0.16;
    [-18, -9, 0, 9, 18].forEach((z, index) => {
      const color = index % 2 === 0 ? [0.28 * pulse, 0.72 * pulse, 1.0] : [0.95 * pulse, 0.78 * pulse, 0.28];
      drawBox(mapPoint(-9.5, 5.7, z), [4.8 * MAP_SCALE, 0.12, 0.35 * MAP_SCALE], color, 0);
      drawBox(mapPoint(9.5, 5.7, z), [4.8 * MAP_SCALE, 0.12, 0.35 * MAP_SCALE], color, 0);
    });
    drawBox(mapPoint(0, 5.4, -24.7), [11.5 * MAP_SCALE, 2.0, 0.22 * MAP_SCALE], [0.04, 0.1 + pulse * 0.08, 0.13 + pulse * 0.12], 0);
    drawBox(mapPoint(0, 5.4, 24.7), [11.5 * MAP_SCALE, 2.0, 0.22 * MAP_SCALE], [0.12 + pulse * 0.12, 0.08, 0.08], 0);
    drawBox(mapPoint(0, 6.7, 0), [5.5 * MAP_SCALE, 0.18, 5.5 * MAP_SCALE], [0.95 * pulse, 0.82 * pulse, 0.28], now * 0.18);
  }

  function renderCampusDetails(now) {
    const pulse = settings.arenaGlow ? 0.76 + Math.sin(now * 2.4) * 0.18 : 0.72;
    for (let i = 0; i < 9; i++) {
      const x = -4.8 + i * 1.2;
      const on = (Math.floor(now * 2) + i) % 3 !== 0;
      drawBox(mapPoint(x, 3.1, -25.74), [0.55 * MAP_SCALE, 0.42, 0.08 * MAP_SCALE], on ? [0.92 * pulse, 0.72 * pulse, 0.24] : [0.18, 0.08, 0.05], 0);
      drawBox(mapPoint(x, 3.1, 25.74), [0.55 * MAP_SCALE, 0.42, 0.08 * MAP_SCALE], on ? [0.24, 0.78 * pulse, 1.0] : [0.04, 0.1, 0.14], 0);
    }

    [-21, -14, -7, 7, 14, 21].forEach((x, index) => {
      const color = index % 2 === 0 ? [0.16, 0.64, 0.94] : [0.96, 0.28, 0.34];
      drawBox(mapPoint(x, 3.55, -25.76), [2.3 * MAP_SCALE, 0.74, 0.07 * MAP_SCALE], scaleColor(color, pulse), 0);
      drawBox(mapPoint(x, 3.55, 25.76), [2.3 * MAP_SCALE, 0.74, 0.07 * MAP_SCALE], scaleColor(color, pulse), 0);
    });

    [
      [-2.7, 2.35, 23.02], [0, 2.15, 23.02], [2.7, 2.35, 23.02],
      [-1.2, 1.22, 23.02], [1.2, 1.22, 23.02]
    ].forEach(([x, y, z], index) => {
      const glint = 0.75 + Math.sin(now * 3.6 + index) * 0.2;
      drawBox(mapPoint(x, y, z), [0.42 * MAP_SCALE, 0.62, 0.18 * MAP_SCALE], [1.0 * glint, 0.78 * glint, 0.22], now * 0.24 + index);
    });

    for (let i = 0; i < 10; i++) {
      const angle = now * 0.24 + i * 0.7;
      const x = Math.cos(angle) * (9.0 + i % 3);
      const z = Math.sin(angle * 0.82) * (9.0 + i % 2);
      const y = 4.2 + Math.sin(now * 0.7 + i) * 0.35;
      const color = i % 3 === 0 ? [0.22, 0.8, 1.0] : i % 3 === 1 ? [1.0, 0.36, 0.42] : [1.0, 0.82, 0.28];
      drawBox(mapPoint(x, y, z), [0.18 * MAP_SCALE, 0.08, 0.8 * MAP_SCALE], scaleColor(color, 0.88), angle);
    }
  }

  function renderPickups(now) {
    pickups.forEach((pickup, index) => {
      if (pickup.cooldown > 0) return;
      const bob = Math.sin(now * 3 + index) * 0.12;
      drawBox([pickup.pos[0], pickup.pos[1] + bob, pickup.pos[2]], [0.9, 0.28, 0.9], [0.3, 1.0, 0.48], now * 1.4);
      drawBox([pickup.pos[0], pickup.pos[1] + bob + 0.02, pickup.pos[2]], [0.28, 0.9, 0.28], [0.3, 1.0, 0.48], now * 1.4);
    });
  }

  function renderJumpPads(now) {
    jumpPads.forEach((pad, index) => {
      const pulse = 0.65 + Math.sin(now * 5 + index) * 0.18;
      drawBox([pad.pos[0], 0.08, pad.pos[2]], [5.5, 0.16, 5.5], [0.18 * pulse, 0.72 * pulse, 1.0], now * 0.8);
      drawBox([pad.pos[0], 0.2, pad.pos[2]], [2.8, 0.12, 2.8], [0.48, 1.0, 0.62], -now * 1.4);
    });
  }

  function renderMapFeatures(now) {
    speedPads.forEach((pad, index) => {
      const pulse = 0.72 + Math.sin(now * 6 + index) * 0.18;
      drawBox([pad.pos[0], 0.12, pad.pos[2]], [4.6, 0.12, 1.2], [0.35 * pulse, 0.95 * pulse, 1.0], now * 0.4);
    });
    teleporters.forEach((gate, index) => {
      const pulse = 0.68 + Math.sin(now * 4 + index) * 0.22;
      drawBox([gate.pos[0], 1.5, gate.pos[2]], [0.7, 3.0, 4.0], scaleColor(gate.color, pulse), now * 0.5);
      drawBox([gate.pos[0], 1.5, gate.pos[2]], [4.0, 3.0, 0.7], scaleColor(gate.color, pulse), -now * 0.5);
    });
  }

  function renderGrenades() {
    state.grenades.forEach((grenade) => {
      drawBox(grenade.pos, [0.36, 0.36, 0.36], [0.08, 0.12, 0.1], 0);
    });
  }

  function renderShockwaves() {
    state.shockwaves.forEach((wave) => {
      const t = 1 - wave.life / wave.maxLife;
      const radius = wave.radius * t;
      drawBox([wave.pos[0], 0.11, wave.pos[2]], [radius, 0.05, radius], scaleColor(wave.color || [1.0, 0.42, 0.16], 1 - t * 0.35), 0);
    });
  }

  function renderBots(now) {
    activeBots().forEach((bot) => {
      if (!bot.alive) return;
      const bob = Math.sin(now * 6 + bot.index) * 0.035;
      const uniform = bot.uniform;
      const palette = uniformPalettes[bot.team];
      const accent = bot.color;

      drawBox([bot.pos[0], 0.045, bot.pos[2]], [1.72, 0.05, 1.18], [0.018, 0.022, 0.026], bot.yaw);
      drawBotPart(bot, [-0.18, 0.18, -0.04], [0.32, 0.18, 0.46], [0.025, 0.028, 0.032], 0);
      drawBotPart(bot, [0.18, 0.18, -0.04], [0.32, 0.18, 0.46], [0.025, 0.028, 0.032], 0);
      drawBotPart(bot, [-0.17, 0.58, 0.02], [0.24, 0.78, 0.28], palette.pants, 0);
      drawBotPart(bot, [0.17, 0.58, 0.02], [0.24, 0.78, 0.28], palette.pants, 0);

      drawBotPart(bot, [0, 1.17 + bob, 0], [0.86, 0.96, 0.52], palette.blazer, 0);
      drawBotPart(bot, [0, 1.22 + bob, -0.29], [0.5, 0.74, 0.07], [0.88, 0.9, 0.86], 0);
      drawBotPart(bot, [0, 1.18 + bob, -0.34], [0.13, 0.62, 0.08], palette.tie, 0);
      drawBotPart(bot, [0.27, 1.46 + bob, -0.35], [0.2, 0.16, 0.08], palette.badge, 0);
      drawBotPart(bot, [-0.56, 1.16 + bob, 0], [0.18, 0.76, 0.24], palette.blazer, 0);
      drawBotPart(bot, [0.56, 1.16 + bob, 0], [0.18, 0.76, 0.24], palette.blazer, 0);
      drawBotPart(bot, [-0.56, 0.74 + bob, -0.02], [0.2, 0.22, 0.22], uniform.skin, 0);
      drawBotPart(bot, [0.56, 0.74 + bob, -0.02], [0.2, 0.22, 0.22], uniform.skin, 0);
      drawBotPart(bot, [-0.56, 1.3 + bob, -0.16], [0.2, 0.18, 0.16], accent, 0);
      drawBotPart(bot, [0.56, 1.3 + bob, -0.16], [0.2, 0.18, 0.16], accent, 0);

      drawBotPart(bot, [0, 1.92 + bob, -0.02], [0.52, 0.54, 0.48], uniform.skin, 0);
      drawBotPart(bot, [0, 2.22 + bob, -0.01], [0.58, 0.18, 0.5], uniform.hair, 0);
      drawBotPart(bot, [0, 2.04 + bob, 0.18], [0.56, 0.38, 0.2], uniform.hair, 0);
      drawBotPart(bot, [-0.13, 1.98 + bob, -0.28], [0.07, 0.045, 0.035], [0.02, 0.025, 0.03], 0);
      drawBotPart(bot, [0.13, 1.98 + bob, -0.28], [0.07, 0.045, 0.035], [0.02, 0.025, 0.03], 0);
      drawBotPart(bot, [0, 1.18 + bob, 0.36], [0.72, 0.72, 0.2], palette.backpack, 0);

      drawBotPart(bot, [0.46, 1.25 + bob, -0.34], [0.18, 0.18, 0.95], [0.08, 0.1, 0.11], 0);
      drawBotPart(bot, [0.46, 1.25 + bob, -0.78], [0.11, 0.11, 0.18], accent, 0);

      const hpWidth = clamp(bot.health / bot.maxHealth, 0, 1);
      drawBillboard([bot.pos[0], 2.58, bot.pos[2]], [1.14, 0.09, 0.05], [0.06, 0.07, 0.08]);
      drawBillboard([bot.pos[0] - (1 - hpWidth) * 0.28, 2.59, bot.pos[2]], [1.1 * hpWidth, 0.06, 0.05], bot.team === "blue" ? [0.2, 0.78, 1.0] : [0.95, 0.23, 0.31]);
    });
  }

  function drawBotPart(bot, offset, scaleVector, color, yawOffset) {
    const rotated = rotateY([offset[0], 0, offset[2]], bot.yaw);
    drawBox([bot.pos[0] + rotated[0], offset[1], bot.pos[2] + rotated[2]], scaleVector, color, bot.yaw + (yawOffset || 0));
  }

  function renderRemotePlayers(now) {
    state.remotePlayers.forEach((remote) => {
      if (remote.dead || performance.now() / 1000 - remote.lastSeen > NETWORK_TIMEOUT) return;
      const bob = Math.sin(now * 6 + remote.seed) * 0.035;
      const team = remote.team === "red" ? "red" : "blue";
      const palette = uniformPalettes[team];
      const accent = teamColors[team];
      const uniform = remote.uniform || createUniform(team, remote.seed || 0);

      drawBox([remote.pos[0], 0.045, remote.pos[2]], [1.9, 0.05, 1.24], [0.02, 0.025, 0.03], remote.yaw);
      drawRemotePart(remote, [-0.18, 0.18, -0.04], [0.32, 0.18, 0.46], [0.025, 0.028, 0.032], 0);
      drawRemotePart(remote, [0.18, 0.18, -0.04], [0.32, 0.18, 0.46], [0.025, 0.028, 0.032], 0);
      drawRemotePart(remote, [-0.17, 0.58, 0.02], [0.24, 0.78, 0.28], palette.pants, 0);
      drawRemotePart(remote, [0.17, 0.58, 0.02], [0.24, 0.78, 0.28], palette.pants, 0);
      drawRemotePart(remote, [0, 1.17 + bob, 0], [0.9, 0.98, 0.54], palette.blazer, 0);
      drawRemotePart(remote, [0, 1.22 + bob, -0.3], [0.52, 0.76, 0.07], [0.88, 0.9, 0.86], 0);
      drawRemotePart(remote, [0, 1.18 + bob, -0.35], [0.13, 0.62, 0.08], palette.tie, 0);
      drawRemotePart(remote, [0.28, 1.46 + bob, -0.36], [0.2, 0.16, 0.08], palette.badge, 0);
      drawRemotePart(remote, [-0.58, 1.16 + bob, 0], [0.18, 0.76, 0.24], palette.blazer, 0);
      drawRemotePart(remote, [0.58, 1.16 + bob, 0], [0.18, 0.76, 0.24], palette.blazer, 0);
      drawRemotePart(remote, [-0.58, 0.74 + bob, -0.02], [0.2, 0.22, 0.22], uniform.skin, 0);
      drawRemotePart(remote, [0.58, 0.74 + bob, -0.02], [0.2, 0.22, 0.22], uniform.skin, 0);
      drawRemotePart(remote, [0, 1.92 + bob, -0.02], [0.54, 0.54, 0.48], uniform.skin, 0);
      drawRemotePart(remote, [0, 2.22 + bob, -0.01], [0.6, 0.18, 0.5], uniform.hair, 0);
      drawRemotePart(remote, [0, 2.04 + bob, 0.18], [0.58, 0.38, 0.2], uniform.hair, 0);
      drawRemotePart(remote, [0, 1.18 + bob, 0.38], [0.74, 0.72, 0.2], palette.backpack, 0);
      drawRemotePart(remote, [0.48, 1.25 + bob, -0.35], [0.18, 0.18, 0.96], [0.08, 0.1, 0.11], 0);
      drawRemotePart(remote, [0.48, 1.25 + bob, -0.8], [0.11, 0.11, 0.2], accent, 0);

      const aimEnd = add([remote.pos[0], 1.72, remote.pos[2]], scale(yawPitchForward(remote.yaw, remote.pitch || 0), 2.0));
      drawBeam([remote.pos[0], 1.72, remote.pos[2]], aimEnd, [0.025, 0.025, 1], scaleColor(accent, 0.65));
    });
  }

  function drawRemotePart(remote, offset, scaleVector, color, yawOffset) {
    const rotated = rotateY([offset[0], 0, offset[2]], remote.yaw);
    drawBox([remote.pos[0] + rotated[0], offset[1], remote.pos[2] + rotated[2]], scaleVector, color, remote.yaw + (yawOffset || 0));
  }

  function renderTracers() {
    state.tracers.forEach((tracer) => {
      const alphaScale = tracer.life / tracer.maxLife;
      drawBeam(tracer.from, tracer.to, [0.03, 0.03, 1], scaleColor(tracer.color, 0.65 + alphaScale * 0.7));
    });
  }

  function renderParticles() {
    state.particles.forEach((particle) => {
      const fade = clamp(particle.life / particle.maxLife, 0, 1);
      drawBox(particle.pos, [0.07, 0.07, 0.07], scaleColor(particle.color, fade), 0);
    });
  }

  function renderWeapon(now) {
    if (player.dead) return;

    const equipped = isFirearmSlot(state.activeSlot)
      ? weapons[state.activeWeapon]
      : state.activeSlot === "melee"
        ? getEquippedMelee()
        : getEquippedUtility();
    const sway = settings.weaponBob ? Math.sin(now * 8) * 0.012 : 0;
    const recoil = state.recoilKick;
    const ads = player.aiming ? 1 : 0;
    const base = add(getCameraPos(), add(scale(cameraForward, 0.64 - recoil * 1.8), add(scale(cameraRight, 0.34 - ads * 0.24), scale(cameraUp, -0.28 + sway + ads * 0.08))));
    const barrel = add(base, add(scale(cameraForward, 0.24), scale(cameraUp, 0.02)));
    const side = add(base, scale(cameraRight, 0.17));
    const itemColor = equipped.color || [0.8, 0.9, 1.0];
    const bodyScale = state.activeSlot === "utility" ? [0.28, 0.24, 0.38] : [0.26, 0.18, 0.72];
    const barrelScale = state.activeSlot === "melee" ? [0.11, 0.09, 1.05] : state.activeSlot === "utility" ? [0.42, 0.18, 0.42] : [0.13, 0.13, 0.58];

    drawOrientedBox(base, [cameraRight, cameraUp, cameraForward], bodyScale, [0.11, 0.13, 0.15]);
    drawOrientedBox(barrel, [cameraRight, cameraUp, cameraForward], barrelScale, itemColor);
    drawOrientedBox(side, [cameraRight, cameraUp, cameraForward], [0.1, 0.28, 0.28], scaleColor(itemColor, 0.72));
  }

  function renderMinimap() {
    const size = ui.minimap.width;
    const center = size / 2;
    const scaleMap = size / (WORLD_LIMIT * 2 + 4);
    mini.clearRect(0, 0, size, size);
    mini.fillStyle = "rgba(8, 12, 16, 0.75)";
    mini.fillRect(0, 0, size, size);
    mini.strokeStyle = "rgba(255,255,255,0.16)";
    mini.lineWidth = 2;
    mini.strokeRect(10, 10, size - 20, size - 20);

    mini.fillStyle = "rgba(255,255,255,0.09)";
    solids.forEach((solid) => {
      if (!solid.solid || solid.scale[1] > 4) return;
      const x = center + solid.pos[0] * scaleMap - solid.scale[0] * scaleMap * 0.5;
      const y = center + solid.pos[2] * scaleMap - solid.scale[2] * scaleMap * 0.5;
      mini.fillRect(x, y, solid.scale[0] * scaleMap, solid.scale[2] * scaleMap);
    });

    pickups.forEach((pickup) => {
      if (pickup.cooldown > 0) return;
      drawMiniDot(pickup.pos[0], pickup.pos[2], "#95f56d", 3);
    });

    activeBots().forEach((bot) => {
      if (bot.alive) drawMiniDot(bot.pos[0], bot.pos[2], bot.team === "blue" ? "#45d9ff" : "#ff526c", 4);
    });

    const px = center + player.pos[0] * scaleMap;
    const py = center + player.pos[2] * scaleMap;
    mini.save();
    mini.translate(px, py);
    mini.rotate(player.yaw);
    mini.fillStyle = "#45d9ff";
    mini.beginPath();
    mini.moveTo(0, -8);
    mini.lineTo(6, 7);
    mini.lineTo(-6, 7);
    mini.closePath();
    mini.fill();
    mini.restore();

    function drawMiniDot(x, z, color, radius) {
      mini.fillStyle = color;
      mini.beginPath();
      mini.arc(center + x * scaleMap, center + z * scaleMap, radius, 0, TAU);
      mini.fill();
    }
  }

  function updateNameTags() {
    if (!ui.nameTags) return;
    const showTags = settings.showNameTags && state.running && !state.paused;

    activeBots().forEach((bot) => {
      const tag = bot.nameTag;
      if (!tag) return;
      if (!showTags || !bot.alive) {
        tag.style.opacity = "0";
        return;
      }

      const screen = projectWorldPoint([bot.pos[0], 2.96, bot.pos[2]]);
      if (!screen) {
        tag.style.opacity = "0";
        return;
      }

      const distance = distance2d(player.pos, bot.pos);
      const fade = clamp(1 - (distance - 95) / 95, 0.28, 1);
      const tagScale = clamp(1.05 - distance / 280, 0.72, 1.05);
      tag.style.left = `${screen[0]}px`;
      tag.style.top = `${screen[1]}px`;
      tag.style.opacity = String(fade);
      tag.style.transform = `translate(-50%, -112%) scale(${tagScale})`;
      tag.style.zIndex = String(1000 - Math.round(distance));
    });

    state.remotePlayers.forEach((remote) => {
      const tag = remote.nameTag;
      if (!tag) return;
      const expired = performance.now() / 1000 - remote.lastSeen > NETWORK_TIMEOUT;
      if (!showTags || remote.dead || expired) {
        tag.style.opacity = "0";
        return;
      }

      const screen = projectWorldPoint([remote.pos[0], 2.98, remote.pos[2]]);
      if (!screen) {
        tag.style.opacity = "0";
        return;
      }

      const distance = distance2d(player.pos, remote.pos);
      const fade = clamp(1 - (distance - 115) / 115, 0.35, 1);
      const tagScale = clamp(1.08 - distance / 300, 0.76, 1.08);
      tag.style.left = `${screen[0]}px`;
      tag.style.top = `${screen[1]}px`;
      tag.style.opacity = String(fade);
      tag.style.transform = `translate(-50%, -112%) scale(${tagScale})`;
      tag.style.zIndex = String(1200 - Math.round(distance));
    });
  }

  function projectWorldPoint(point) {
    const viewSpace = transformMat4Point(view, [point[0], point[1], point[2], 1]);
    const clip = transformMat4Point(projection, viewSpace);
    if (clip[3] <= 0.02) return null;

    const x = clip[0] / clip[3];
    const y = clip[1] / clip[3];
    const z = clip[2] / clip[3];
    if (x < -1.15 || x > 1.15 || y < -1.15 || y > 1.15 || z < -1.2 || z > 1.2) return null;

    return [
      (x * 0.5 + 0.5) * canvas.clientWidth,
      (1 - (y * 0.5 + 0.5)) * canvas.clientHeight
    ];
  }

  function transformMat4Point(matrix, point) {
    const x = point[0];
    const y = point[1];
    const z = point[2];
    const w = point[3];
    return [
      matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
      matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
      matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
      matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w
    ];
  }

  function drawWorldBox(item) {
    drawBox(item.pos, item.scale, item.color, item.yaw || 0);
  }

  function drawBox(pos, scaleVector, color, yaw) {
    const model = modelMatrix(pos, scaleVector, yaw || 0);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniform3fv(uniforms.color, color);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }

  function drawOrientedBox(pos, basis, scaleVector, color) {
    const model = orientedMatrix(pos, basis, scaleVector);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniform3fv(uniforms.color, color);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }

  function drawBillboard(pos, scaleVector, color) {
    drawOrientedBox(pos, [cameraRight, cameraUp, scale(cameraForward, -1)], scaleVector, color);
  }

  function drawBeam(from, to, scaleVector, color) {
    const mid = scale(add(from, to), 0.5);
    const forward = normalize(sub(to, from));
    const lengthValue = Math.max(0.01, length(sub(to, from)));
    let right = normalize(cross([0, 1, 0], forward));
    if (length(right) < 0.01) right = [1, 0, 0];
    const up = normalize(cross(forward, right));
    drawOrientedBox(mid, [right, up, forward], [scaleVector[0], scaleVector[1], lengthValue], color);
  }

  function updateHud() {
    ui.hud.classList.toggle("hidden", !state.running && !state.paused);
    ui.playerScore.textContent = String(state.playerScore);
    ui.enemyScore.textContent = String(state.enemyScore);
    ui.roundLabel.textContent = `ROUND ${state.round}`;
    ui.roundTimer.textContent = formatTime(state.roundTime);
    ui.healthValue.textContent = String(Math.max(0, Math.round(player.health)));
    ui.armorValue.textContent = String(Math.max(0, Math.round(player.armor)));
    ui.staminaValue.textContent = String(Math.max(0, Math.round(player.stamina)));
    ui.healthBar.style.width = `${clamp(player.health / PLAYER_MAX_HEALTH, 0, 1) * 100}%`;
    ui.armorBar.style.width = `${clamp(player.armor / Math.max(1, PLAYER_MAX_ARMOR), 0, 1) * 100}%`;
    ui.staminaBar.style.width = `${clamp(player.stamina / PLAYER_MAX_STAMINA, 0, 1) * 100}%`;

    if (isFirearmSlot(state.activeSlot)) {
      const weapon = weapons[state.activeWeapon];
      const slot = ammo[state.activeWeapon];
      ui.weaponName.textContent = weapon.name;
      ui.ammoCount.textContent = String(slot.magazine);
      ui.reserveCount.textContent = String(slot.reserve);
      ui.reloadBar.style.width = slot.reloadTotal > 0 ? `${(1 - slot.reloadRemaining / slot.reloadTotal) * 100}%` : "0%";
    } else if (state.activeSlot === "melee") {
      const meleeWeapon = getEquippedMelee();
      ui.weaponName.textContent = meleeWeapon.name;
      ui.ammoCount.textContent = "∞";
      ui.reserveCount.textContent = "MELEE";
      ui.reloadBar.style.width = player.meleeCooldown > 0 ? `${(1 - player.meleeCooldown / meleeWeapon.cooldown) * 100}%` : "0%";
    } else {
      const utility = getEquippedUtility();
      ui.weaponName.textContent = utility.name;
      ui.ammoCount.textContent = "1";
      ui.reserveCount.textContent = "UTILITY";
      ui.reloadBar.style.width = player.grenadeCooldown > 0 ? `${(1 - player.grenadeCooldown / utility.cooldown) * 100}%` : "0%";
    }
    ui.dashCooldown.textContent = player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(1)}S` : "READY";
    ui.grenadeCooldown.textContent = player.grenadeCooldown > 0 ? `${player.grenadeCooldown.toFixed(1)}S` : "READY";
    ui.meleeCooldown.textContent = player.meleeCooldown > 0 ? `${player.meleeCooldown.toFixed(1)}S` : "READY";

    [...ui.weaponSlots.children].forEach((button, index) => {
      const slots = ["rifle", "pistol", "melee", "utility"];
      const slotName = slots[index];
      const item = slotName === "rifle" || slotName === "pistol"
        ? weapons[findWeaponIndex(state.loadout[slotName])]
        : slotName === "melee"
          ? getEquippedMelee()
          : getEquippedUtility();
      button.textContent = `${index + 1} ${item.short}`;
      button.classList.toggle("active", slotName === state.activeSlot);
    });

    ui.matchSummary.textContent = `Blue team vs red team - ${SCORE_LIMIT} score - ${formatTime(ROUND_SECONDS)}`;
    ui.homeWeapon.textContent = loadoutSummary();
    ui.homeRenderMode.textContent = document.body.dataset.webgl.toUpperCase();
    ui.homeFov.textContent = `${settings.fov} FOV`;

    ui.minimap.hidden = !settings.showMinimap;
    ui.nameTags.hidden = !settings.showNameTags;
    ui.killFeed.hidden = !settings.showKillFeed;
    if (settings.showKillFeed) {
      ui.killFeed.innerHTML = "";
      state.killFeed.slice(0, 5).forEach((item) => {
        const row = document.createElement("div");
        const left = document.createElement("span");
        const right = document.createElement("strong");
        left.textContent = item.left;
        right.textContent = item.right;
        row.append(left, right);
        ui.killFeed.appendChild(row);
      });
    }
  }

  function addFeed(left, right) {
    state.killFeed.unshift({ left, right, time: 4.5 });
  }

  function awardCash(amount, reason) {
    state.cash = Math.min(MAX_CASH, state.cash + amount);
    buildLoadoutPanel();
    addFeed(`+$${amount}`, reason);
  }

  function updateNetwork(dt) {
    if (!supportsWebRtc()) return;

    const now = performance.now() / 1000;
    state.remotePlayers.forEach((remote) => {
      if (now - remote.lastSeen > NETWORK_TIMEOUT && remote.nameTag) {
        remote.nameTag.style.opacity = "0";
      }
    });

    if (!isChannelOpen()) return;
    state.network.sendTimer -= dt;
    if (state.network.sendTimer > 0) return;
    state.network.sendTimer = NETWORK_SEND_INTERVAL;
    sendData({
      type: "state",
      id: state.clientId,
      name: playerName,
      team: localNetworkTeam(),
      pos: player.pos,
      yaw: player.yaw,
      pitch: player.pitch,
      dead: player.dead,
      health: Math.round(player.health),
      activeSlot: state.activeSlot,
      weapon: activeItemName(),
      crouch: player.crouchAmount,
      t: now
    });
  }

  async function hostOffer() {
    try {
      const peer = createPeerConnection("host");
      const channel = peer.createDataChannel("hss-state", { ordered: false, maxRetransmits: 1 });
      configureDataChannel(channel);
      setNetworkStatus("gathering");
      await peer.setLocalDescription(await peer.createOffer());
      await waitForIceGathering(peer);
      ui.localSignal.value = serializeSignal(peer.localDescription);
      setNetworkStatus("waiting-answer");
      addFeed("WebRTC", "Offer ready");
    } catch (error) {
      handleNetworkError(error);
    }
  }

  async function joinOffer() {
    try {
      const offer = parseSignal(ui.remoteSignal.value);
      if (offer.type !== "offer") throw new Error("Remote signal is not an offer.");
      const peer = createPeerConnection("joiner");
      setNetworkStatus("gathering");
      await peer.setRemoteDescription(offer);
      await peer.setLocalDescription(await peer.createAnswer());
      await waitForIceGathering(peer);
      ui.localSignal.value = serializeSignal(peer.localDescription);
      setNetworkStatus("waiting-host");
      addFeed("WebRTC", "Answer ready");
    } catch (error) {
      handleNetworkError(error);
    }
  }

  async function acceptAnswer() {
    try {
      if (!state.network.peer) throw new Error("No hosted offer is active.");
      const answer = parseSignal(ui.remoteSignal.value);
      if (answer.type !== "answer") throw new Error("Remote signal is not an answer.");
      await state.network.peer.setRemoteDescription(answer);
      setNetworkStatus("connecting");
      addFeed("WebRTC", "Answer accepted");
    } catch (error) {
      handleNetworkError(error);
    }
  }

  function createPeerConnection(role) {
    disconnectPeer("offline", true);
    const peer = new RTCPeerConnection(RTC_CONFIG);
    state.network.peer = peer;
    state.network.role = role;
    state.network.sendTimer = 0;
    clearRemotePlayers();
    updateNetworkUi();

    peer.ondatachannel = (event) => {
      configureDataChannel(event.channel);
    };
    peer.onconnectionstatechange = () => {
      const value = peer.connectionState;
      if (value === "connected") setNetworkStatus("connected");
      else if (value === "connecting") setNetworkStatus("connecting");
      else if (value === "failed" || value === "disconnected" || value === "closed") setNetworkStatus(value);
    };
    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === "connected" || peer.iceConnectionState === "completed") setNetworkStatus("connected");
      if (peer.iceConnectionState === "failed" || peer.iceConnectionState === "disconnected") setNetworkStatus(peer.iceConnectionState);
    };

    return peer;
  }

  function configureDataChannel(channel) {
    state.network.channel = channel;
    channel.onopen = () => {
      setNetworkStatus("connected");
      sendHello();
      addFeed("WebRTC", "Peer connected");
    };
    channel.onclose = () => {
      if (state.network.status !== "offline") setNetworkStatus("closed");
    };
    channel.onerror = () => {
      setNetworkStatus("error");
    };
    channel.onmessage = (event) => handleNetworkMessage(event.data);
  }

  function handleNetworkMessage(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (error) {
      return;
    }
    if (!message || message.id === state.clientId) return;

    if (message.type === "hello" || message.type === "state") {
      updateRemotePlayer(message);
      if (message.type === "hello") sendHello();
    } else if (message.type === "fire" && Array.isArray(message.from) && Array.isArray(message.to)) {
      addTracer(message.from, message.to, Array.isArray(message.color) ? message.color : [0.9, 0.9, 1.0], 0.12);
    }
  }

  function updateRemotePlayer(message) {
    const id = String(message.id || "peer");
    const team = message.team === "blue" ? "blue" : "red";
    let remote = state.remotePlayers.get(id);
    if (!remote) {
      remote = createRemotePlayer(id, team);
      state.remotePlayers.set(id, remote);
    }

    remote.name = sanitizePlayerName(message.name || remote.name || "Peer");
    remote.team = team;
    remote.dead = Boolean(message.dead);
    remote.health = Number.isFinite(message.health) ? message.health : remote.health;
    remote.yaw = Number.isFinite(message.yaw) ? message.yaw : remote.yaw;
    remote.pitch = Number.isFinite(message.pitch) ? message.pitch : remote.pitch;
    remote.activeSlot = message.activeSlot || remote.activeSlot;
    remote.weapon = message.weapon || remote.weapon;
    remote.lastSeen = performance.now() / 1000;
    if (Array.isArray(message.pos) && message.pos.length >= 3) {
      remote.pos = [
        clamp(Number(message.pos[0]) || 0, -WORLD_LIMIT + 1.2, WORLD_LIMIT - 1.2),
        Number(message.pos[1]) || EYE_HEIGHT,
        clamp(Number(message.pos[2]) || 0, -WORLD_LIMIT + 1.2, WORLD_LIMIT - 1.2)
      ];
    }
    updateRemoteTag(remote);
    updateNetworkUi();
  }

  function createRemotePlayer(id, team) {
    const seed = Math.abs(stringHash(id)) % 1000;
    const remote = {
      id,
      name: "Peer",
      team,
      pos: mapPoint(team === "blue" ? -5 : 5, EYE_HEIGHT, team === "blue" ? 14 : -14),
      yaw: team === "blue" ? 0 : Math.PI,
      pitch: 0,
      dead: false,
      health: 100,
      activeSlot: "rifle",
      weapon: "Varsity Marker",
      seed,
      lastSeen: performance.now() / 1000,
      uniform: createUniform(team, seed % 9),
      nameTag: document.createElement("div")
    };
    remote.nameTag.className = `name-tag ${team}`;
    ui.nameTags.appendChild(remote.nameTag);
    updateRemoteTag(remote);
    return remote;
  }

  function updateRemoteTag(remote) {
    if (!remote.nameTag) return;
    remote.nameTag.className = `name-tag ${remote.team === "blue" ? "blue" : "red"}`;
    remote.nameTag.innerHTML = `<span>${remote.name}</span><small>WEBRTC - ${remote.team.toUpperCase()}</small>`;
  }

  function clearRemotePlayers() {
    state.remotePlayers.forEach((remote) => {
      if (remote.nameTag) remote.nameTag.remove();
    });
    state.remotePlayers.clear();
    updateNetworkUi();
  }

  function sendHello() {
    sendData({
      type: "hello",
      id: state.clientId,
      name: playerName,
      team: localNetworkTeam()
    });
  }

  function sendNetworkFire(from, to, color) {
    sendData({
      type: "fire",
      id: state.clientId,
      name: playerName,
      team: localNetworkTeam(),
      from,
      to,
      color
    });
  }

  function sendData(message) {
    if (!isChannelOpen()) return;
    try {
      state.network.channel.send(JSON.stringify(message));
    } catch (error) {
      setNetworkStatus("error");
    }
  }

  function disconnectPeer(nextStatus, silent) {
    if (state.network.channel) {
      try {
        state.network.channel.close();
      } catch (error) {
        // Ignore close errors from already-closing channels.
      }
    }
    if (state.network.peer) {
      try {
        state.network.peer.close();
      } catch (error) {
        // Ignore close errors from already-closing peers.
      }
    }
    state.network.peer = null;
    state.network.channel = null;
    state.network.role = "local";
    state.network.sendTimer = 0;
    setNetworkStatus(nextStatus || "offline");
    clearRemotePlayers();
    if (!silent) addFeed("WebRTC", "Disconnected");
  }

  function setPlayerName(value, persist) {
    playerName = sanitizePlayerName(value);
    if (ui.playerNameInput && ui.playerNameInput.value !== playerName) ui.playerNameInput.value = playerName;
    if (ui.onlineNameInput && ui.onlineNameInput.value !== playerName) ui.onlineNameInput.value = playerName;
    if (persist !== false) savePlayerName();
    if (isChannelOpen()) sendHello();
    updateNetworkUi();
  }

  function setNetworkStatus(status) {
    state.network.status = status;
    updateNetworkUi();
  }

  function updateNetworkUi() {
    if (!ui.networkStatus) return;
    const status = networkStatusLabel(state.network.status);
    const connected = state.network.status === "connected";
    const peerCount = Array.from(state.remotePlayers.values()).filter((remote) => performance.now() / 1000 - remote.lastSeen <= NETWORK_TIMEOUT).length;
    ui.networkStatus.textContent = status;
    ui.homeNetworkStatus.textContent = connected ? `${peerCount || 1} ONLINE` : status;
    ui.homeNetworkStatus.classList.toggle("online", connected);
    ui.networkRole.textContent = state.network.role.toUpperCase();
    ui.peerCount.textContent = String(peerCount);
    const reusable = ["offline", "closed", "failed", "disconnected", "error"].includes(state.network.status);
    const busy = Boolean(state.network.peer) && !reusable;
    ui.hostOfferButton.disabled = busy || connected;
    ui.joinOfferButton.disabled = busy || connected;
    ui.acceptAnswerButton.disabled = state.network.role !== "host" || !["waiting-answer", "connecting"].includes(state.network.status) || connected;
    ui.disconnectButton.disabled = state.network.status === "offline" || state.network.status === "unsupported";
  }

  function localNetworkTeam() {
    return state.network.role === "joiner" ? "red" : "blue";
  }

  function activeItemName() {
    if (isFirearmSlot(state.activeSlot)) return weapons[state.activeWeapon].name;
    if (state.activeSlot === "melee") return getEquippedMelee().name;
    return getEquippedUtility().name;
  }

  function isChannelOpen() {
    return state.network.channel && state.network.channel.readyState === "open";
  }

  function supportsWebRtc() {
    return typeof RTCPeerConnection !== "undefined";
  }

  function serializeSignal(description) {
    return JSON.stringify({
      v: SIGNAL_VERSION,
      type: description.type,
      sdp: description.sdp
    }, null, 2);
  }

  function parseSignal(value) {
    const parsed = JSON.parse(value.trim());
    if (!parsed || !parsed.type || !parsed.sdp) throw new Error("Signal is missing type or sdp.");
    return new RTCSessionDescription({ type: parsed.type, sdp: parsed.sdp });
  }

  function waitForIceGathering(peer) {
    if (peer.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const timeout = window.setTimeout(done, 2500);
      peer.addEventListener("icegatheringstatechange", check);
      function check() {
        if (peer.iceGatheringState === "complete") done();
      }
      function done() {
        window.clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    });
  }

  function handleNetworkError(error) {
    setNetworkStatus("error");
    addFeed("WebRTC", error && error.message ? error.message : "Connection error");
  }

  function networkStatusLabel(status) {
    const labels = {
      offline: "OFFLINE",
      unsupported: "UNSUPPORTED",
      gathering: "GATHERING",
      "waiting-answer": "WAITING ANSWER",
      "waiting-host": "WAITING HOST",
      connecting: "CONNECTING",
      connected: "CONNECTED",
      disconnected: "DISCONNECTED",
      failed: "FAILED",
      closed: "CLOSED",
      error: "ERROR"
    };
    return labels[status] || String(status || "offline").toUpperCase();
  }

  function addTracer(from, to, color, life) {
    state.tracers.push({
      from: from.slice(),
      to: to.slice(),
      color: color.slice(),
      life,
      maxLife: life
    });
  }

  function spawnSparks(pos, color, count) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        pos: pos.slice(),
        vel: [
          (Math.random() - 0.5) * 5,
          Math.random() * 4.5,
          (Math.random() - 0.5) * 5
        ],
        color: color.slice(),
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65
      });
    }
  }

  function resetPlayer() {
    const spawn = playerSpawn;
    player.pos = spawn.slice();
    player.vel = [0, 0, 0];
    player.yaw = 0;
    player.pitch = 0;
    player.health = PLAYER_MAX_HEALTH;
    player.armor = PLAYER_MAX_ARMOR;
    player.stamina = PLAYER_MAX_STAMINA;
    player.staminaRegenDelay = 0;
    player.staminaExhausted = false;
    player.dead = false;
    player.respawnTimer = 0;
    player.aiming = false;
    player.sprintToggled = false;
    player.sneakToggled = false;
    player.crouchAmount = 0;
    player.slideTimer = 0;
    player.slideCooldown = 0;
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.grenadeCooldown = 0;
    player.meleeCooldown = 0;
    player.spawnProtection = SPAWN_PROTECTION;
    player.damageRegenDelay = 0;
    player.spree = 0;
  }

  function createBot(name, team, index) {
    const bot = {
      name,
      team,
      index,
      pos: [0, EYE_HEIGHT, 0],
      vel: [0, 0, 0],
      target: [0, 0, 0],
      yaw: 0,
      baseSpeed: 4.2 + Math.random() * 0.9,
      health: 100,
      maxHealth: 100,
      alive: true,
      respawnTimer: 0,
      retargetTimer: 0,
      fireTimer: 0,
      color: teamColors[team],
      uniform: createUniform(team, index),
      nameTag: null
    };
    resetBot(bot, index);
    return bot;
  }

  function createUniform(team, index) {
    return {
      grade: gradeTags[index % gradeTags.length],
      number: `${team === "blue" ? "B" : "R"}-${String(index + 7).padStart(2, "0")}`,
      skin: skinTones[index % skinTones.length],
      hair: hairColors[(index * 2 + (team === "blue" ? 0 : 1)) % hairColors.length]
    };
  }

  function resetBot(bot, index) {
    const spawnList = bot.team === "blue" ? blueSpawnPoints : redSpawnPoints;
    const spawn = spawnList[index % spawnList.length];
    bot.pos = [spawn[0], EYE_HEIGHT, spawn[2]];
    bot.vel = [0, 0, 0];
    bot.target = randomArenaPoint();
    bot.yaw = bot.team === "blue" ? 0 : Math.PI;
    bot.health = bot.maxHealth;
    bot.alive = true;
    bot.respawnTimer = 0;
    bot.retargetTimer = Math.random() * 2;
    bot.fireTimer = 0.8 + Math.random();
  }

  function respawnBot(bot) {
    const spawnList = bot.team === "blue" ? blueSpawnPoints : redSpawnPoints;
    const spawn = spawnList[Math.floor(Math.random() * spawnList.length)];
    bot.pos = [spawn[0], EYE_HEIGHT, spawn[2]];
    bot.vel = [0, 0, 0];
    bot.target = randomArenaPoint();
    bot.health = bot.maxHealth;
    bot.alive = true;
    bot.fireTimer = 0.9 + Math.random();
  }

  function activeBots() {
    return bots;
  }

  function randomArenaPoint() {
    return [
      (Math.random() * 2 - 1) * (WORLD_LIMIT - 18),
      0,
      (Math.random() * 2 - 1) * (WORLD_LIMIT - 18)
    ];
  }

  function collidePlayer() {
    for (const solid of solids) {
      if (!solid.solid || solid.scale[1] > 4.5) continue;
      const min = solidMin(solid);
      const max = solidMax(solid);
      if (player.pos[1] < min[1] || player.pos[1] - EYE_HEIGHT > max[1]) continue;
      resolveCircleAabb(player.pos, PLAYER_RADIUS, min, max);
    }
  }

  function collideBot(bot) {
    for (const solid of solids) {
      if (!solid.solid || solid.scale[1] > 4.5) continue;
      const min = solidMin(solid);
      const max = solidMax(solid);
      resolveCircleAabb(bot.pos, 0.48, min, max);
    }
  }

  function resolveCircleAabb(pos, radius, min, max) {
    const closestX = clamp(pos[0], min[0], max[0]);
    const closestZ = clamp(pos[2], min[2], max[2]);
    const dx = pos[0] - closestX;
    const dz = pos[2] - closestZ;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius || d2 === 0) {
      if (d2 !== 0) return;
      const left = Math.abs(pos[0] - min[0]);
      const right = Math.abs(max[0] - pos[0]);
      const front = Math.abs(pos[2] - min[2]);
      const back = Math.abs(max[2] - pos[2]);
      const smallest = Math.min(left, right, front, back);
      if (smallest === left) pos[0] = min[0] - radius;
      else if (smallest === right) pos[0] = max[0] + radius;
      else if (smallest === front) pos[2] = min[2] - radius;
      else pos[2] = max[2] + radius;
      return;
    }
    const dist = Math.sqrt(d2);
    const push = radius - dist;
    pos[0] += (dx / dist) * push;
    pos[2] += (dz / dist) * push;
  }

  function hasLineOfSight(from, to) {
    const dir = normalize(sub(to, from));
    const maxT = length(sub(to, from));
    for (const solid of solids) {
      if (!solid.solid) continue;
      const t = rayAabb(from, dir, solidMin(solid), solidMax(solid));
      if (t !== null && t > 0.02 && t < maxT) return false;
    }
    return true;
  }

  function getForward() {
    return yawPitchForward(player.yaw, player.pitch);
  }

  function yawPitchForward(yaw, pitch) {
    const cp = Math.cos(pitch);
    return normalize([
      Math.sin(yaw) * cp,
      Math.sin(pitch),
      -Math.cos(yaw) * cp
    ]);
  }

  function updateCameraBasis() {
    cameraForward = getForward();
    cameraRight = normalize(cross(cameraForward, [0, 1, 0]));
    if (length(cameraRight) < 0.001) cameraRight = [1, 0, 0];
    cameraUp = normalize(cross(cameraRight, cameraForward));
  }

  function getCameraPos() {
    return [player.pos[0], player.pos[1] - player.crouchAmount * 0.58, player.pos[2]];
  }

  function spreadDirection(forward, spread) {
    return spreadDirectionFromBasis(forward, spread);
  }

  function spreadDirectionFromBasis(forward, spread) {
    let right = normalize(cross(forward, [0, 1, 0]));
    if (length(right) < 0.001) right = [1, 0, 0];
    const up = normalize(cross(right, forward));
    const angle = Math.random() * TAU;
    const radius = Math.random() * spread;
    return normalize(add(forward, add(scale(right, Math.cos(angle) * radius), scale(up, Math.sin(angle) * radius))));
  }

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1) * settings.resolutionScale;
    const width = Math.floor(canvas.clientWidth * ratio);
    const height = Math.floor(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return cloneSettings(DEFAULT_SETTINGS);
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        keybinds: { ...DEFAULT_SETTINGS.keybinds, ...(parsed.keybinds || {}) }
      };
    } catch (error) {
      return cloneSettings(DEFAULT_SETTINGS);
    }
  }

  function loadPlayerName() {
    try {
      return sanitizePlayerName(localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "Player");
    } catch (error) {
      return "Player";
    }
  }

  function savePlayerName() {
    try {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName);
    } catch (error) {
      // The current tab still keeps the chosen name if storage is blocked.
    }
  }

  function sanitizePlayerName(value) {
    const clean = String(value || "")
      .replace(/[^a-z0-9 _-]/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 18);
    return clean || "Player";
  }

  function createClientId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function stringHash(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function cloneSettings(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      // Settings still work for the current session if storage is blocked.
    }
  }

  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean, 16);
    if (Number.isNaN(value)) return `rgba(255, 255, 255, ${alpha})`;
    const r = value >> 16 & 255;
    const g = value >> 8 & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function createRenderingContext(targetCanvas, options, errors) {
    const attempts = ["webgl2", "webgl", "experimental-webgl"];
    for (const id of attempts) {
      try {
        const context = targetCanvas.getContext(id, options);
        if (context) return context;
        errors.push(`${id}: returned null`);
      } catch (error) {
        errors.push(`${id}: ${error.message || error}`);
      }
    }
    return null;
  }

  function buildWebGLDiagnostics(errors) {
    const lines = [
      `Browser: ${navigator.userAgent}`,
      `Secure context: ${window.isSecureContext ? "yes" : "no"}`,
      "Context attempts:"
    ];

    if (errors.length) {
      errors.forEach((error) => lines.push(`- ${error}`));
    } else {
      lines.push("- Browser did not provide a context creation reason.");
    }

    lines.push("");
    lines.push("Chrome checks:");
    lines.push("- Open chrome://gpu and look for the WebGL and WebGL2 rows.");
    lines.push("- Open chrome://settings/system and make sure hardware acceleration is on.");
    lines.push("- Fully quit and reopen Chrome after changing flags or acceleration.");
    lines.push("- Try an Incognito window with extensions disabled.");

    return lines.join("\n");
  }

  function box(name, pos, scaleVector, color, solid) {
    return { name, pos, scale: scaleVector, color, solid };
  }

  function mapPoint(x, y, z) {
    return [x * MAP_SCALE, y, z * MAP_SCALE];
  }

  function arenaBox(name, pos, scaleVector, color, solid) {
    return box(
      name,
      mapPoint(pos[0], pos[1], pos[2]),
      [scaleVector[0] * MAP_SCALE, scaleVector[1], scaleVector[2] * MAP_SCALE],
      color,
      solid
    );
  }

  function campusSolids() {
    const items = [
      arenaBox("gym-stage", [0, 0.55, -23.2], [18, 1.1, 2.8], [0.17, 0.18, 0.2], true),
      arenaBox("score-table", [0, 0.6, -19.3], [8.2, 1.2, 0.9], [0.11, 0.15, 0.19], true),
      arenaBox("trophy-case", [0, 1.25, 23.5], [7.2, 2.5, 0.55], [0.95, 0.72, 0.28], true),
      arenaBox("trophy-glass", [0, 1.35, 23.05], [6.5, 1.65, 0.18], [0.32, 0.7, 0.92], false),
      arenaBox("bus-body", [19.5, 1.05, 22.0], [8.4, 2.1, 2.2], [0.95, 0.72, 0.16], true),
      arenaBox("bus-window-a", [17.0, 2.0, 20.86], [1.3, 0.55, 0.12], [0.08, 0.16, 0.22], false),
      arenaBox("bus-window-b", [19.3, 2.0, 20.86], [1.3, 0.55, 0.12], [0.08, 0.16, 0.22], false),
      arenaBox("bus-window-c", [21.6, 2.0, 20.86], [1.3, 0.55, 0.12], [0.08, 0.16, 0.22], false),
      arenaBox("faculty-desk", [-19.0, 0.7, -22.0], [5.4, 1.4, 1.2], [0.34, 0.26, 0.19], true),
      arenaBox("printer-cart", [-22.6, 0.55, -18.2], [1.5, 1.1, 2.3], [0.16, 0.19, 0.22], true),
      arenaBox("vending-machine", [22.8, 1.4, -19.3], [1.8, 2.8, 1.1], [0.05, 0.36, 0.58], true),
      arenaBox("pep-banner-blue", [-12.0, 3.25, 25.7], [8.0, 1.15, 0.22], [0.12, 0.55, 0.9], false),
      arenaBox("pep-banner-red", [12.0, 3.25, -25.7], [8.0, 1.15, 0.22], [0.86, 0.13, 0.2], false),
      arenaBox("cafeteria-counter", [-22.0, 0.85, 18.0], [1.8, 1.7, 9.8], [0.42, 0.45, 0.42], true),
      arenaBox("library-shelf-a", [22.0, 1.15, 12.0], [1.6, 2.3, 7.2], [0.28, 0.21, 0.14], true),
      arenaBox("library-shelf-b", [22.0, 1.15, 3.4], [1.6, 2.3, 5.8], [0.26, 0.19, 0.13], true)
    ];

    for (let row = 0; row < 4; row++) {
      const height = 0.26 + row * 0.2;
      const width = 0.9 + row * 0.1;
      items.push(arenaBox(`west-bleacher-${row}`, [-24.0 + row * 0.85, height, 0], [width, 0.28, 27.0], [0.18 + row * 0.02, 0.24 + row * 0.02, 0.3 + row * 0.03], true));
      items.push(arenaBox(`east-bleacher-${row}`, [24.0 - row * 0.85, height, 0], [width, 0.28, 27.0], [0.3 + row * 0.02, 0.19 + row * 0.01, 0.22 + row * 0.02], true));
    }

    for (let i = 0; i < 8; i++) {
      const x = -17.5 + i * 5.0;
      const blue = i % 2 === 0;
      items.push(arenaBox(`north-locker-${i}`, [x, 1.45, -25.55], [1.8, 2.9, 0.32], blue ? [0.12, 0.38, 0.58] : [0.18, 0.47, 0.64], false));
      items.push(arenaBox(`south-locker-${i}`, [x, 1.45, 25.55], [1.8, 2.9, 0.32], blue ? [0.64, 0.18, 0.23] : [0.78, 0.26, 0.28], false));
      items.push(arenaBox(`north-locker-handle-${i}`, [x + 0.55, 1.45, -25.38], [0.12, 0.62, 0.08], [0.92, 0.94, 0.9], false));
      items.push(arenaBox(`south-locker-handle-${i}`, [x + 0.55, 1.45, 25.38], [0.12, 0.62, 0.08], [0.92, 0.94, 0.9], false));
    }

    for (let i = 0; i < 6; i++) {
      const x = -19 + i * 7.6;
      items.push(arenaBox(`north-poster-${i}`, [x, 3.75, -25.32], [2.2, 1.3, 0.12], i % 2 ? [0.95, 0.72, 0.2] : [0.18, 0.68, 0.94], false));
      items.push(arenaBox(`south-poster-${i}`, [x, 3.75, 25.32], [2.2, 1.3, 0.12], i % 2 ? [0.9, 0.2, 0.28] : [0.26, 0.86, 0.48], false));
    }

    for (let i = 0; i < 7; i++) {
      items.push(arenaBox(`parking-cone-${i}`, [15.4 + i * 1.25, 0.33, 18.6], [0.42, 0.66, 0.42], [1.0, 0.42, 0.08], true));
      items.push(arenaBox(`cone-stripe-${i}`, [15.4 + i * 1.25, 0.52, 18.6], [0.44, 0.08, 0.44], [0.96, 0.96, 0.9], false));
    }

    [
      [-16, 12], [-10, 8], [-15, -10], [14, -12], [10, -7], [15, 8]
    ].forEach(([x, z], index) => {
      const tableColor = index % 2 === 0 ? [0.43, 0.36, 0.25] : [0.18, 0.31, 0.36];
      items.push(arenaBox(`caf-table-${index}`, [x, 0.6, z], [3.4, 0.35, 1.2], tableColor, true));
      items.push(arenaBox(`caf-bench-a-${index}`, [x, 0.42, z - 1.15], [3.6, 0.25, 0.38], [0.12, 0.15, 0.17], true));
      items.push(arenaBox(`caf-bench-b-${index}`, [x, 0.42, z + 1.15], [3.6, 0.25, 0.38], [0.12, 0.15, 0.17], true));
    });

    return items;
  }

  function campusDecals() {
    const items = [
      arenaBox("gym-half-line", [0, 0.031, 0], [48, 0.05, 0.18], [0.92, 0.88, 0.65], false),
      arenaBox("gym-center-line", [0, 0.032, 0], [0.18, 0.05, 48], [0.92, 0.88, 0.65], false),
      arenaBox("blue-key", [0, 0.034, 18], [11.0, 0.05, 5.2], [0.08, 0.35, 0.62], false),
      arenaBox("red-key", [0, 0.035, -18], [11.0, 0.05, 5.2], [0.64, 0.1, 0.16], false),
      arenaBox("bus-lane", [18.0, 0.036, 17.5], [14.0, 0.05, 0.2], [0.95, 0.72, 0.16], false),
      arenaBox("cafeteria-zone", [-18.0, 0.037, 13.0], [8.0, 0.05, 8.0], [0.18, 0.32, 0.29], false),
      arenaBox("library-zone", [18.0, 0.038, 8.0], [7.0, 0.05, 8.5], [0.24, 0.18, 0.34], false)
    ];

    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * TAU;
      items.push({
        ...arenaBox(`center-circle-${i}`, [Math.cos(angle) * 3.25, 0.041, Math.sin(angle) * 3.25], [1.25, 0.05, 0.16], [0.94, 0.9, 0.7], false),
        yaw: -angle
      });
    }

    [-18, -11, -4, 4, 11, 18].forEach((x, index) => {
      items.push(arenaBox(`hall-arrow-blue-${index}`, [x, 0.043, 14.4], [2.6, 0.05, 0.22], [0.24, 0.78, 1.0], false));
      items.push(arenaBox(`hall-arrow-red-${index}`, [x, 0.044, -14.4], [2.6, 0.05, 0.22], [1.0, 0.28, 0.35], false));
    });

    return items;
  }

  function solidMin(solid) {
    return [
      solid.pos[0] - solid.scale[0] / 2,
      solid.pos[1] - solid.scale[1] / 2,
      solid.pos[2] - solid.scale[2] / 2
    ];
  }

  function solidMax(solid) {
    return [
      solid.pos[0] + solid.scale[0] / 2,
      solid.pos[1] + solid.scale[1] / 2,
      solid.pos[2] + solid.scale[2] / 2
    ];
  }

  function raySphere(origin, dir, center, radius) {
    const oc = sub(origin, center);
    const b = dot(oc, dir);
    const c = dot(oc, oc) - radius * radius;
    const h = b * b - c;
    if (h < 0) return null;
    const t = -b - Math.sqrt(h);
    return t >= 0 ? t : null;
  }

  function rayAabb(origin, dir, min, max) {
    let tMin = 0;
    let tMax = Infinity;
    for (let axis = 0; axis < 3; axis++) {
      if (Math.abs(dir[axis]) < 0.00001) {
        if (origin[axis] < min[axis] || origin[axis] > max[axis]) return null;
      } else {
        const inv = 1 / dir[axis];
        let t1 = (min[axis] - origin[axis]) * inv;
        let t2 = (max[axis] - origin[axis]) * inv;
        if (t1 > t2) {
          const temp = t1;
          t1 = t2;
          t2 = temp;
        }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }
    }
    return tMin;
  }

  function createProgram(context, vertex, fragment) {
    const vertexShader = compileShader(context, context.VERTEX_SHADER, vertex);
    const fragmentShader = compileShader(context, context.FRAGMENT_SHADER, fragment);
    const shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);
    if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
      throw new Error(context.getProgramInfoLog(shaderProgram) || "Could not link shader program.");
    }
    return shaderProgram;
  }

  function compileShader(context, type, source) {
    const shader = context.createShader(type);
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      throw new Error(context.getShaderInfoLog(shader) || "Could not compile shader.");
    }
    return shader;
  }

  function createCubeMesh() {
    const vertices = [];
    const faces = [
      [[0, 0, 1], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]],
      [[0, 0, -1], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]],
      [[1, 0, 0], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]],
      [[-1, 0, 0], [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]],
      [[0, 1, 0], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
      [[0, -1, 0], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]]
    ];

    faces.forEach((face) => {
      const normal = face[0];
      const a = face[1];
      const b = face[2];
      const c = face[3];
      const d = face[4];
      pushVertex(vertices, a, normal);
      pushVertex(vertices, b, normal);
      pushVertex(vertices, c, normal);
      pushVertex(vertices, a, normal);
      pushVertex(vertices, c, normal);
      pushVertex(vertices, d, normal);
    });

    return new Float32Array(vertices);
  }

  function pushVertex(vertices, pos, normal) {
    vertices.push(pos[0], pos[1], pos[2], normal[0], normal[1], normal[2]);
  }

  function mat4() {
    return new Float32Array(16);
  }

  function mat4Perspective(out, fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }

  function mat4LookAt(out, eye, target, up) {
    const z = normalize(sub(eye, target));
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    out[0] = x[0];
    out[1] = y[0];
    out[2] = z[0];
    out[3] = 0;
    out[4] = x[1];
    out[5] = y[1];
    out[6] = z[1];
    out[7] = 0;
    out[8] = x[2];
    out[9] = y[2];
    out[10] = z[2];
    out[11] = 0;
    out[12] = -dot(x, eye);
    out[13] = -dot(y, eye);
    out[14] = -dot(z, eye);
    out[15] = 1;
    return out;
  }

  function modelMatrix(pos, scaleVector, yaw) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return new Float32Array([
      c * scaleVector[0], 0, -s * scaleVector[0], 0,
      0, scaleVector[1], 0, 0,
      s * scaleVector[2], 0, c * scaleVector[2], 0,
      pos[0], pos[1], pos[2], 1
    ]);
  }

  function orientedMatrix(pos, basis, scaleVector) {
    const x = scale(normalize(basis[0]), scaleVector[0]);
    const y = scale(normalize(basis[1]), scaleVector[1]);
    const z = scale(normalize(basis[2]), scaleVector[2]);
    return new Float32Array([
      x[0], x[1], x[2], 0,
      y[0], y[1], y[2], 0,
      z[0], z[1], z[2], 0,
      pos[0], pos[1], pos[2], 1
    ]);
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a, scalar) {
    return [a[0] * scalar, a[1] * scalar, a[2] * scalar];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function length(a) {
    return Math.hypot(a[0], a[1], a[2]);
  }

  function normalize(a) {
    const len = length(a);
    if (len < 0.00001) return [0, 0, 0];
    return [a[0] / len, a[1] / len, a[2] / len];
  }

  function distance2d(a, b) {
    return Math.hypot(a[0] - b[0], a[2] - b[2]);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function rotateY(point, yaw) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return [
      point[0] * c + point[2] * s,
      point[1],
      -point[0] * s + point[2] * c
    ];
  }

  function scaleColor(color, amount) {
    return [
      clamp(color[0] * amount, 0, 1),
      clamp(color[1] * amount, 0, 1),
      clamp(color[2] * amount, 0, 1)
    ];
  }
})();

(async function () {
  "use strict";

  const GAME_URL = "src/game.js?v=12";

  try {
    const response = await fetch(GAME_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${GAME_URL}`);
    const source = patchGameSource(await response.text());
    (0, eval)(`${source}\n//# sourceURL=${GAME_URL}`);
  } catch (error) {
    const fallback = document.createElement("script");
    fallback.src = GAME_URL;
    document.body.appendChild(fallback);
    console.error(error);
  }

  function patchGameSource(source) {
    if (source.includes("AWP Marker") && source.includes("open-campus-ground") && source.includes("getSkinColor") && source.includes("recordKill")) return source;

    const replaceOnce = (from, to) => {
      if (!source.includes(from)) {
        console.warn("Gameplay patch skipped missing source block:", from.slice(0, 80));
        return;
      }
      source = source.replace(from, to);
    };

    replaceOnce("const WORLD_LIMIT = 25 * MAP_SCALE;", "const WORLD_LIMIT = 42 * MAP_SCALE;");
    replaceOnce(
      `  let settings = loadSettings();
  let playerName = loadPlayerName();`,
      `  let settings = loadSettings();
  let playerName = loadPlayerName();
  const skins = window.hssSkins;
  if (skins && typeof skins.init === "function") skins.init();`
    );
    replaceOnce(
      `const PICKUP_HEAL = 28;
  const PICKUP_RESPAWN = 10;
  const BOT_SIGHT_RANGE = 140;
  const BOT_DAMAGE = 10;
  const BOT_FIRE_MIN = 0.45;
  const BOT_FIRE_SPREAD = 0.11;`,
      `const PICKUP_HEAL = 28;
  const PICKUP_AMMO_RATIO = 0.65;
  const PICKUP_RESPAWN = 10;
  const BOT_SIGHT_RANGE = 170;
  const BOT_DAMAGE = 11;
  const BOT_FIRE_MIN = 0.34;
  const BOT_FIRE_SPREAD = 0.085;`
    );

    replaceOnce(
      `    {
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
  ];`,
      `    {
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
    },
    {
      name: "AWP Marker",
      short: "AWP",
      category: "rifle",
      damage: 112,
      price: 4750,
      description: "One-shot precision foam sniper. Slow, loud, expensive.",
      fireRate: 0.72,
      magazineSize: 5,
      reserveSize: 20,
      reloadTime: 2.6,
      range: 260,
      spread: 0.0018,
      recoil: 0.052,
      headshotMultiplier: 2.4,
      automatic: false,
      color: [0.72, 0.94, 1.0]
    },
    {
      name: "Foam Flamethrower",
      short: "FOAM",
      category: "rifle",
      damage: 8,
      price: 3600,
      description: "Short-range cone of pep-rally foam pressure.",
      fireRate: 20,
      magazineSize: 90,
      reserveSize: 180,
      reloadTime: 3.0,
      range: 34,
      spread: 0.07,
      recoil: 0.003,
      automatic: true,
      flame: true,
      color: [1.0, 0.55, 0.16]
    }
  ];`
    );

    replaceOnce(
      `  const pickups = [
    { pos: mapPoint(-18, 0.55, 7), cooldown: 0 },
    { pos: mapPoint(18, 0.55, -7), cooldown: 0 },
    { pos: mapPoint(-6, 0.55, -12), cooldown: 0 },
    { pos: mapPoint(6, 0.55, 12), cooldown: 0 },
    { pos: mapPoint(0, 0.55, 0), cooldown: 0 }
  ];`,
      `  const pickups = [
    { type: "heal", pos: mapPoint(-18, 0.55, 7), cooldown: 0 },
    { type: "heal", pos: mapPoint(18, 0.55, -7), cooldown: 0 },
    { type: "heal", pos: mapPoint(-35, 0.55, -31), cooldown: 0 },
    { type: "heal", pos: mapPoint(35, 0.55, 31), cooldown: 0 },
    { type: "ammo", pos: mapPoint(-6, 0.55, -12), cooldown: 0 },
    { type: "ammo", pos: mapPoint(6, 0.55, 12), cooldown: 0 },
    { type: "ammo", pos: mapPoint(-35, 0.55, 31), cooldown: 0 },
    { type: "ammo", pos: mapPoint(35, 0.55, -31), cooldown: 0 },
    { type: "hybrid", pos: mapPoint(0, 0.55, 0), cooldown: 0 }
  ];`
    );

    replaceOnce(
      `  const solids = [
    arenaBox("floor", [0, -0.08, 0], [52, 0.16, 52], [0.13, 0.16, 0.18], false),
    arenaBox("north-wall", [0, 2.4, -26.2], [52, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("south-wall", [0, 2.4, 26.2], [52, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("west-wall", [-26.2, 2.4, 0], [0.8, 4.8, 52], [0.22, 0.30, 0.35], true),
    arenaBox("east-wall", [26.2, 2.4, 0], [0.8, 4.8, 52], [0.22, 0.30, 0.35], true),`,
      `  const solids = [
    arenaBox("open-campus-ground", [0, -0.18, 0], [86, 0.12, 86], [0.11, 0.26, 0.22], false),
    arenaBox("floor", [0, -0.08, 0], [52, 0.16, 52], [0.13, 0.16, 0.18], false),
    arenaBox("north-wall-left", [-17.0, 2.4, -26.2], [18, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("north-wall-right", [17.0, 2.4, -26.2], [18, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("south-wall-left", [-17.0, 2.4, 26.2], [18, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("south-wall-right", [17.0, 2.4, 26.2], [18, 4.8, 0.8], [0.22, 0.30, 0.35], true),
    arenaBox("west-wall-north", [-26.2, 2.4, -17.0], [0.8, 4.8, 18], [0.22, 0.30, 0.35], true),
    arenaBox("west-wall-south", [-26.2, 2.4, 17.0], [0.8, 4.8, 18], [0.22, 0.30, 0.35], true),
    arenaBox("east-wall-north", [26.2, 2.4, -17.0], [0.8, 4.8, 18], [0.22, 0.30, 0.35], true),
    arenaBox("east-wall-south", [26.2, 2.4, 17.0], [0.8, 4.8, 18], [0.22, 0.30, 0.35], true),`
    );

    source = source.split(`    ammo.forEach((slot, index) => {
      slot.magazine = weapons[index].magazineSize;
      slot.reserve = weapons[index].reserveSize;
      slot.reloadRemaining = 0;
      slot.reloadTotal = 0;
      slot.fireTimer = 0;
    });`).join("    resetAllAmmo();");

    replaceOnce(
      `    ui.startButton.textContent = "Start Round";
  }

  function loop(time) {`,
      `    ui.startButton.textContent = "Start Round";
  }

  function resetAllAmmo() {
    ammo.forEach((slot, index) => resetWeaponAmmo(index));
  }

  function resetWeaponAmmo(index) {
    const weapon = weapons[index];
    const slot = ammo[index];
    if (!weapon || !slot) return;
    slot.magazine = weapon.magazineSize;
    slot.reserve = weapon.reserveSize;
    slot.reloadRemaining = 0;
    slot.reloadTotal = 0;
    slot.fireTimer = 0;
  }

  function refillEquippedAmmo(ratio) {
    ["rifle", "pistol"].forEach((category) => {
      const index = findWeaponIndex(state.loadout[category]);
      const weapon = weapons[index];
      const slot = ammo[index];
      if (!weapon || !slot) return;
      slot.magazine = weapon.magazineSize;
      slot.reserve = Math.min(weapon.reserveSize, slot.reserve + Math.ceil(weapon.reserveSize * ratio));
      slot.reloadRemaining = 0;
      slot.reloadTotal = 0;
    });
  }

  function dropLoadoutOnDeath() {
    state.loadout = { ...DEFAULT_ROUND_LOADOUT };
    resetAllAmmo();
    switchSlot("rifle");
    buildLoadoutPanel();
    updateMenuSummary();
  }

  function loop(time) {`
    );

    replaceOnce(
      `      state.enemyScore += 1;
      player.spree = 0;
      addFeed(source, "You");`,
      `      state.enemyScore += 1;
      player.spree = 0;
      dropLoadoutOnDeath();
      addFeed(source, "You");
      addFeed("Loadout", "Dropped on respawn");`
    );

    replaceOnce(
      `      dropLoadoutOnDeath();
      addFeed(source, "You");`,
      `      dropLoadoutOnDeath();
      if (skins && typeof skins.recordDeath === "function") skins.recordDeath({ source });
      addFeed(source, "You");`
    );

    replaceOnce(
      `    const labels = {
      home: state.paused ? "Paused" : "Arena home",
      loadout: "Round buy menu",
      online: "Peer link",
      settings: "Settings"
    };`,
      `    const labels = {
      home: state.paused ? "Paused" : "Arena home",
      loadout: "Round buy menu",
      locker: "Locker",
      online: "Peer link",
      settings: "Settings"
    };`
    );

    replaceOnce(
      `    const origin = add(getCameraPos(), [0, -0.05, 0]);
    const dir = spreadDirection(getForward(), weapon.spread * aimModifier);
    let bestT = weapon.range;`,
      `    const origin = add(getCameraPos(), [0, -0.05, 0]);
    const dir = spreadDirection(getForward(), weapon.spread * aimModifier);
    if (weapon.flame) {
      fireFlame({ ...weapon, color: weaponColor }, origin, dir);
      return;
    }
    let bestT = weapon.range;`
    );

    replaceOnce(
      `    const weapon = weapons[state.activeWeapon];
    const slot = ammo[state.activeWeapon];`,
      `    const weapon = weapons[state.activeWeapon];
    const weaponColor = skins && typeof skins.getSkinColor === "function" ? skins.getSkinColor(weapon.name, weapon.color) : weapon.color;
    const slot = ammo[state.activeWeapon];`
    );

    replaceOnce(
      `    addTracer(origin, hitPoint, weapon.color, 0.12);
    sendNetworkFire(origin, hitPoint, weapon.color);`,
      `    addTracer(origin, hitPoint, weaponColor, 0.12);
    sendNetworkFire(origin, hitPoint, weaponColor);`
    );

    replaceOnce(
      `      if (attackerName === "You") {
        player.spree += 1;
        awardCash(KO_CASH + (attacker && attacker.headshot ? HEADSHOT_CASH : 0) + (attacker && attacker.backstab ? BACKSTAB_CASH : 0), tag || "KO");
      }`,
      `      if (attackerName === "You") {
        player.spree += 1;
        if (skins && typeof skins.recordKill === "function") {
          skins.recordKill({
            weapon: attacker && attacker.weapon ? attacker.weapon : "Unknown",
            headshot: Boolean(attacker && attacker.headshot),
            backstab: Boolean(attacker && attacker.backstab)
          });
        }
        awardCash(KO_CASH + (attacker && attacker.headshot ? HEADSHOT_CASH : 0) + (attacker && attacker.backstab ? BACKSTAB_CASH : 0), tag || "KO");
      }`
    );

    replaceOnce(
      `      damageBot(best.bot, backstab ? meleeWeapon.backstabDamage : meleeWeapon.damage, [best.bot.pos[0], 1.3, best.bot.pos[2]], { name: "You", team: "blue", type: "player", backstab });`,
      `      damageBot(best.bot, backstab ? meleeWeapon.backstabDamage : meleeWeapon.damage, [best.bot.pos[0], 1.3, best.bot.pos[2]], { name: "You", team: "blue", type: "player", weapon: meleeWeapon.name, backstab });`
    );

    replaceOnce(
      `    awardCash(playerWon ? WIN_CASH : LOSS_CASH, playerWon ? "Win payout" : "Loss payout");
    if (document.pointerLockElement === canvas) document.exitPointerLock();`,
      `    awardCash(playerWon ? WIN_CASH : LOSS_CASH, playerWon ? "Win payout" : "Loss payout");
    if (skins && typeof skins.completeRound === "function") {
      skins.completeRound({ won: playerWon, playerScore: state.playerScore, enemyScore: state.enemyScore });
    }
    if (document.pointerLockElement === canvas) document.exitPointerLock();`
    );

    replaceOnce(
      `  function reload() {`,
      `  function fireFlame(weapon, origin, dir) {
    const centerEnd = add(origin, scale(dir, weapon.range));
    for (let i = 0; i < 4; i++) {
      const flameDir = spreadDirectionFromBasis(dir, weapon.spread * 2.4);
      const reach = weapon.range * (0.68 + Math.random() * 0.32);
      addTracer(origin, add(origin, scale(flameDir, reach)), scaleColor(weapon.color, 0.85 + Math.random() * 0.22), 0.08);
    }
    sendNetworkFire(origin, centerEnd, weapon.color);

    activeBots().forEach((bot) => {
      if (!bot.alive || bot.team === "blue") return;
      const target = [bot.pos[0], 1.25, bot.pos[2]];
      const toBot = sub(target, origin);
      const distance = length(toBot);
      if (distance > weapon.range) return;
      const alignment = dot(normalize(toBot), dir);
      if (alignment < 0.76) return;
      if (!hasLineOfSight(origin, target)) return;
      const heat = clamp((alignment - 0.76) / 0.24, 0, 1);
      const falloff = 1 - distance / weapon.range * 0.45;
      damageBot(bot, Math.max(2, Math.round(weapon.damage * (0.75 + heat) * falloff)), target, { name: "You", team: "blue", type: "player", weapon: weapon.name });
    });
  }

  function reload() {`
    );

    replaceOnce(
      `  function updatePickups(dt) {
    pickups.forEach((pickup) => {
      pickup.cooldown = Math.max(0, pickup.cooldown - dt);
      if (pickup.cooldown > 0 || player.dead) return;
      if (distance2d(player.pos, pickup.pos) < 1.2 && player.health < PLAYER_MAX_HEALTH) {
        const healAmount = PICKUP_HEAL;
        player.health = Math.min(PLAYER_MAX_HEALTH, player.health + healAmount);
        player.armor = Math.min(Math.max(PLAYER_MAX_ARMOR, 50), player.armor + 8);
        pickup.cooldown = PICKUP_RESPAWN;
        addFeed("Pickup", \`+\${healAmount} HP\`);
      }
    });
  }`,
      `  function updatePickups(dt) {
    pickups.forEach((pickup) => {
      pickup.cooldown = Math.max(0, pickup.cooldown - dt);
      if (pickup.cooldown > 0 || player.dead) return;
      if (distance2d(player.pos, pickup.pos) < 1.35) {
        const needsHealth = pickup.type !== "ammo" && player.health < PLAYER_MAX_HEALTH;
        const needsAmmo = pickup.type !== "heal" && equippedAmmoNeedsRefill();
        if (!needsHealth && !needsAmmo) return;
        if (needsHealth) {
          const healAmount = PICKUP_HEAL;
          player.health = Math.min(PLAYER_MAX_HEALTH, player.health + healAmount);
          player.armor = Math.min(Math.max(PLAYER_MAX_ARMOR, 50), player.armor + 8);
          addFeed("Heal Pad", \`+\${healAmount} HP\`);
        }
        if (needsAmmo) {
          refillEquippedAmmo(PICKUP_AMMO_RATIO);
          addFeed("Ammo Pad", "Refilled");
        }
        pickup.cooldown = PICKUP_RESPAWN;
      }

      activeBots().forEach((bot) => {
        if (!bot.alive || pickup.type === "ammo" || pickup.cooldown > 0) return;
        if (distance2d(bot.pos, pickup.pos) < 1.45 && bot.health < bot.maxHealth) {
          bot.health = Math.min(bot.maxHealth, bot.health + PICKUP_HEAL);
          pickup.cooldown = PICKUP_RESPAWN;
        }
      });
    });
  }

  function equippedAmmoNeedsRefill() {
    return ["rifle", "pistol"].some((category) => {
      const index = findWeaponIndex(state.loadout[category]);
      const weapon = weapons[index];
      const slot = ammo[index];
      return weapon && slot && (slot.magazine < weapon.magazineSize || slot.reserve < weapon.reserveSize);
    });
  }

  function nearestReadyPickup(type, pos) {
    let best = null;
    pickups.forEach((pickup) => {
      if (pickup.cooldown > 0) return;
      if (type === "heal" && pickup.type === "ammo") return;
      if (type === "ammo" && pickup.type === "heal") return;
      const distance = distance2d(pos, pickup.pos);
      if (!best || distance < best.distance) best = { pickup, distance };
    });
    return best ? best.pickup : null;
  }`
    );

    replaceOnce(`  gl.clearColor(0.035, 0.052, 0.06, 1);`, `  gl.clearColor(0.42, 0.66, 0.88, 1);`);
    replaceOnce(
      `    const bg = 0.035 * settings.brightness;
    gl.clearColor(bg, 0.052 * settings.brightness, 0.06 * settings.brightness, 1);`,
      `    const sky = [
      0.42 * settings.brightness,
      0.66 * settings.brightness,
      0.88 * settings.brightness
    ];
    gl.clearColor(sky[0], sky[1], sky[2], 1);`
    );
    replaceOnce(
      `    gl.uniform3fv(uniforms.fogColor, [0.035 * settings.brightness, 0.052 * settings.brightness, 0.06 * settings.brightness]);`,
      `    gl.uniform3fv(uniforms.fogColor, sky);`
    );

    replaceOnce(
      `  function renderSkyBand(now) {
    if (!settings.arenaGlow) return;
    const pulse = 0.5 + Math.sin(now * 0.8) * 0.5;
    drawBox(mapPoint(0, 8, -27.0), [36 * MAP_SCALE, 8, 0.1 * MAP_SCALE], [0.03 + pulse * 0.015, 0.14, 0.18], 0);
    drawBox(mapPoint(-27.0, 8, 0), [0.1 * MAP_SCALE, 8, 36 * MAP_SCALE], [0.04, 0.11 + pulse * 0.02, 0.14], 0);
    drawBox(mapPoint(27.0, 8, 0), [0.1 * MAP_SCALE, 8, 36 * MAP_SCALE], [0.11 + pulse * 0.03, 0.08, 0.09], 0);
  }`,
      `  function renderSkyBand(now) {
    const pulse = settings.arenaGlow ? 0.5 + Math.sin(now * 0.8) * 0.5 : 0.45;
    drawBox(mapPoint(0, 10, -42.0), [88 * MAP_SCALE, 18, 0.1 * MAP_SCALE], [0.34 + pulse * 0.03, 0.58, 0.84], 0);
    drawBox(mapPoint(-42.0, 10, 0), [0.1 * MAP_SCALE, 18, 88 * MAP_SCALE], [0.32, 0.56 + pulse * 0.03, 0.78], 0);
    drawBox(mapPoint(42.0, 10, 0), [0.1 * MAP_SCALE, 18, 88 * MAP_SCALE], [0.46 + pulse * 0.04, 0.58, 0.76], 0);
    drawBox(mapPoint(0, 10, 42.0), [88 * MAP_SCALE, 18, 0.1 * MAP_SCALE], [0.50, 0.62 + pulse * 0.03, 0.76], 0);
    drawBox(mapPoint(-31, 16, -35), [4.5 * MAP_SCALE, 4.5, 0.1 * MAP_SCALE], [1.0, 0.78, 0.28], now * 0.05);
  }`
    );

    replaceOnce(
      `  function renderPickups(now) {
    pickups.forEach((pickup, index) => {
      if (pickup.cooldown > 0) return;
      const bob = Math.sin(now * 3 + index) * 0.12;
      drawBox([pickup.pos[0], pickup.pos[1] + bob, pickup.pos[2]], [0.9, 0.28, 0.9], [0.3, 1.0, 0.48], now * 1.4);
      drawBox([pickup.pos[0], pickup.pos[1] + bob + 0.02, pickup.pos[2]], [0.28, 0.9, 0.28], [0.3, 1.0, 0.48], now * 1.4);
    });
  }`,
      `  function renderPickups(now) {
    pickups.forEach((pickup, index) => {
      if (pickup.cooldown > 0) return;
      const bob = Math.sin(now * 3 + index) * 0.12;
      const isAmmo = pickup.type === "ammo";
      const isHybrid = pickup.type === "hybrid";
      const color = isHybrid ? [0.95, 0.78, 0.26] : isAmmo ? [0.28, 0.74, 1.0] : [0.3, 1.0, 0.48];
      drawBox([pickup.pos[0], pickup.pos[1] + bob, pickup.pos[2]], [1.05, 0.26, 1.05], color, now * 1.4);
      if (isAmmo) {
        drawBox([pickup.pos[0] - 0.34, pickup.pos[1] + bob + 0.12, pickup.pos[2]], [0.24, 0.78, 0.24], [0.9, 0.96, 1.0], now);
        drawBox([pickup.pos[0] + 0.34, pickup.pos[1] + bob + 0.12, pickup.pos[2]], [0.24, 0.78, 0.24], [0.9, 0.96, 1.0], now);
      } else {
        drawBox([pickup.pos[0], pickup.pos[1] + bob + 0.02, pickup.pos[2]], [0.28, 0.9, 0.28], color, now * 1.4);
      }
    });
  }`
    );

    replaceOnce(
      `    pickups.forEach((pickup) => {
      if (pickup.cooldown > 0) return;
      drawMiniDot(pickup.pos[0], pickup.pos[2], "#95f56d", 3);
    });`,
      `    pickups.forEach((pickup) => {
      if (pickup.cooldown > 0) return;
      const color = pickup.type === "ammo" ? "#5cc8ff" : pickup.type === "hybrid" ? "#f2d355" : "#95f56d";
      drawMiniDot(pickup.pos[0], pickup.pos[2], color, 3);
    });`
    );

    replaceOnce(
      `      respawnTimer: 0,
      retargetTimer: 0,
      fireTimer: 0,`,
      `      respawnTimer: 0,
      retargetTimer: 0,
      strafeTimer: 0,
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      aimSkill: 0.82 + Math.random() * 0.42,
      aggression: 0.75 + Math.random() * 0.55,
      fireTimer: 0,`
    );
    source = source.replaceAll(
      `    bot.retargetTimer = Math.random() * 2;
    bot.fireTimer = 0.8 + Math.random();`,
      `    bot.retargetTimer = Math.random() * 2;
    bot.strafeTimer = 0.3 + Math.random() * 1.1;
    bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
    bot.fireTimer = 0.8 + Math.random();`
    );
    replaceOnce(
      `    bot.health = bot.maxHealth;
    bot.alive = true;
    bot.fireTimer = 0.9 + Math.random();`,
      `    bot.health = bot.maxHealth;
    bot.alive = true;
    bot.strafeTimer = 0.3 + Math.random() * 1.1;
    bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
    bot.fireTimer = 0.9 + Math.random();`
    );

    replaceOnce(
      `  function updateBotJumpPads(bot) {
    jumpPads.forEach((pad) => {
      if (distance2d(bot.pos, pad.pos) < 2.8 && Math.random() < 0.018) {
        const away = normalize([bot.pos[0] - pad.pos[0], 0, bot.pos[2] - pad.pos[2]]);
        bot.vel[0] += away[0] * 5;
        bot.vel[2] += away[2] * 5;
      }
    });
  }`,
      `  function updateBotJumpPads(bot) {
    jumpPads.forEach((pad) => {
      if (distance2d(bot.pos, pad.pos) < 2.8 && Math.random() < 0.045) {
        const away = normalize([bot.pos[0] - pad.pos[0], 0, bot.pos[2] - pad.pos[2]]);
        bot.vel[0] += away[0] * 8;
        bot.vel[2] += away[2] * 8;
      }
    });
  }

  function updateBotSpeedPads(bot) {
    speedPads.forEach((pad) => {
      if (distance2d(bot.pos, pad.pos) < 2.9) {
        bot.vel[0] += pad.dir[0] * 7;
        bot.vel[2] += pad.dir[2] * 7;
      }
    });
  }`
    );

    replaceOnce(
      `  function updateBots(dt) {
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
  }`,
      `  function updateBots(dt) {
    activeBots().forEach((bot) => {
      if (!bot.alive) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) respawnBot(bot);
        return;
      }

      bot.fireTimer = Math.max(0, bot.fireTimer - dt);
      bot.retargetTimer -= dt;
      bot.strafeTimer -= dt;
      if (bot.strafeTimer <= 0) {
        bot.strafeTimer = 0.55 + Math.random() * 1.4;
        bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
      }

      const enemy = findBotTarget(bot);
      const healPad = bot.health < bot.maxHealth * 0.42 ? nearestReadyPickup("heal", bot.pos) : null;

      if (enemy) {
        const toEnemy = sub(enemy.pos, [bot.pos[0], EYE_HEIGHT, bot.pos[2]]);
        const flat = normalize([toEnemy[0], 0, toEnemy[2]]);
        const side = [-flat[2], 0, flat[0]];
        const desiredRange = bot.health < bot.maxHealth * 0.38 ? 42 : 18 + bot.aggression * 9;
        const rangeError = clamp((enemy.distance - desiredRange) / 28, -1, 1);
        const retreat = bot.health < bot.maxHealth * 0.28 ? -1 : 0;
        const pressure = retreat || rangeError;
        bot.target = [
          bot.pos[0] + flat[0] * pressure * 9 + side[0] * bot.strafeDir * 8,
          0,
          bot.pos[2] + flat[2] * pressure * 9 + side[2] * bot.strafeDir * 8
        ];
        bot.yaw = Math.atan2(toEnemy[0], -toEnemy[2]);
        if (healPad && bot.health < bot.maxHealth * 0.3) bot.target = [healPad.pos[0], 0, healPad.pos[2]];
        if (bot.fireTimer <= 0 && hasLineOfSight([bot.pos[0], 1.35, bot.pos[2]], enemy.pos)) botFire(bot, enemy);
      } else if (healPad) {
        bot.target = [healPad.pos[0], 0, healPad.pos[2]];
      } else if (bot.retargetTimer <= 0 || distance2d(bot.pos, bot.target) < 1.5) {
        bot.target = randomArenaPoint();
        bot.retargetTimer = 1.2 + Math.random() * 2.4;
      }

      const toTarget = sub(bot.target, bot.pos);
      const dist = Math.hypot(toTarget[0], toTarget[2]) || 1;
      const speedBoost = enemy && enemy.distance > 55 ? 1.25 : bot.health < bot.maxHealth * 0.32 ? 1.18 : 1;
      const moveX = (toTarget[0] / dist) * bot.baseSpeed * speedBoost;
      const moveZ = (toTarget[2] / dist) * bot.baseSpeed * speedBoost;
      bot.vel[0] += (moveX - bot.vel[0]) * Math.min(1, dt * 6.4);
      bot.vel[2] += (moveZ - bot.vel[2]) * Math.min(1, dt * 6.4);
      bot.pos[0] += bot.vel[0] * dt;
      bot.pos[2] += bot.vel[2] * dt;
      bot.pos[0] = clamp(bot.pos[0], -WORLD_LIMIT + 1.5, WORLD_LIMIT - 1.5);
      bot.pos[2] = clamp(bot.pos[2], -WORLD_LIMIT + 1.5, WORLD_LIMIT - 1.5);
      collideBot(bot);
      updateBotJumpPads(bot);
      updateBotSpeedPads(bot);

      if (!enemy && Math.hypot(bot.vel[0], bot.vel[2]) > 0.1) {
        bot.yaw = Math.atan2(bot.vel[0], -bot.vel[2]);
      }
    });
  }`
    );

    replaceOnce(`        pos: player.pos`, `        pos: player.pos,
        vel: player.vel,
        health: player.health`);
    replaceOnce(`        pos: [other.pos[0], EYE_HEIGHT, other.pos[2]]`, `        pos: [other.pos[0], EYE_HEIGHT, other.pos[2]],
        vel: other.vel,
        health: other.health`);
    replaceOnce(
      `      if (!best || distance < best.distance) {
        best = { ...target, distance };
      }`,
      `      const lowHealthBonus = clamp((100 - (target.health || 100)) / 100, 0, 1) * 38;
      const score = distance - lowHealthBonus;
      if (!best || score < best.score) {
        best = { ...target, distance, score };
      }`
    );

    replaceOnce(
      `  function botFire(bot, target) {
    bot.fireTimer = BOT_FIRE_MIN + Math.random() * 0.34;
    const origin = [bot.pos[0], 1.35, bot.pos[2]];
    const aim = normalize(sub(target.pos, origin));
    const miss = Math.max(0.035, target.distance / 360 + BOT_FIRE_SPREAD * 0.24);
    const dir = spreadDirectionFromBasis(aim, miss);`,
      `  function botFire(bot, target) {
    bot.fireTimer = BOT_FIRE_MIN + Math.random() * (0.28 / bot.aggression);
    const origin = [bot.pos[0], 1.35, bot.pos[2]];
    const leadTime = clamp(target.distance / 145, 0, 0.48);
    const targetPos = target.vel ? add(target.pos, scale(target.vel, leadTime)) : target.pos;
    const aim = normalize(sub(targetPos, origin));
    const miss = Math.max(0.016, target.distance / (560 * bot.aimSkill) + BOT_FIRE_SPREAD * 0.18);
    const dir = spreadDirectionFromBasis(aim, miss);`
    );

    replaceOnce(
      `    const bodyScale = state.activeSlot === "utility" ? [0.28, 0.24, 0.38] : [0.26, 0.18, 0.72];
    const barrelScale = state.activeSlot === "melee" ? [0.11, 0.09, 1.05] : state.activeSlot === "utility" ? [0.42, 0.18, 0.42] : [0.13, 0.13, 0.58];`,
      `    const bodyScale = state.activeSlot === "utility" ? [0.28, 0.24, 0.38] : equipped.flame ? [0.34, 0.24, 0.82] : equipped.name === "AWP Marker" ? [0.22, 0.16, 1.08] : [0.26, 0.18, 0.72];
    const barrelScale = state.activeSlot === "melee" ? [0.11, 0.09, 1.05] : state.activeSlot === "utility" ? [0.42, 0.18, 0.42] : equipped.flame ? [0.22, 0.22, 0.76] : equipped.name === "AWP Marker" ? [0.09, 0.09, 1.12] : [0.13, 0.13, 0.58];`
    );

    replaceOnce(
      `    const itemColor = equipped.color || [0.8, 0.9, 1.0];`,
      `    const itemColor = skins && typeof skins.getSkinColor === "function"
      ? skins.getSkinColor(equipped.name, equipped.color || [0.8, 0.9, 1.0])
      : equipped.color || [0.8, 0.9, 1.0];`
    );

    replaceOnce(
      `    return items;
  }

  function campusDecals() {`,
      `    [
      { name: "north-class", z: -16.8, boardZ: -20.8, color: [0.12, 0.24, 0.29] },
      { name: "south-class", z: 16.8, boardZ: 20.8, color: [0.27, 0.18, 0.24] }
    ].forEach((room) => {
      items.push(arenaBox(\`\${room.name}-divider-l\`, [-8.2, 1.25, room.z], [0.7, 2.5, 11.0], [0.2, 0.27, 0.31], true));
      items.push(arenaBox(\`\${room.name}-divider-r\`, [8.2, 1.25, room.z], [0.7, 2.5, 11.0], [0.2, 0.27, 0.31], true));
      items.push(arenaBox(\`\${room.name}-whiteboard\`, [0, 1.55, room.boardZ], [8.5, 1.45, 0.18], [0.9, 0.96, 0.9], false));
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const x = -5.4 + col * 3.6;
          const z = room.z + (row - 1) * 2.15;
          items.push(arenaBox(\`\${room.name}-desk-\${row}-\${col}\`, [x, 0.46, z], [1.8, 0.32, 1.1], [0.36, 0.29, 0.2], true));
          items.push(arenaBox(\`\${room.name}-chair-\${row}-\${col}\`, [x, 0.36, z + (room.z < 0 ? 0.92 : -0.92)], [0.72, 0.72, 0.62], room.color, true));
        }
      }
    });

    [
      [-35, -31, 8.5, 4.2], [-35, 31, 8.5, 4.2], [35, -31, 8.5, 4.2], [35, 31, 8.5, 4.2],
      [-34, 0, 5.5, 13.0], [34, 0, 5.5, 13.0], [0, -36, 16.0, 4.2], [0, 36, 16.0, 4.2]
    ].forEach(([x, z, sx, sz], index) => {
      const color = index % 2 === 0 ? [0.16, 0.22, 0.2] : [0.18, 0.18, 0.24];
      items.push(arenaBox(\`outdoor-cover-\${index}\`, [x, 0.85, z], [sx, 1.7, sz], color, true));
    });

    for (let i = 0; i < 10; i++) {
      const x = -38 + i * 8.4;
      items.push(arenaBox(\`courtyard-planter-n-\${i}\`, [x, 0.42, -31.5], [3.0, 0.84, 1.0], [0.15, 0.34, 0.22], true));
      items.push(arenaBox(\`courtyard-planter-s-\${i}\`, [x, 0.42, 31.5], [3.0, 0.84, 1.0], [0.15, 0.34, 0.22], true));
    }

    return items;
  }

  function campusDecals() {`
    );

    replaceOnce(
      `      arenaBox("library-zone", [18.0, 0.038, 8.0], [7.0, 0.05, 8.5], [0.24, 0.18, 0.34], false)`,
      `      arenaBox("library-zone", [18.0, 0.038, 8.0], [7.0, 0.05, 8.5], [0.24, 0.18, 0.34], false),
      arenaBox("north-courtyard-path", [0, 0.018, -33.5], [56.0, 0.05, 3.6], [0.24, 0.27, 0.25], false),
      arenaBox("south-courtyard-path", [0, 0.018, 33.5], [56.0, 0.05, 3.6], [0.24, 0.27, 0.25], false),
      arenaBox("west-courtyard-path", [-33.5, 0.019, 0], [3.6, 0.05, 56.0], [0.24, 0.27, 0.25], false),
      arenaBox("east-courtyard-path", [33.5, 0.019, 0], [3.6, 0.05, 56.0], [0.24, 0.27, 0.25], false)`
    );

    return source;
  }
})();

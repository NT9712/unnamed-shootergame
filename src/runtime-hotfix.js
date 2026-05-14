(function () {
  "use strict";

  if (!window.fetch || window.__hssRuntimeHotfix) return;
  window.__hssRuntimeHotfix = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function hssHotfixFetch(input, init) {
    const response = await nativeFetch(input, init);
    const url = typeof input === "string" ? input : input && input.url ? input.url : "";
    if (!/src\/game\.js/i.test(url)) return response;
    const source = patchGameSource(await response.text());
    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  };

  function patchGameSource(source) {
    const replace = (from, to) => {
      if (source.includes(from)) source = source.replace(from, to);
    };
    const replacePattern = (pattern, to) => {
      source = source.replace(pattern, to);
    };

    if (!source.includes("PLAYER_GROUND_SNAP")) {
      replace("  const PLAYER_RADIUS = 0.42;", "  const PLAYER_RADIUS = 0.42;\n  const PLAYER_GROUND_SNAP = 0.38;\n  const PLAYER_MAX_STANDABLE_TOP = 2.4;");
    }
    if (!source.includes("ADS_SPREAD_MULTIPLIER")) {
      replace("  const DROP_OFF_MIN = 0.55;", "  const DROP_OFF_MIN = 0.55;\n  const ADS_SPREAD_MULTIPLIER = 0.48;\n  const MOVING_SPREAD_PENALTY = 0.012;\n  const AIRBORNE_SPREAD_PENALTY = 0.026;\n  const CROUCH_SPREAD_BONUS = 0.72;\n  const BLOOM_DECAY = 5.4;\n  const MARKER_DROP_BASE = 0.0017;");
    }
    if (!source.includes("PICKUP_AMMO_RATIO")) {
      replace("  const PICKUP_HEAL = 28;\n  const PICKUP_RESPAWN = 10;", "  const PICKUP_HEAL = 28;\n  const PICKUP_AMMO_RATIO = 0.65;\n  const PICKUP_RESPAWN = 10;");
    }
    if (!source.includes("const skins = window.hssSkins")) {
      replace("  let playerName = loadPlayerName();\n\n  const weapons = [", "  let playerName = loadPlayerName();\n  const skins = window.hssSkins;\n  if (skins && typeof skins.init === \"function\") skins.init();\n\n  const weapons = [");
    }
    if (!source.includes("AWP Marker")) {
      replace(
        "    {\n      name: \"Honor Roll DMR\",\n      short: \"DMR\",\n      category: \"rifle\",\n      damage: 39,\n      price: 1300,\n      description: \"Accurate taps with strong head tags.\",\n      fireRate: 3.6,\n      magazineSize: 14,\n      reserveSize: 56,\n      reloadTime: 1.4,\n      range: 190,\n      spread: 0.003,\n      recoil: 0.018,\n      automatic: false,\n      color: [0.34, 1.0, 0.78]\n    }\n  ];",
        "    {\n      name: \"Honor Roll DMR\",\n      short: \"DMR\",\n      category: \"rifle\",\n      damage: 39,\n      price: 1300,\n      description: \"Accurate taps with strong head tags.\",\n      fireRate: 3.6,\n      magazineSize: 14,\n      reserveSize: 56,\n      reloadTime: 1.4,\n      range: 190,\n      spread: 0.003,\n      recoil: 0.018,\n      automatic: false,\n      color: [0.34, 1.0, 0.78]\n    },\n    {\n      name: \"AWP Marker\",\n      short: \"AWP\",\n      category: \"rifle\",\n      damage: 112,\n      price: 4750,\n      description: \"One-shot precision foam sniper. Slow, loud, expensive.\",\n      fireRate: 0.72,\n      magazineSize: 5,\n      reserveSize: 20,\n      reloadTime: 2.6,\n      range: 260,\n      spread: 0.0018,\n      recoil: 0.052,\n      headshotMultiplier: 2.4,\n      automatic: false,\n      color: [0.72, 0.94, 1.0]\n    },\n    {\n      name: \"Foam Flamethrower\",\n      short: \"FOAM\",\n      category: \"rifle\",\n      damage: 8,\n      price: 3600,\n      description: \"Short-range cone of pep-rally foam pressure.\",\n      fireRate: 20,\n      magazineSize: 90,\n      reserveSize: 180,\n      reloadTime: 3.0,\n      range: 34,\n      spread: 0.07,\n      recoil: 0.003,\n      automatic: true,\n      flame: true,\n      color: [1.0, 0.55, 0.16]\n    }\n  ];"
      );
    }
    if (!source.includes("isEditableTarget(event.target)")) {
      replace("      state.keys.add(key);", "      if (isEditableTarget(event.target)) return;\n\n      state.keys.add(key);");
      replace("    document.addEventListener(\"keyup\", (event) => {\n      state.keys.delete(normalizeKey(event));\n    });", "    document.addEventListener(\"keyup\", (event) => {\n      if (isEditableTarget(event.target)) return;\n      state.keys.delete(normalizeKey(event));\n    });");
    }
    if (!source.includes("function isEditableTarget")) {
      replace("    });\n  }\n\n  function setupNetworkUi() {", "    });\n\n    window.addEventListener(\"hss-auth-changed\", (event) => {\n      const user = event && event.detail ? event.detail.user : null;\n      if (user && user.username) setPlayerName(user.username, true);\n    });\n  }\n\n  function isEditableTarget(target) {\n    if (!target || target === document || target === document.body) return false;\n    if (target.isContentEditable) return true;\n    const tag = target.tagName ? target.tagName.toLowerCase() : \"\";\n    return tag === \"input\" || tag === \"textarea\" || tag === \"select\";\n  }\n\n  function setupNetworkUi() {");
    }
    replace("  function loadPlayerName() {\n    try {\n      return sanitizePlayerName(localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || \"Player\");\n    } catch (error) {\n      return \"Player\";\n    }\n  }", "  function loadPlayerName() {\n    const auth = window.hssAuth;\n    const user = auth && typeof auth.currentUser === \"function\" ? auth.currentUser() : null;\n    if (user && user.username) return sanitizePlayerName(user.username);\n    try {\n      return sanitizePlayerName(localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || \"Player\");\n    } catch (error) {\n      return \"Player\";\n    }\n  }");
    if (!source.includes("function resolvePlayerVertical")) patchMovement();
    patchWeapons();
    return source;

    function patchMovement() {
      replace("    const grounded = player.pos[1] <= EYE_HEIGHT + 0.02;", "    const grounded = isPlayerGrounded();");
      replace("    const grounded = player.pos[1] <= EYE_HEIGHT + 0.05;", "    const grounded = isPlayerGrounded();");
      replace("      if (distance2d(player.pos, pad.pos) < 3.4 && player.pos[1] <= EYE_HEIGHT + 0.4) {", "      if (distance2d(player.pos, pad.pos) < 3.4 && isPlayerNearGround(0.4)) {");
      replace("      if (distance2d(player.pos, pad.pos) < 3.2 && player.pos[1] <= EYE_HEIGHT + 0.4) {", "      if (distance2d(player.pos, pad.pos) < 3.2 && isPlayerNearGround(0.4)) {");
      replace("    player.pos[0] += player.vel[0] * dt;\n    player.pos[1] += player.vel[1] * dt;\n    player.pos[2] += player.vel[2] * dt;\n\n    if (player.pos[1] < EYE_HEIGHT) {\n      player.pos[1] = EYE_HEIGHT;\n      player.vel[1] = 0;\n    }", "    const previousFeetY = player.pos[1] - EYE_HEIGHT;\n    player.pos[0] += player.vel[0] * dt;\n    player.pos[1] += player.vel[1] * dt;\n    player.pos[2] += player.vel[2] * dt;\n\n    resolvePlayerVertical(previousFeetY);");
      replace("  function collidePlayer() {\n    for (const solid of solids) {\n      if (!solid.solid || solid.scale[1] > 4.5) continue;\n      const min = solidMin(solid);\n      const max = solidMax(solid);\n      if (player.pos[1] < min[1] || player.pos[1] - EYE_HEIGHT > max[1]) continue;\n      resolveCircleAabb(player.pos, PLAYER_RADIUS, min, max);\n    }\n  }", "  function collidePlayer() {\n    const feetY = player.pos[1] - EYE_HEIGHT;\n    for (const solid of solids) {\n      if (!solid.solid || solid.scale[1] > 4.5) continue;\n      const min = solidMin(solid);\n      const max = solidMax(solid);\n      if (feetY >= max[1] - 0.05 && circleOverlapsAabbXZ(player.pos, PLAYER_RADIUS, min, max)) continue;\n      if (player.pos[1] < min[1] || feetY > max[1]) continue;\n      resolveCircleAabb(player.pos, PLAYER_RADIUS, min, max);\n    }\n  }");
      replace("  function hasLineOfSight(from, to) {", `${surfaceHelpers()}\n\n  function hasLineOfSight(from, to) {`);
    }

    function patchWeapons() {
      replace("    reloadTotal: 0,\n    fireTimer: 0\n  }));", "    reloadTotal: 0,\n    fireTimer: 0,\n    bloom: 0\n  }));");
      replace("    ammo.forEach((slot, index) => {\n      slot.fireTimer = Math.max(0, slot.fireTimer - dt);", "    ammo.forEach((slot, index) => {\n      slot.fireTimer = Math.max(0, slot.fireTimer - dt);\n      slot.bloom = Math.max(0, (slot.bloom || 0) - BLOOM_DECAY * dt);");
      replace("          slot.reloadTotal = 0;", "          slot.reloadTotal = 0;\n          slot.bloom = 0;");
      replacePattern(/  function updatePickups\(dt\) \{[\s\S]*?\n  \}\n\n  function updateTransient\(dt\) \{/, `${pickupPatch()}\n\n  function updateTransient(dt) {`);
      replacePattern(/  function fire\(\) \{[\s\S]*?\n  \}\n\n  function reload\(\) \{/, `${weaponPatch()}\n\n  function reload() {`);
    }
  }

  function surfaceHelpers() {
    return `  function resolvePlayerVertical(previousFeetY) {
    const currentFeetY = player.pos[1] - EYE_HEIGHT;
    const supportY = findPlayerSupportY(previousFeetY, currentFeetY, PLAYER_GROUND_SNAP);
    if (supportY !== null && player.vel[1] <= PLAYER_JUMP_POWER * 0.4) {
      player.pos[1] = supportY + EYE_HEIGHT;
      if (player.vel[1] < 0) player.vel[1] = 0;
      return;
    }
    if (currentFeetY < 0) {
      player.pos[1] = EYE_HEIGHT;
      if (player.vel[1] < 0) player.vel[1] = 0;
    }
  }

  function isPlayerGrounded() {
    return isPlayerNearGround(0.08) && player.vel[1] <= 0.5;
  }

  function isPlayerNearGround(extraSnap = 0.08) {
    const feetY = player.pos[1] - EYE_HEIGHT;
    if (feetY <= extraSnap) return true;
    return findPlayerSupportY(feetY + extraSnap, feetY, extraSnap) !== null;
  }

  function findPlayerSupportY(previousFeetY, currentFeetY, snap) {
    let best = currentFeetY <= snap ? 0 : null;
    const minY = Math.min(previousFeetY, currentFeetY) - 0.03;
    const maxY = Math.max(previousFeetY, currentFeetY) + snap;
    for (const solid of solids) {
      if (!isStandableSurface(solid)) continue;
      const min = solidMin(solid);
      const max = solidMax(solid);
      if (max[1] < minY || max[1] > maxY) continue;
      if (!circleOverlapsAabbXZ(player.pos, PLAYER_RADIUS, min, max)) continue;
      if (best === null || max[1] > best) best = max[1];
    }
    return best;
  }

  function isStandableSurface(solid) {
    if (!solid) return false;
    const top = solid.pos[1] + solid.scale[1] / 2;
    if (top <= 0 || top > PLAYER_MAX_STANDABLE_TOP) return false;
    if (solid.solid && solid.scale[1] <= PLAYER_MAX_STANDABLE_TOP) return true;
    return /shrub|bush|bench|table|desk|chair|case|cover|bleacher|dumpster|planter|cart|counter|shelf|rack/i.test(solid.name || "");
  }

  function circleOverlapsAabbXZ(pos, radius, min, max) {
    const closestX = clamp(pos[0], min[0], max[0]);
    const closestZ = clamp(pos[2], min[2], max[2]);
    const dx = pos[0] - closestX;
    const dz = pos[2] - closestZ;
    return dx * dx + dz * dz <= radius * radius;
  }`;
  }

  function pickupPatch() {
    return `  function updatePickups(dt) {
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
          addFeed("Heal Pad", "+" + healAmount + " HP");
        }
        if (needsAmmo) {
          refillEquippedAmmo(PICKUP_AMMO_RATIO);
          addFeed("Ammo Pad", "Refilled");
        }
        pickup.cooldown = PICKUP_RESPAWN;
      }
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
      slot.bloom = 0;
    });
  }`;
  }

  function weaponPatch() {
    return `  function fire() {
    if (!state.running || state.paused || player.dead || state.roundCooldown > 0) return;
    if (state.activeSlot === "melee") return melee();
    if (state.activeSlot === "utility") return throwGrenade();
    const weapon = weapons[state.activeWeapon];
    const weaponColor = skins && typeof skins.getSkinColor === "function" ? skins.getSkinColor(weapon.name, weapon.color) : weapon.color;
    const slot = ammo[state.activeWeapon];
    if (slot.reloadRemaining > 0 || slot.fireTimer > 0) return;
    if (slot.magazine <= 0) return reload();
    slot.magazine -= 1;
    slot.fireTimer = 1 / weapon.fireRate;
    const handling = weaponHandling(weapon, slot);
    state.recoilKick = Math.min(0.16, state.recoilKick + weapon.recoil * handling.recoil);
    player.pitch = clamp(player.pitch + weapon.recoil * 0.42 * handling.recoil, -1.32, 1.18);
    player.yaw += (Math.random() * 2 - 1) * weapon.recoil * 0.18 * handling.recoil;
    slot.bloom = Math.min(weapon.spread * 5.2 + 0.035, (slot.bloom || 0) + weapon.spread * (weapon.pellets ? 0.18 : 0.64) * handling.bloom);
    const origin = add(getCameraPos(), [0, -0.05, 0]);
    const dir = markerShotDirection(getForward(), weapon, slot, handling);
    if (weapon.flame) return fireFlame({ ...weapon, color: weaponColor }, origin, dir);
    const shots = weapon.pellets || 1;
    for (let shot = 0; shot < shots; shot++) {
      const shotDir = shot === 0 ? dir : markerShotDirection(getForward(), weapon, slot, { ...handling, extraSpread: handling.extraSpread + weapon.spread * 0.9 });
      const trace = traceFirearmShot(origin, shotDir, weapon);
      if (shot < 3 || shots === 1) addTracer(origin, trace.hitPoint, weaponColor, 0.12);
      if (shot === 0) sendNetworkFire(origin, trace.hitPoint, weaponColor);
      if (trace.hitBot) {
        const falloff = damageFalloff(weapon, trace.distance);
        const multiplier = trace.headshot ? (weapon.headshotMultiplier || 1.7) : 1;
        damageBot(trace.hitBot, Math.max(1, Math.round(weapon.damage * multiplier * falloff)), trace.hitPoint, { name: "You", team: "blue", type: "player", headshot: trace.headshot, weapon: weapon.name });
      }
    }
  }

  function weaponHandling(weapon, slot) {
    const moving = Math.hypot(player.vel[0], player.vel[2]) > PLAYER_MOVE_SPEED * 0.38;
    const airborne = !isPlayerGrounded();
    const crouching = player.crouchAmount > 0.45;
    const aim = player.aiming ? ADS_SPREAD_MULTIPLIER : 1;
    return {
      aim,
      recoil: player.aiming ? 0.62 : 1,
      bloom: player.aiming ? 0.62 : 1,
      extraSpread: ((slot.bloom || 0) + (moving ? MOVING_SPREAD_PENALTY : 0) + (airborne ? AIRBORNE_SPREAD_PENALTY : 0)) * (crouching && !moving ? CROUCH_SPREAD_BONUS : 1)
    };
  }

  function markerShotDirection(forward, weapon, slot, handling) {
    const shot = spreadDirectionFromBasis(forward, Math.max(0, weapon.spread * handling.aim + handling.extraSpread));
    const drop = (weapon.markerDrop || MARKER_DROP_BASE * (1 + weapon.range / 220)) * (player.aiming ? 0.68 : 1);
    return normalize([shot[0], shot[1] - drop, shot[2]]);
  }

  function traceFirearmShot(origin, dir, weapon) {
    let bestT = weapon.range;
    let hitBot = null;
    let hitPoint = add(origin, scale(dir, weapon.range));
    let headshot = false;
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
        headshot = headT !== null;
        hitPoint = add(origin, scale(dir, t));
      }
    }
    return { hitBot, hitPoint, headshot, distance: bestT };
  }

  function fireFlame(weapon, origin, dir) {
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
      if (alignment < 0.76 || !hasLineOfSight(origin, target)) return;
      const heat = clamp((alignment - 0.76) / 0.24, 0, 1);
      const falloff = 1 - distance / weapon.range * 0.45;
      damageBot(bot, Math.max(2, Math.round(weapon.damage * (0.75 + heat) * falloff)), target, { name: "You", team: "blue", type: "player", weapon: weapon.name });
    });
  }`;
  }
})();

(async function () {
  "use strict";

  const GAME_URL = "src/game.js?v=14";

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
    if (source.includes("front-building-shadow") && source.includes("requestPointerLockSafe")) return source;

    const replace = (from, to) => {
      if (source.includes(from)) source = source.replace(from, to);
    };
    const replacePattern = (pattern, to) => {
      source = source.replace(pattern, to);
    };

    replace("const WORLD_LIMIT = 42 * MAP_SCALE;", "const WORLD_LIMIT = 64 * MAP_SCALE;");
    replace("const WORLD_LIMIT = 25 * MAP_SCALE;", "const WORLD_LIMIT = 64 * MAP_SCALE;");
    replace("const BOT_SIGHT_RANGE = 170;", "const BOT_SIGHT_RANGE = 210;");
    replace("const BOT_SIGHT_RANGE = 140;", "const BOT_SIGHT_RANGE = 210;");
    source = source.replaceAll("canvas.requestPointerLock();", "requestPointerLockSafe();");

    replacePattern(/mat4Perspective\(projection, degToRad\(fov\), aspect, 0\.04, [0-9]+\);/, "mat4Perspective(projection, degToRad(fov), aspect, 0.04, 720);");
    replacePattern(/gl\.uniform3fv\(uniforms\.lightDir, \[[^\]]+\]\);/, "gl.uniform3fv(uniforms.lightDir, [0.32, -0.88, 0.42]);");
    replace(
      `      0.42 * settings.brightness,
      0.66 * settings.brightness,
      0.88 * settings.brightness`,
      `      0.58 * settings.brightness,
      0.72 * settings.brightness,
      0.88 * settings.brightness`
    );

    replacePattern(
      /  const playerSpawn = mapPoint\([\s\S]*?  const botRoster = \[/,
      `  const playerSpawn = mapPoint(0, EYE_HEIGHT, 53);
  const blueSpawnPoints = [
    mapPoint(-34, EYE_HEIGHT, 53),
    mapPoint(-16, EYE_HEIGHT, 56),
    mapPoint(0, EYE_HEIGHT, 53),
    mapPoint(16, EYE_HEIGHT, 56),
    mapPoint(34, EYE_HEIGHT, 50)
  ];
  const redSpawnPoints = [
    mapPoint(-34, EYE_HEIGHT, -53),
    mapPoint(-16, EYE_HEIGHT, -56),
    mapPoint(0, EYE_HEIGHT, -53),
    mapPoint(16, EYE_HEIGHT, -56),
    mapPoint(34, EYE_HEIGHT, -50)
  ];

  const botRoster = [`
    );

    replacePattern(
      /  const pickups = \[[\s\S]*?  const jumpPads = \[/,
      `  const pickups = [
    { type: "heal", pos: mapPoint(-18, 0.55, 7), cooldown: 0 },
    { type: "heal", pos: mapPoint(18, 0.55, -7), cooldown: 0 },
    { type: "heal", pos: mapPoint(-48, 0.55, -22), cooldown: 0 },
    { type: "heal", pos: mapPoint(42, 0.55, 30), cooldown: 0 },
    { type: "ammo", pos: mapPoint(-6, 0.55, -12), cooldown: 0 },
    { type: "ammo", pos: mapPoint(6, 0.55, 12), cooldown: 0 },
    { type: "ammo", pos: mapPoint(-40, 0.55, 18), cooldown: 0 },
    { type: "ammo", pos: mapPoint(42, 0.55, -36), cooldown: 0 },
    { type: "hybrid", pos: mapPoint(0, 0.55, 0), cooldown: 0 }
  ];

  const jumpPads = [`
    );

    replacePattern(
      /  const jumpPads = \[[\s\S]*?  const speedPads = \[/,
      `  const jumpPads = [
    { pos: mapPoint(-19, 0.08, 0), cooldown: 0 },
    { pos: mapPoint(19, 0.08, 0), cooldown: 0 },
    { pos: mapPoint(-43, 0.08, -3), cooldown: 0 },
    { pos: mapPoint(44, 0.08, 24), cooldown: 0 }
  ];

  const speedPads = [`
    );

    replacePattern(
      /  const speedPads = \[[\s\S]*?  const teleporters = \[/,
      `  const speedPads = [
    { pos: mapPoint(-11, 0.08, 11.5), dir: [1, 0, 0], cooldown: 0 },
    { pos: mapPoint(11, 0.08, -11.5), dir: [-1, 0, 0], cooldown: 0 },
    { pos: mapPoint(-36, 0.08, 34), dir: [1, 0, 0], cooldown: 0 },
    { pos: mapPoint(36, 0.08, -34), dir: [-1, 0, 0], cooldown: 0 }
  ];

  const teleporters = [`
    );

    replacePattern(
      /  const teleporters = \[[\s\S]*?  solids\.push\(\.\.\.campusSolids\(\)\);/,
      `  const teleporters = [
    { pos: mapPoint(-52, 0.2, 28), target: mapPoint(38, EYE_HEIGHT, -37), cooldown: 0, color: [0.42, 0.86, 1.0] },
    { pos: mapPoint(38, 0.2, -37), target: mapPoint(-52, EYE_HEIGHT, 28), cooldown: 0, color: [1.0, 0.44, 0.72] }
  ];

  solids.push(...campusSolids(), ...realisticCampusSolids());`
    );

    replace("  decals.push(...campusDecals());", "  decals.push(...campusDecals(), ...realisticCampusDecals());");
    replace(
      `    renderSkyBand(now);
    solids.forEach(drawWorldBox);`,
      `    renderSkyBand(now);
    renderCampusGlow(now);
    renderCampusDetails(now);
    solids.forEach(drawWorldBox);`
    );

    replacePattern(
      /  function renderSkyBand\(now\) \{[\s\S]*?\n  \}\n\n  function renderPickups/,
      `${realisticRenderFunctions()}

  function renderPickups`
    );

    replace(
      `      const color = isHybrid ? [0.95, 0.78, 0.26] : isAmmo ? [0.28, 0.74, 1.0] : [0.3, 1.0, 0.48];`,
      `      const color = isHybrid ? [0.88, 0.66, 0.24] : isAmmo ? [0.18, 0.42, 0.58] : [0.22, 0.50, 0.28];`
    );

    if (!source.includes("function requestPointerLockSafe()")) {
      replace(
        `  function resetMatch() {`,
        `  function requestPointerLockSafe() {
    try {
      const request = canvas.requestPointerLock();
      if (request && typeof request.catch === "function") request.catch(() => {});
    } catch (error) {
      // Some embedded browsers reject pointer lock; controls still work after a normal browser click.
    }
  }

  function resetMatch() {`
      );
    }

    if (!source.includes("function realisticCampusSolids()")) {
      replace("  function solidMin(solid) {", `${realisticCampusFunctions()}\n\n  function solidMin(solid) {`);
    }

    return source;
  }

  function realisticRenderFunctions() {
    return `  function renderSkyBand(now) {
    const drift = now * 0.018;
    drawBox(mapPoint(0, 18, -64.0), [132 * MAP_SCALE, 34, 0.1 * MAP_SCALE], [0.54, 0.70, 0.87], 0);
    drawBox(mapPoint(-64.0, 18, 0), [0.1 * MAP_SCALE, 34, 132 * MAP_SCALE], [0.50, 0.67, 0.84], 0);
    drawBox(mapPoint(64.0, 18, 0), [0.1 * MAP_SCALE, 34, 132 * MAP_SCALE], [0.58, 0.70, 0.84], 0);
    drawBox(mapPoint(0, 18, 64.0), [132 * MAP_SCALE, 34, 0.1 * MAP_SCALE], [0.62, 0.72, 0.83], 0);
    drawBox(mapPoint(-45, 17.5, -63.7), [5.8 * MAP_SCALE, 5.8, 0.12 * MAP_SCALE], [1.0, 0.78, 0.42], now * 0.03);
    [-54, -38, -19, 8, 31, 53].forEach((x, index) => {
      const y = 20.5 + Math.sin(now * 0.08 + index) * 0.24;
      drawBox(mapPoint(x + Math.sin(drift + index) * 1.5, y, -63.5), [(8 + index % 3 * 3) * MAP_SCALE, 0.8, 0.1 * MAP_SCALE], [0.78, 0.84, 0.89], 0);
      drawBox(mapPoint(x + 4 + Math.sin(drift * 1.4 + index) * 1.2, y + 0.8, -63.4), [(5 + index % 2 * 2) * MAP_SCALE, 0.65, 0.1 * MAP_SCALE], [0.84, 0.88, 0.92], 0);
    });
    [-61, -47, -33, -18, -2, 14, 29, 43, 58].forEach((x, index) => {
      const height = 3.0 + (index % 4) * 0.75;
      drawBox(mapPoint(x, height * 0.5, -61.5), [3.6 * MAP_SCALE, height, 0.6 * MAP_SCALE], [0.08, 0.19 + index % 3 * 0.025, 0.11], 0);
      drawBox(mapPoint(x + 2.1, height * 0.42, 61.5), [3.2 * MAP_SCALE, height * 0.84, 0.6 * MAP_SCALE], [0.07, 0.18 + index % 4 * 0.02, 0.10], 0);
    });
  }

  function renderCampusGlow(now) {
    if (!settings.arenaGlow) return;
    const pulse = 0.86 + Math.sin(now * 1.1) * 0.06;
    [-22, -15, -8, 8, 15, 22].forEach((x, index) => {
      const lit = index % 3 !== Math.floor(now * 0.28) % 3;
      const warm = lit ? [0.96 * pulse, 0.72 * pulse, 0.44 * pulse] : [0.14, 0.16, 0.17];
      drawBox(mapPoint(x, 3.25, -25.78), [2.3 * MAP_SCALE, 0.62, 0.08 * MAP_SCALE], warm, 0);
      drawBox(mapPoint(x, 3.25, 25.78), [2.3 * MAP_SCALE, 0.62, 0.08 * MAP_SCALE], warm, 0);
    });
    [-47, -33, 33, 47].forEach((x, index) => {
      const z = index < 2 ? -34.2 : 34.2;
      drawBox(mapPoint(x, 4.9, z), [0.26 * MAP_SCALE, 3.9, 0.26 * MAP_SCALE], [0.11, 0.12, 0.12], 0);
      drawBox(mapPoint(x, 7.0, z), [1.4 * MAP_SCALE, 0.36, 1.4 * MAP_SCALE], [0.88 * pulse, 0.72 * pulse, 0.44], 0);
    });
  }

  function renderCampusDetails(now) {
    const flagWave = Math.sin(now * 1.9) * 0.18;
    drawBox(mapPoint(-6, 5.2, 31.7), [0.16 * MAP_SCALE, 7.4, 0.16 * MAP_SCALE], [0.38, 0.38, 0.36], 0);
    drawBox(mapPoint(-4.8, 7.4, 31.7), [2.2 * MAP_SCALE, 0.72, 0.08 * MAP_SCALE], [0.16, 0.32, 0.58], flagWave);
    drawBox(mapPoint(-3.6, 7.1, 31.7), [2.0 * MAP_SCALE, 0.44, 0.08 * MAP_SCALE], [0.82, 0.84, 0.78], -flagWave * 0.6);
    [
      [-54, 43], [-40, 41], [-24, 45], [24, 43], [40, 41], [54, 43],
      [-54, -43], [-38, -46], [-22, -42], [22, -44], [38, -46], [54, -42],
      [-58, -12], [-58, 10], [58, -12], [58, 12]
    ].forEach(([x, z], index) => {
      const sway = Math.sin(now * 0.55 + index) * 0.22;
      drawBox(mapPoint(x, 1.65, z), [0.42 * MAP_SCALE, 3.3, 0.42 * MAP_SCALE], [0.25, 0.15, 0.08], sway);
      drawBox(mapPoint(x + sway * 0.8, 4.2, z), [3.2 * MAP_SCALE, 2.2, 3.0 * MAP_SCALE], [0.08, 0.24 + index % 3 * 0.025, 0.10], sway * 0.5);
      drawBox(mapPoint(x - sway * 0.6, 5.15, z + 0.8), [2.4 * MAP_SCALE, 1.45, 2.3 * MAP_SCALE], [0.10, 0.30 + index % 4 * 0.02, 0.12], -sway * 0.4);
    });
  }`;
  }

  function realisticCampusFunctions() {
    return `  function realisticCampusSolids() {
    const items = [];
    const brick = [0.50, 0.41, 0.33];
    const darkBrick = [0.36, 0.28, 0.24];
    const concrete = [0.50, 0.49, 0.44];
    const glass = [0.20, 0.38, 0.48];
    const roof = [0.13, 0.14, 0.14];
    const metal = [0.28, 0.30, 0.30];
    const wood = [0.36, 0.27, 0.17];
    const add = (name, pos, scaleVector, color, solid, yaw = 0) => {
      const item = arenaBox(name, pos, scaleVector, color, solid);
      if (yaw) item.yaw = yaw;
      items.push(item);
      return item;
    };
    const addVehicle = (name, x, z, color, yaw = 0) => {
      add(name + "-body", [x, 0.78, z], [4.4, 1.15, 2.1], color, true, yaw);
      add(name + "-roof", [x - 0.35, 1.48, z], [2.35, 0.76, 1.72], scaleColor(color, 0.8), false, yaw);
      add(name + "-windshield", [x - 1.65, 1.43, z], [0.22, 0.58, 1.4], glass, false, yaw);
      add(name + "-rear-glass", [x + 1.55, 1.38, z], [0.18, 0.5, 1.34], glass, false, yaw);
      [-1.35, 1.35].forEach((dx, i) => [-1.05, 1.05].forEach((dz, j) => add(name + "-wheel-" + i + "-" + j, [x + dx, 0.33, z + dz], [0.64, 0.64, 0.3], [0.03, 0.03, 0.03], false, yaw)));
    };
    const addBus = (name, x, z, yaw = 0) => {
      add(name + "-body", [x, 1.1, z], [9.8, 2.2, 2.45], [0.96, 0.72, 0.18], true, yaw);
      add(name + "-roof", [x, 2.28, z], [9.4, 0.32, 2.18], [0.86, 0.62, 0.15], false, yaw);
      for (let i = 0; i < 5; i++) add(name + "-window-" + i, [x - 3.5 + i * 1.65, 2.02, z - 1.25], [1.05, 0.52, 0.12], glass, false, yaw);
      for (let i = 0; i < 4; i++) add(name + "-wheel-" + i, [x - 3.2 + i * 2.15, 0.42, z + 1.22], [0.72, 0.72, 0.26], [0.025, 0.025, 0.025], false, yaw);
    };
    const addFence = (name, x, z, sx, sz) => {
      add(name + "-rail-low", [x, 0.8, z], [sx, 0.12, sz], metal, false);
      add(name + "-rail-high", [x, 1.55, z], [sx, 0.12, sz], metal, false);
      const count = Math.max(2, Math.floor(Math.max(sx, sz) / 5));
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        add(name + "-post-" + i, [x + (sx > sz ? (t - 0.5) * sx : 0), 0.9, z + (sz >= sx ? (t - 0.5) * sz : 0)], [0.16, 1.8, 0.16], metal, true);
      }
    };

    add("realistic-campus-ground", [0, -0.2, 0], [132, 0.12, 132], [0.17, 0.29, 0.18], false);
    [["north-wing-west", -18, -39.5, 24, 4.1, 4.2], ["north-wing-east", 18, -39.5, 24, 4.1, 4.2], ["south-wing-west", -18, 39.5, 24, 4.1, 4.2], ["south-wing-east", 18, 39.5, 24, 4.1, 4.2], ["west-academic-north", -39.5, -18, 4.2, 4.1, 24], ["west-academic-south", -39.5, 18, 4.2, 4.1, 24], ["east-admin-north", 39.5, -18, 4.2, 4.1, 24], ["east-admin-south", 39.5, 18, 4.2, 4.1, 24]].forEach(([name, x, z, sx, sy, sz], index) => {
      add(name, [x, sy / 2, z], [sx, sy, sz], index % 2 ? darkBrick : brick, true);
      add(name + "-roof", [x, sy + 0.22, z], [sx + 1.2, 0.42, sz + 1.2], roof, false);
    });
    add("south-glass-entry", [0, 2.1, 39.2], [7.2, 3.6, 0.35], glass, false);
    add("north-glass-entry", [0, 2.1, -39.2], [7.2, 3.6, 0.35], glass, false);
    add("front-canopy", [0, 4.15, 33.0], [18.0, 0.38, 5.2], [0.18, 0.19, 0.18], false);
    add("rear-canopy", [0, 4.15, -33.0], [18.0, 0.38, 5.2], [0.18, 0.19, 0.18], false);
    [-7.4, -2.5, 2.5, 7.4].forEach((x, index) => {
      add("front-column-" + index, [x, 1.8, 33.0], [0.52, 3.6, 0.52], concrete, true);
      add("rear-column-" + index, [x, 1.8, -33.0], [0.52, 3.6, 0.52], concrete, true);
    });
    for (let i = 0; i < 12; i++) {
      const x = -23.0 + i * 4.2;
      add("front-window-" + i, [x, 3.0, 41.62], [2.0, 0.92, 0.12], glass, false);
      add("rear-window-" + i, [x, 3.0, -41.62], [2.0, 0.92, 0.12], glass, false);
      add("front-planter-" + i, [-54 + i * 9.8, 0.42, 31.5], [3.0, 0.84, 1.0], [0.20, 0.34, 0.22], true);
      add("rear-planter-" + i, [-54 + i * 9.8, 0.42, -31.5], [3.0, 0.84, 1.0], [0.20, 0.34, 0.22], true);
    }
    [[-16, 12], [-10, 8], [-15, -10], [14, -12], [10, -7], [15, 8], [-20, 3], [18, 15]].forEach(([x, z], index) => {
      add("real-caf-table-" + index, [x, 0.6, z], [3.4, 0.35, 1.2], index % 2 ? [0.19, 0.30, 0.31] : [0.43, 0.36, 0.25], true);
      add("real-caf-bench-a-" + index, [x, 0.42, z - 1.15], [3.6, 0.25, 0.38], [0.16, 0.16, 0.15], true);
      add("real-caf-bench-b-" + index, [x, 0.42, z + 1.15], [3.6, 0.25, 0.38], [0.16, 0.16, 0.15], true);
    });
    [[-30, 48, [0.14, 0.22, 0.30]], [-18, 48, [0.42, 0.42, 0.38]], [-6, 48, [0.28, 0.10, 0.09]], [8, 48, [0.08, 0.18, 0.30]], [22, 48, [0.50, 0.50, 0.46]], [36, 48, [0.20, 0.34, 0.22]], [-30, -50, [0.46, 0.44, 0.38]], [-16, -50, [0.16, 0.22, 0.28]], [0, -50, [0.36, 0.18, 0.14]], [16, -50, [0.40, 0.40, 0.36]], [32, -50, [0.08, 0.18, 0.30]]].forEach(([x, z, color], index) => addVehicle("car-" + index, x, z, color, index % 2 ? Math.PI * 0.02 : -Math.PI * 0.02));
    addBus("bus-east-a", 44, 26, Math.PI * 0.5);
    addBus("bus-east-b", 53, 18, Math.PI * 0.5);
    addBus("bus-north-service", 46, -49, 0);
    for (let row = 0; row < 5; row++) add("field-bleacher-row-" + row, [-21.6 - row * 0.72, 0.85 + row * 0.2, -3], [0.9, 0.22, 31], [0.52, 0.54, 0.53], true);
    add("goalpost-north-a", [-43, 2.0, -22], [0.18, 4.0, 0.18], [0.92, 0.88, 0.58], false);
    add("goalpost-north-cross", [-43, 3.9, -22], [7.5, 0.18, 0.18], [0.92, 0.88, 0.58], false);
    add("goalpost-south-a", [-43, 2.0, 16], [0.18, 4.0, 0.18], [0.92, 0.88, 0.58], false);
    add("goalpost-south-cross", [-43, 3.9, 16], [7.5, 0.18, 0.18], [0.92, 0.88, 0.58], false);
    addFence("track-fence-n", -43, -29.5, 44, 0.14);
    addFence("track-fence-s", -43, 23.5, 44, 0.14);
    addFence("track-fence-w", -66, -3, 0.14, 52);
    addFence("track-fence-e", -20, -3, 0.14, 52);
    [[51, -33], [55, -34.5], [48, -36], [-55, 35], [-50, 37], [-46, 34]].forEach(([x, z], index) => {
      add("dumpster-" + index, [x, 0.82, z], [3.2, 1.64, 2.0], [0.10, 0.24, 0.18], true, index % 2 ? 0.18 : -0.12);
      add("dumpster-lid-" + index, [x, 1.76, z], [3.3, 0.18, 2.05], [0.06, 0.12, 0.10], false, index % 2 ? 0.18 : -0.12);
    });
    return items;
  }

  function realisticCampusDecals() {
    const items = [];
    const add = (name, pos, scaleVector, color, yaw = 0) => {
      const item = arenaBox(name, pos, scaleVector, color, false);
      if (yaw) item.yaw = yaw;
      items.push(item);
      return item;
    };
    [["south-parking-asphalt", [0, -0.035, 47.5], [78.0, 0.05, 24.0], [0.08, 0.09, 0.09]], ["north-service-asphalt", [0, -0.034, -49.5], [76.0, 0.05, 22.0], [0.075, 0.08, 0.08]], ["front-walk", [0, -0.028, 33.5], [72.0, 0.05, 5.6], [0.50, 0.49, 0.44]], ["back-walk", [0, -0.027, -33.5], [72.0, 0.05, 5.6], [0.48, 0.47, 0.42]], ["main-entry-walk", [0, -0.026, 0], [6.0, 0.05, 70.0], [0.52, 0.51, 0.46]], ["football-field", [-43, -0.032, -3], [32, 0.05, 42], [0.12, 0.34, 0.17]], ["running-track-n", [-43, -0.031, -26], [38, 0.05, 3.0], [0.45, 0.16, 0.12]], ["running-track-s", [-43, -0.031, 20], [38, 0.05, 3.0], [0.45, 0.16, 0.12]], ["running-track-w", [-63, -0.03, -3], [3.0, 0.05, 46], [0.45, 0.16, 0.12]], ["running-track-e", [-23, -0.03, -3], [3.0, 0.05, 46], [0.45, 0.16, 0.12]], ["bus-loop", [43, -0.03, 24], [28, 0.05, 14], [0.09, 0.10, 0.10]], ["front-building-shadow", [0, 0.024, 36.2], [78.0, 0.05, 5.0], [0.13, 0.13, 0.11]], ["rear-building-shadow", [0, 0.024, -36.2], [78.0, 0.05, 5.0], [0.12, 0.12, 0.10]], ["gym-entry-shadow", [0, 0.025, 28.8], [42.0, 0.05, 3.0], [0.11, 0.11, 0.10]], ["bus-loop-shadow", [44, 0.025, 22], [31.0, 0.05, 10.0], [0.055, 0.058, 0.055]]].forEach(([name, pos, scaleVector, color]) => add(name, pos, scaleVector, color));
    for (let i = 0; i < 11; i++) {
      const x = -35 + i * 7;
      add("south-parking-line-" + i, [x, 0.026, 48], [0.16, 0.05, 18.0], [0.88, 0.82, 0.58]);
      add("north-parking-line-" + i, [x, 0.026, -50], [0.16, 0.05, 16.0], [0.84, 0.80, 0.58]);
    }
    for (let i = 0; i < 7; i++) {
      add("front-crosswalk-" + i, [-6 + i * 2, 0.028, 42.2], [0.9, 0.05, 5.0], [0.86, 0.86, 0.80]);
      add("rear-crosswalk-" + i, [-6 + i * 2, 0.028, -42.2], [0.9, 0.05, 5.0], [0.86, 0.86, 0.80]);
    }
    [-57, -49, -41, -33, -25, -17, -9].forEach((x, index) => add("field-yard-line-" + index, [x, 0.033, -3], [0.12, 0.05, 36], [0.78, 0.84, 0.76]));
    for (let i = 0; i < 8; i++) {
      const z = -22 + i * 6;
      add("track-lane-left-" + i, [-63, 0.034, z], [0.16, 0.05, 2.8], [0.72, 0.58, 0.44]);
      add("track-lane-right-" + i, [-23, 0.034, z], [0.16, 0.05, 2.8], [0.72, 0.58, 0.44]);
    }
    for (let i = 0; i < 10; i++) add("bus-loop-lane-" + i, [34 + i * 2.2, 0.036, 24], [1.2, 0.05, 0.16], [0.90, 0.74, 0.30]);
    [-40, -24, -8, 8, 24, 40].forEach((x, index) => {
      add("south-lane-dash-" + index, [x, 0.037, 40.7], [5.6, 0.05, 0.14], [0.82, 0.76, 0.52]);
      add("north-lane-dash-" + index, [x, 0.037, -43.0], [5.6, 0.05, 0.14], [0.82, 0.76, 0.52]);
    });
    return items;
  }`;
  }
})();

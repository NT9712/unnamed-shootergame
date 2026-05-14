# High School Simulator: American Edition

A standalone WebGL campus-arena prototype with pointer-lock FPS controls, blue-vs-red bot teams, round scoring, a CS2-style buy phase, health/ammo/stamina HUD, minimap, hit markers, reloads, dash movement, heal/ammo pads, and arena AI. The map now uses a larger grounded campus layout with daylight, fog, procedural surface noise, academic wings, parking lots, buses, cars, sidewalks, field props, bleachers, fences, trees, glass entries, classrooms, lockers, cafeteria tables, and library cover. The theme is a fictional after-school foam-marker competition, not a realistic school violence simulator.

## Run Locally

Open `index.html` in a WebGL-capable browser.

You can also serve it locally:

```sh
node tools/server.js
```

Then open `http://localhost:5173`.

## Controls

- Mouse: look
- Right click: aim down sights
- Left click: fire
- WASD: move
- Shift: sprint
- Space: jump
- Control: crouch / slide while moving
- R: reload
- 1, 2, 3, 4: rifle, pistol, melee, utility
- Q: dash
- F: melee
- G: grenade
- Esc: unlock/pause

No package install is required.

## Deploy

The project is static and deploys directly on Vercel from `main`.

- Framework preset: Other
- Install command: empty
- Build command: empty
- Output directory: `.`
- Production branch: `main`

The repository includes `vercel.json` and `.vercelignore` so Vercel serves the root static files without a build step.

## Menu And Settings

The main menu includes Home, Buy Menu, Locker, Online, and Settings views. Settings are saved in the browser and are client-side only: keybinds, toggle sprint, toggle sneak, toggle aim, controls, video, HUD, crosshair, name tags, and visual effects. Match rules and gameplay stats are fixed in code.

The buy menu is split into one rifle, one pistol, one melee item, and one utility item. Cash starts at $800, is earned from KOs and round payouts, and is spent during the round buy phase on temporary gear. Items bought during the same life can be re-equipped without paying again. Paid weapons are dropped on death, the death buy menu opens during respawn, and ammo is reset on respawn.

The Locker is also client-side and persists in `localStorage`. It tracks round KOs, deaths, KDR, headshot percentage, backstabs, lifetime stats, and Campus Credits. Credits are earned after each round from the round data and can be spent on Freshman, Varsity, and Final Bell skin cases. Skins can be equipped per weapon and affect the rendered weapon/tracer color.

The payment entry is a local prototype entry only. It records a reference and amount in the browser and grants local test credits. It is not connected to Stripe, Vercel functions, or any real payment processor.

The Online view uses WebRTC rooms. On Vercel, `/api/rooms` acts as a lightweight signaling endpoint so Quick Play can find an open room, publish the host offer, and return the joiner's reply without manual copy/paste in the common case.

For more reliable room codes, deploy the persistent signaling service in `server/` to Railway, Render, Fly.io, or a VPS with `node server/index.js`, then open the frontend with `?signal=https://your-room-server.example.com`. The client stores that signaling URL locally and falls back to `/api/rooms` when no server is configured.

The room server uses a limited pool of 16 active room codes. Each room supports 2 players, expires after 8 minutes of inactivity, and is removed from the pool when expired. The Online panel shows remaining room codes as `CODES LEFT`.

Manual code exchange still works as a fallback:

1. One player clicks `Create Room` and sends `Your Room Code` or the room ID to a friend.
2. The friend pastes the room ID/code into `Join Room ID Or Code` and clicks `Join Room`.
3. If the API is unavailable, the friend sends back their new `Your Room Code`.
4. The first player pastes that reply into `Join Room ID Or Code` and clicks `Join Room`.

After connection, the game syncs display name, position, aim direction, active item, shot tracers, remote avatar, and remote name tag. The room API is signaling/lobby state only; game state still goes directly peer-to-peer. Vercel serverless memory is okay for a rough prototype lobby, but reliable public matchmaking should use the persistent `server/` room process or move the room store to Redis/Upstash and add a TURN relay for networks that block direct WebRTC.

## Current Mechanics

Movement and combat now include reworked sprint stamina, crouching/sneaking, slides, aiming down sights, dash cooldown, utility cooldown, melee cooldown, damage dropoff, Eagle Marker and AWP Marker headshots, a Foam Flamethrower cone weapon, foam-knife backstabs, jump pads, speed lanes, teleport gates, heal/ammo pads, armor regeneration, spawn protection, kill streak callouts, and smarter team-based bot targeting. The map is now a much larger realistic campus arena with a central gym/main building, academic wings, front and rear entrances, asphalt parking, bus loop, service yard, football field, running track, bleachers, fences, dumpsters, bike racks, windows, rooflines, shrubs, trees, lamps, classroom props, cafeteria tables, a trophy case, court markings, floating name tags, and uniformed team characters.

Ten strong next mechanics to consider: wall-running, mantle/climb, zip-lines, weapon attachments, objective capture zones, class abilities, deployable shields, radar pings, match economy, and round-end MVP cards.

## Notes

Deployment Protection on Vercel must be disabled if this should be publicly playable without a Vercel login or share link.

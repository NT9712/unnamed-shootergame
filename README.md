# High School Simulator: American Edition

A standalone WebGL campus-arena prototype with pointer-lock FPS controls, blue-vs-red bot teams, round scoring, a CS2-style buy phase, health/ammo/stamina HUD, minimap, hit markers, reloads, dash movement, heal/ammo pads, and arena AI. The theme is a fictional after-school foam-marker competition, not a realistic school violence simulator.

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

The main menu includes Home, Buy Menu, Online, and Settings views. Settings are saved in the browser and are client-side only: keybinds, toggle sprint, toggle sneak, toggle aim, controls, video, HUD, crosshair, name tags, and visual effects. Match rules and gameplay stats are fixed in code.

The buy menu is split into one rifle, one pistol, one melee item, and one utility item. Cash starts at $800, is earned from KOs and round payouts, and is spent during the round buy phase on temporary gear. Paid weapons are dropped on death, and ammo is reset on respawn.

The Online view uses a client-side peer link. It is WebRTC under the hood, but the UI is a simple code exchange:

1. One player clicks `Create Code` and sends `Your Code` to a friend.
2. The friend pastes it into `Friend Code` and clicks `Use Code`.
3. The friend sends back their new `Your Code`.
4. The first player pastes that reply into `Friend Code` and clicks `Use Code`.

After connection, the game syncs display name, position, aim direction, active item, shot tracers, remote avatar, and remote name tag. No multiplayer server is required. NAT/firewall behavior can still block direct WebRTC links for some networks.

## Current Mechanics

Movement and combat now include reworked sprint stamina, crouching/sneaking, slides, aiming down sights, dash cooldown, utility cooldown, melee cooldown, damage dropoff, Eagle Marker and AWP Marker headshots, a Foam Flamethrower cone weapon, foam-knife backstabs, jump pads, speed lanes, teleport gates, heal/ammo pads, armor regeneration, spawn protection, kill streak callouts, and smarter team-based bot targeting. The map is now an open campus with sky, outdoor paths, courtyard cover, planters, and the original arena reworked as the main building with classrooms, lockers, cafeteria tables, a trophy case, bus cover, court markings, posters, banners, animated lights, floating name tags, and uniformed team characters.

Ten strong next mechanics to consider: wall-running, mantle/climb, zip-lines, weapon attachments, objective capture zones, class abilities, deployable shields, radar pings, match economy, and round-end MVP cards.

## Notes

Deployment Protection on Vercel must be disabled if this should be publicly playable without a Vercel login or share link.

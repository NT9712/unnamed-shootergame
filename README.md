# High School Simulator: American Edition

A standalone WebGL campus-arena prototype with pointer-lock FPS controls, blue-vs-red bot teams, round scoring, a CS2-style buy phase, health/ammo/stamina HUD, minimap, hit markers, reloads, dash movement, pickups, and simple arena AI. The theme is a fictional after-school foam-marker competition, not a realistic school violence simulator.

## Run

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

## Menu And Settings

The main menu includes Home, Buy Menu, Online, and Settings views. Settings are saved in the browser and are client-side only: keybinds, toggle sprint, toggle sneak, toggle aim, controls, video, HUD, crosshair, name tags, and visual effects. Match rules and gameplay stats are fixed in code.

The buy menu is split into one rifle, one pistol, one melee item, and one utility item. Cash starts at $800, is earned from KOs and round payouts, and is spent during the round buy phase on temporary gear for that round.

The Online view includes a static-host-friendly WebRTC data-channel link with manual offer/answer signaling, a saved display name, peer status, and remote player position/name-tag rendering. No server or install step is required for the peer link itself.

## Current Mechanics

Movement and combat now include reworked sprint stamina, crouching/sneaking, slides, aiming down sights, dash cooldown, utility cooldown, melee cooldown, damage dropoff, Eagle Marker headshot multipliers, foam-knife backstabs, jump pads, speed lanes, teleport gates, armor regeneration, spawn protection, kill streak callouts, and team-based bot targeting. The map has been expanded into a larger gym-campus arena with bleachers, lockers, cafeteria tables, a trophy case, bus cover, court markings, posters, banners, animated lights, floating name tags, and uniformed team characters.

Ten strong next mechanics to consider: wall-running, mantle/climb, zip-lines, weapon attachments, objective capture zones, class abilities, deployable shields, radar pings, match economy, and round-end MVP cards.

## Future Vercel Hosting

This project is static, so Vercel can host it without a build step.

Recommended setup:

- Framework preset: Other
- Build command: leave empty
- Output directory: leave empty or use `.`
- Install command: leave empty

The included `vercel.json` keeps clean URLs enabled. Once assets are hashed by a build step, caching rules can be tightened.

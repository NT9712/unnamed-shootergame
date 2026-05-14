# Room Server

This folder is a persistent room-signaling service for Online mode. Use it when Vercel serverless memory is too unreliable for room codes.

Deploy the repo root to Railway, Render, Fly.io, or a VPS and use:

```sh
node server/index.js
```

The service exposes:

- `GET /health`
- `GET /api/rooms?stats=1`
- `GET /api/rooms?quick=1`
- `GET /api/rooms?room=ROOM01`
- `POST /api/rooms`

After deployment, open the Vercel frontend with the signaling server URL:

```txt
https://your-vercel-app.vercel.app/?signal=https://your-room-server.example.com
```

The client stores that URL in `localStorage` and keeps using it. Open with `?signal=/api/rooms` to switch back to the Vercel API.

The frontend also supports fixed room pages such as `/room1.html`, which maps to `ROOM01`, through `/room16.html`, which maps to `ROOM16`.

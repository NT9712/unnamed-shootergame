# Google Compute Engine VPS Hosting

Use this when Vercel serverless memory is too temporary for room codes. The frontend can stay on Vercel, while a Google Compute Engine VM runs the persistent room server.

## Target Layout

- Frontend: `https://untitled-shootergame.vercel.app`
- Room API: `https://rooms.example.com/api/rooms`
- VM path: `/opt/high-school-simulator-american-edition`
- Local room server: `127.0.0.1:8787`
- Public proxy: Nginx on ports `80` and `443`

## 1. Create The VM

Create a small Ubuntu LTS VM on Google Compute Engine. A basic e2-micro or e2-small is enough for the signaling server prototype.

Recommended firewall:

- Allow TCP `80` and `443` to the VM.
- Do not expose TCP `8787` publicly when Nginx is proxying it.
- If you add a TURN relay in a later networking pass, allow TCP/UDP `3478`, TCP `5349`, and a restricted UDP relay range such as `49160-49200`.

## 2. Install Runtime Packages

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

## 3. Deploy The App

```sh
sudo useradd --system --home /opt/high-school-simulator-american-edition --shell /usr/sbin/nologin hssae || true
sudo mkdir -p /opt/high-school-simulator-american-edition
sudo chown -R "$USER":hssae /opt/high-school-simulator-american-edition
git clone https://github.com/NT9712/unnamed-shootergame.git /opt/high-school-simulator-american-edition
```

If the directory already exists:

```sh
cd /opt/high-school-simulator-american-edition
git pull --ff-only
```

## 4. Configure The Room Server

```sh
sudo mkdir -p /etc/high-school-simulator-american-edition
sudo cp /opt/high-school-simulator-american-edition/server/.env.example /etc/high-school-simulator-american-edition/rooms.env
sudo chown root:hssae /etc/high-school-simulator-american-edition/rooms.env
sudo chmod 640 /etc/high-school-simulator-american-edition/rooms.env
sudo cp /opt/high-school-simulator-american-edition/server/systemd/high-school-simulator-rooms.service /etc/systemd/system/high-school-simulator-rooms.service
sudo systemctl daemon-reload
sudo systemctl enable --now high-school-simulator-rooms
curl http://127.0.0.1:8787/health
```

Check logs:

```sh
journalctl -u high-school-simulator-rooms -f
```

## 5. Configure Nginx

Edit `server_name` in the Nginx template before enabling it.

```sh
sudo cp /opt/high-school-simulator-american-edition/server/nginx/high-school-simulator-rooms.conf /etc/nginx/sites-available/high-school-simulator-rooms.conf
sudo nano /etc/nginx/sites-available/high-school-simulator-rooms.conf
sudo ln -sf /etc/nginx/sites-available/high-school-simulator-rooms.conf /etc/nginx/sites-enabled/high-school-simulator-rooms.conf
sudo nginx -t
sudo systemctl reload nginx
curl http://rooms.example.com/health
```

## 6. Add HTTPS

Point the DNS `A` record for `rooms.example.com` to the VM external IP first, then run:

```sh
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rooms.example.com
curl https://rooms.example.com/health
```

## 7. Point The Vercel Frontend At The VPS

Open the game with:

```txt
https://untitled-shootergame.vercel.app/?signal=https://rooms.example.com
```

The browser stores that signaling server URL in `localStorage`. To switch back to Vercel serverless signaling:

```txt
https://untitled-shootergame.vercel.app/?signal=/api/rooms
```

## 8. WebRTC Network Note

The room server only exchanges WebRTC offers and answers. Game state still goes peer-to-peer between browsers after signaling succeeds.

Some school, mobile, and strict NAT networks still need a TURN relay for the peer connection itself. Treat TURN as the next networking pass after the VPS signaling server is live. A typical coturn install starts with:

```sh
sudo apt-get install -y coturn
sudo nano /etc/turnserver.conf
```

Minimal static-secret style config:

```txt
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
realm=rooms.example.com
user=demo:replace-this-password
no-multicast-peers
no-cli
min-port=49160
max-port=49200
```

Enable it:

```sh
sudo sed -i 's/^#TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn
sudo systemctl enable --now coturn
```

For production, replace static TURN credentials with short-lived generated credentials before sharing the app broadly, then wire those credentials into the client ICE server config.

## Health Checks

```sh
curl https://rooms.example.com/health
curl 'https://rooms.example.com/api/rooms?stats=1'
```

Expected stats response includes `activeRooms`, `openRooms`, `maxRooms`, `codesLeft`, and `ttlSeconds`.

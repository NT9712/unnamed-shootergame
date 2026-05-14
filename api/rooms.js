"use strict";

const ROOM_TTL_MS = 8 * 60 * 1000;
const CLAIM_TTL_MS = 35 * 1000;
const MAX_CODE_LENGTH = 9000;
const MAX_ROOM_PLAYERS = 2;
const ROOM_CODES = Array.from({ length: 16 }, (_, index) => `ROOM${String(index + 1).padStart(2, "0")}`);
const MAX_ACTIVE_ROOMS = ROOM_CODES.length;

const store = globalThis.__hssaeRooms || new Map();
globalThis.__hssaeRooms = store;

module.exports = async function handler(req, res) {
  setHeaders(res);
  cleanupRooms();

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === "GET") {
      handleGet(req, res);
      return;
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      handlePost(body, res);
      return;
    }

    sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error && error.message ? error.message : "Room request failed" });
  }
};

function handleGet(req, res) {
  const url = new URL(req.url, "https://hss.local");
  if (url.searchParams.get("stats")) {
    sendJson(res, 200, { ok: true, stats: getStats() });
    return;
  }

  if (url.searchParams.get("quick")) {
    const room = Array.from(store.values()).find(isJoinable);
    if (!room) {
      sendJson(res, 404, { ok: false, error: "No open quick rooms", stats: getStats() });
      return;
    }
    touch(room);
    room.claimedAt = Date.now();
    room.claimToken = createJoinToken();
    sendJson(res, 200, publicRoom(room, { includeCode: true, includeClaim: true }));
    return;
  }

  const roomId = sanitizeRoomId(url.searchParams.get("room"));
  if (!roomId || !store.has(roomId)) {
    sendJson(res, 404, { ok: false, error: "Room not found", stats: getStats() });
    return;
  }

  const entry = store.get(roomId);
  if (isExpired(entry)) {
    store.delete(roomId);
    sendJson(res, 404, { ok: false, error: "Room expired", stats: getStats() });
    return;
  }

  touch(entry);
  if (!entry.answer && entry.offer) {
    entry.claimedAt = Date.now();
    entry.claimToken = createJoinToken();
  }
  sendJson(res, 200, publicRoom(entry, { includeCode: true, includeClaim: true }));
}

function handlePost(body, res) {
  const action = String(body.action || "").toLowerCase();
  if (action !== "offer" && action !== "answer") throw new Error("Invalid room action");

  const fallbackMode = body.room && body.room.mode === "quick" ? "quick" : "custom";
  const room = normalizeRoom(body.room, fallbackMode, action);
  const code = sanitizeCode(body.code);
  const now = Date.now();
  const previous = store.get(room.id);
  const entry = previous || { room, offer: "", answer: "", createdAt: now, updatedAt: now };

  entry.room = { ...entry.room, ...room };
  entry.updatedAt = now;
  if (action === "offer") {
    if (!previous && store.size >= MAX_ACTIVE_ROOMS) throw new Error("Server room code limit reached");
    entry.offer = code;
    entry.answer = "";
    entry.createdAt = now;
    entry.claimedAt = 0;
    entry.claimToken = "";
  } else {
    if (!entry.offer) throw new Error("Room has no offer yet");
    if (entry.answer) throw new Error("Room is full");
    if (entry.claimToken && body.claimToken !== entry.claimToken && Date.now() - entry.claimedAt < CLAIM_TTL_MS) throw new Error("Room is reserved by another joiner");
    entry.answer = code;
    entry.claimedAt = 0;
    entry.claimToken = "";
  }

  store.set(room.id, entry);
  sendJson(res, 200, publicRoom(entry, { includeCode: true, includeClaim: false }));
}

function publicRoom(entry, options = {}) {
  const players = 1 + (entry.answer ? 1 : 0);
  return {
    ok: true,
    room: entry.room,
    offer: options.includeCode ? entry.offer : undefined,
    answer: options.includeCode ? entry.answer : undefined,
    joinToken: options.includeClaim ? entry.claimToken : undefined,
    players,
    maxPlayers: MAX_ROOM_PLAYERS,
    full: players >= MAX_ROOM_PLAYERS,
    updatedAt: entry.updatedAt,
    expiresAt: entry.updatedAt + ROOM_TTL_MS,
    stats: getStats()
  };
}

function normalizeRoom(room, fallbackMode, action) {
  const raw = room && typeof room === "object" ? room : {};
  const preferred = sanitizeRoomId(raw.id);
  return { id: action === "offer" ? chooseRoomCode(preferred) : preferred, name: sanitizeName(raw.name), mode: raw.mode === "quick" || fallbackMode === "quick" ? "quick" : "custom" };
}

function sanitizeRoomId(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function sanitizeName(value) {
  return String(value || "After-School Room").replace(/[^\w .:-]/g, "").trim().slice(0, 24) || "After-School Room";
}

function sanitizeCode(value) {
  const code = String(value || "").trim();
  if (!code || code.length > MAX_CODE_LENGTH) throw new Error("Invalid room code");
  if (!code.startsWith("HSSR.") && !code.startsWith("HSS1.") && !code.startsWith("{")) throw new Error("Unsupported room code");
  return code;
}

function chooseRoomCode(preferred) {
  if (preferred && ROOM_CODES.includes(preferred)) {
    const existing = store.get(preferred);
    if (!existing || isExpired(existing) || !existing.answer) return preferred;
  }
  for (const code of ROOM_CODES) {
    const existing = store.get(code);
    if (!existing || isExpired(existing)) return code;
  }
  throw new Error("Server room code limit reached");
}

function createJoinToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function cleanupRooms() {
  for (const [id, entry] of store) if (isExpired(entry)) store.delete(id);
}

function isExpired(entry) {
  return Date.now() - entry.updatedAt > ROOM_TTL_MS;
}

function isJoinable(entry) {
  if (isExpired(entry)) return false;
  if (entry.room.mode !== "quick" || !entry.offer || entry.answer) return false;
  return !entry.claimedAt || Date.now() - entry.claimedAt > CLAIM_TTL_MS;
}

function touch(entry) {
  entry.updatedAt = Date.now();
}

function getStats() {
  const rooms = Array.from(store.values()).filter((entry) => !isExpired(entry));
  const openRooms = rooms.filter(isJoinable).length;
  return { activeRooms: rooms.length, openRooms, fullRooms: rooms.filter((entry) => entry.answer).length, maxRooms: MAX_ACTIVE_ROOMS, codesLeft: Math.max(0, MAX_ACTIVE_ROOMS - rooms.length), maxPlayersPerRoom: MAX_ROOM_PLAYERS, ttlSeconds: Math.round(ROOM_TTL_MS / 1000) };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 16000) reject(new Error("Request too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function setHeaders(res) {
  res.setHeader("cache-control", "no-store");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  res.setHeader("content-type", "application/json; charset=utf-8");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

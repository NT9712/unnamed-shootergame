(function () {
  "use strict";

  const CODE_PREFIX = "HSS1.";
  const ROOM_CODE_PREFIX = "HSSR.";
  const ROOM_API = "/api/rooms";
  const API_POLL_MS = 1400;
  const DEFAULT_ICE_SERVERS = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302"
      ]
    }
  ];

  installRtcConfigShim();
  boot();

  async function boot() {
    if (await hasBuiltInPeerLink()) return;
    installLegacyPeerLinkAdapter();
  }

  async function hasBuiltInPeerLink() {
    if (window.location.protocol === "file:") return true;
    const gameScript = Array.from(document.scripts).find((script) => /src\/game\.js/.test(script.getAttribute("src") || script.src || ""));
    if (!gameScript || !gameScript.src) return false;

    try {
      const response = await fetch(gameScript.src, { cache: "no-store" });
      if (!response.ok) return false;
      const source = await response.text();
      return source.includes("function createConnectionCode") && source.includes(CODE_PREFIX);
    } catch (error) {
      return true;
    }
  }

  function installLegacyPeerLinkAdapter() {
    injectRoomStyles();

    const ui = {
      localSignal: document.getElementById("localSignal"),
      remoteSignal: document.getElementById("remoteSignal"),
      quickPlayButton: document.getElementById("quickPlayButton"),
      hostOfferButton: document.getElementById("hostOfferButton"),
      joinOfferButton: document.getElementById("joinOfferButton"),
      acceptAnswerButton: document.getElementById("acceptAnswerButton"),
      roomNameInput: document.getElementById("roomNameInput"),
      roomIdValue: document.getElementById("roomIdValue"),
      roomHint: document.getElementById("roomHint"),
      networkStatus: document.getElementById("networkStatus"),
      homeNetworkStatus: document.getElementById("homeNetworkStatus"),
      killFeed: document.getElementById("killFeed")
    };

    if (!ui.localSignal || !ui.remoteSignal || !ui.hostOfferButton || !ui.joinOfferButton || !ui.acceptAnswerButton) return;

    let compactTimer = 0;
    let pollTimer = 0;
    let activeRoom = null;
    let lastPublishedCode = "";
    let lastAppliedAnswer = "";
    let preserveNextHostRoom = false;

    if (ui.quickPlayButton) {
      ui.quickPlayButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (ui.remoteSignal.value.trim()) {
          ui.joinOfferButton.click();
        } else {
          const match = await findQuickRoom();
          if (match && match.offer) {
            activeRoom = normalizeRoom(match.room, "quick");
            ui.remoteSignal.value = match.offer;
            addPeerNote(`Joining ${activeRoom.id}`);
            ui.joinOfferButton.click();
          } else {
            activeRoom = createRoom("quick");
            preserveNextHostRoom = true;
            ui.hostOfferButton.click();
          }
        }
        updateRoomUi();
      }, true);
    }

    ui.hostOfferButton.addEventListener("click", () => {
      if (preserveNextHostRoom && activeRoom) {
        preserveNextHostRoom = false;
      } else {
        activeRoom = createRoom("custom");
      }
      lastPublishedCode = "";
      lastAppliedAnswer = "";
      updateRoomUi();
      startCompactor();
    }, true);

    ui.joinOfferButton.addEventListener("click", async (event) => {
      const roomId = readRoomId(ui.remoteSignal.value);
      if (roomId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await joinRoomId(roomId);
        return;
      }

      const signal = readFriendCode(ui.remoteSignal.value);
      if (!signal) return;

      if (signal.room) activeRoom = normalizeRoom(signal.room, signal.type === "offer" ? "quick" : "custom");
      ui.remoteSignal.value = JSON.stringify({ type: signal.type, sdp: signal.sdp }, null, 2);
      if (signal.type === "offer") startCompactor();
      updateStatusLabels();
      updateRoomUi();
    }, true);

    ui.acceptAnswerButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      await copyCode(ui.localSignal.value);
      syncButtons();
    }, true);

    window.setInterval(syncButtons, 200);
    window.setInterval(updateStatusLabels, 200);

    function startCompactor() {
      window.clearInterval(compactTimer);
      const expiresAt = performance.now() + 4000;
      compactTimer = window.setInterval(() => {
        compactLocalCode();
        publishCurrentCode();
        syncButtons();
        updateStatusLabels();
        if (performance.now() > expiresAt) window.clearInterval(compactTimer);
      }, 100);
    }

    function compactLocalCode() {
      const signal = readFriendCode(ui.localSignal.value);
      if (!signal || ui.localSignal.value.trim().startsWith(ROOM_CODE_PREFIX)) return;
      if (signal.room) activeRoom = signal.room;
      if (!activeRoom) activeRoom = createRoom("custom");
      ui.localSignal.value = writeRoomCode(signal, activeRoom);
      updateRoomUi();
    }

    function syncButtons() {
      const localReady = Boolean(ui.localSignal.value.trim());
      const status = (ui.networkStatus && ui.networkStatus.textContent || "").trim().toUpperCase();
      const waitingForReply = status === "WAITING ANSWER" || status === "SEND CODE";
      ui.acceptAnswerButton.disabled = !localReady;
      if (waitingForReply) ui.joinOfferButton.disabled = false;
      if (ui.quickPlayButton) ui.quickPlayButton.disabled = ui.hostOfferButton.disabled && !ui.remoteSignal.value.trim();
    }

    function updateStatusLabels() {
      const replacements = {
        "WAITING ANSWER": "SEND CODE",
        "WAITING HOST": "SEND REPLY"
      };
      [ui.networkStatus, ui.homeNetworkStatus].forEach((element) => {
        if (!element) return;
        const current = element.textContent.trim().toUpperCase();
        if (replacements[current]) element.textContent = replacements[current];
      });
    }

    function updateRoomUi() {
      if (ui.roomIdValue) ui.roomIdValue.textContent = activeRoom ? activeRoom.id : "NONE";
      if (ui.roomHint) {
        ui.roomHint.textContent = activeRoom
          ? `${activeRoom.name} - ${activeRoom.mode === "quick" ? "Quick Play" : "Private Room"}`
          : apiAvailable()
            ? "Quick Play finds an open room or creates one. Join Room accepts a room ID or a pasted code."
            : "Create a room code, send it to a friend, then paste their reply to connect.";
      }
    }

    function addPeerNote(message) {
      if (!ui.killFeed) return;
      const item = document.createElement("div");
      item.innerHTML = `<strong>Rooms</strong><span>${message}</span>`;
      ui.killFeed.prepend(item);
      window.setTimeout(() => item.remove(), 3500);
    }

    async function copyCode(value) {
      const code = value.trim();
      if (!code) {
        ui.localSignal.select();
        addPeerNote("No code yet");
        return;
      }

      try {
        await navigator.clipboard.writeText(code);
        addPeerNote("Room code copied");
      } catch (error) {
        ui.localSignal.select();
        addPeerNote("Select room code to copy");
      }
    }

    function createRoom(mode) {
      return {
        id: createRoomId(),
        name: sanitizeRoomName(ui.roomNameInput && ui.roomNameInput.value),
        mode: mode === "quick" ? "quick" : "custom"
      };
    }

    function createRoomId() {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let id = "";
      for (let index = 0; index < 6; index++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
      return id;
    }

    function sanitizeRoomName(value) {
      return String(value || "After-School Room").replace(/[^\w .:-]/g, "").trim().slice(0, 24) || "After-School Room";
    }

    async function findQuickRoom() {
      if (!apiAvailable()) return null;
      try {
        const data = await fetchRoomApi("?quick=1");
        return data && data.offer ? data : null;
      } catch (error) {
        addPeerNote("Room API unavailable");
        return null;
      }
    }

    async function joinRoomId(roomId) {
      if (!apiAvailable()) {
        addPeerNote("Paste a room code, not just the room ID");
        return;
      }

      try {
        const data = await fetchRoomApi(`?room=${encodeURIComponent(roomId)}`);
        if (!data || !data.offer) throw new Error("Room not found");
        activeRoom = normalizeRoom(data.room, "quick");
        ui.remoteSignal.value = data.offer;
        updateRoomUi();
        addPeerNote(`Joining ${activeRoom.id}`);
        ui.joinOfferButton.click();
      } catch (error) {
        addPeerNote(error && error.message ? error.message : "Could not join room");
      }
    }

    async function publishCurrentCode() {
      if (!apiAvailable() || !activeRoom) return;
      const code = ui.localSignal.value.trim();
      if (!code || code === lastPublishedCode) return;
      const signal = readFriendCode(code);
      if (!signal || (signal.type !== "offer" && signal.type !== "answer")) return;
      const roomCode = code.startsWith(ROOM_CODE_PREFIX) ? code : writeRoomCode(signal, activeRoom);

      try {
        await postRoomApi({
          action: signal.type,
          room: activeRoom,
          code: roomCode,
          host: sanitizeRoomName(ui.roomNameInput && ui.roomNameInput.value)
        });
        lastPublishedCode = roomCode;
        if (signal.type === "offer") {
          addPeerNote(`Room ${activeRoom.id} online`);
          startAnswerPolling();
        } else {
          addPeerNote(`Reply sent for ${activeRoom.id}`);
        }
      } catch (error) {
        addPeerNote("Manual code fallback active");
      }
    }

    function startAnswerPolling() {
      window.clearInterval(pollTimer);
      if (!activeRoom || !apiAvailable()) return;
      pollTimer = window.setInterval(async () => {
        try {
          const data = await fetchRoomApi(`?room=${encodeURIComponent(activeRoom.id)}`);
          if (!data || !data.answer || data.answer === lastAppliedAnswer) return;
          lastAppliedAnswer = data.answer;
          ui.remoteSignal.value = data.answer;
          addPeerNote("Reply received");
          ui.joinOfferButton.click();
          window.clearInterval(pollTimer);
        } catch (error) {
          // Poll failures are transient on serverless cold starts; the manual code remains visible.
        }
      }, API_POLL_MS);
    }
  }

  function readFriendCode(value) {
    const clean = String(value || "").trim();
    if (!clean) return null;

    try {
      const parsed = clean.startsWith(CODE_PREFIX)
        ? JSON.parse(atob(padBase64(clean.slice(CODE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/"))))
        : clean.startsWith(ROOM_CODE_PREFIX)
          ? JSON.parse(atob(padBase64(clean.slice(ROOM_CODE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/"))))
        : JSON.parse(clean);
      if (!parsed || !parsed.type || !parsed.sdp) return null;
      return {
        v: parsed.v || 1,
        type: parsed.type,
        sdp: parsed.sdp,
        room: parsed.room || null
      };
    } catch (error) {
      return null;
    }
  }

  function writeRoomCode(signal, room) {
    return `${ROOM_CODE_PREFIX}${btoa(JSON.stringify({
      v: 2,
      type: signal.type,
      sdp: signal.sdp,
      room: normalizeRoom(room, "custom")
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
  }

  function readRoomId(value) {
    const clean = String(value || "").trim().toUpperCase();
    if (/^[A-Z0-9]{6,8}$/.test(clean) && !clean.startsWith("HSS")) return clean;
    return "";
  }

  function normalizeRoom(room, fallbackMode) {
    const raw = room && typeof room === "object" ? room : {};
    return {
      id: String(raw.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || createFallbackRoomId(),
      name: String(raw.name || "After-School Room").replace(/[^\w .:-]/g, "").trim().slice(0, 24) || "After-School Room",
      mode: raw.mode === "quick" || fallbackMode === "quick" ? "quick" : "custom"
    };
  }

  function createFallbackRoomId() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let index = 0; index < 6; index++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
    return id;
  }

  function apiAvailable() {
    return window.location.protocol === "http:" || window.location.protocol === "https:";
  }

  async function fetchRoomApi(query) {
    const response = await fetch(`${ROOM_API}${query}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || "Room API failed");
    return data;
  }

  async function postRoomApi(payload) {
    const response = await fetch(ROOM_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || "Room API failed");
    return data;
  }

  function padBase64(value) {
    return value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  }

  function installRtcConfigShim() {
    if (typeof RTCPeerConnection === "undefined" || RTCPeerConnection.__hssShim) return;
    const NativePeerConnection = RTCPeerConnection;

    function HssPeerConnection(config) {
      const peer = new NativePeerConnection(mergeRtcConfig(config));
      peer.addEventListener("icecandidateerror", (event) => {
        window.dispatchEvent(new CustomEvent("hss-rtc-error", {
          detail: {
            url: event.url || "",
            errorCode: event.errorCode || 0,
            errorText: event.errorText || "ICE candidate error"
          }
        }));
      });
      return peer;
    }

    HssPeerConnection.prototype = NativePeerConnection.prototype;
    Object.setPrototypeOf(HssPeerConnection, NativePeerConnection);
    HssPeerConnection.__hssShim = true;
    window.RTCPeerConnection = HssPeerConnection;

    window.addEventListener("hss-rtc-error", (event) => {
      const detail = event.detail || {};
      const message = detail.errorText || `ICE error ${detail.errorCode || ""}`.trim();
      const feed = document.getElementById("killFeed");
      if (!feed) return;
      const item = document.createElement("div");
      item.innerHTML = `<strong>Network</strong><span>${escapeHtml(message)}</span>`;
      feed.prepend(item);
      window.setTimeout(() => item.remove(), 4500);
    });
  }

  function mergeRtcConfig(config) {
    const base = config && typeof config === "object" ? config : {};
    const iceServers = [];
    const seen = new Set();
    [...DEFAULT_ICE_SERVERS, ...Array.isArray(base.iceServers) ? base.iceServers : []].forEach((server) => {
      const key = JSON.stringify(server && server.urls ? server.urls : server);
      if (!key || seen.has(key)) return;
      seen.add(key);
      iceServers.push(server);
    });
    return {
      ...base,
      iceServers,
      iceCandidatePoolSize: Math.max(Number(base.iceCandidatePoolSize) || 0, 4)
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function injectRoomStyles() {
    if (document.getElementById("roomLinkDynamicStyles")) return;
    const style = document.createElement("style");
    style.id = "roomLinkDynamicStyles";
    style.textContent = `
      .room-title { display: block; font-size: 28px; line-height: 1; }
      .online-card small { color: var(--muted); font-size: 13px; font-weight: 700; line-height: 1.4; }
      .room-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      @media (max-width: 760px) { .room-actions { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }
})();

(function () {
  "use strict";

  const CODE_PREFIX = "HSS1.";
  const ROOM_CODE_PREFIX = "HSSR.";

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
    let activeRoom = null;

    if (ui.quickPlayButton) {
      ui.quickPlayButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (ui.remoteSignal.value.trim()) {
          ui.joinOfferButton.click();
        } else {
          activeRoom = createRoom("quick");
          ui.hostOfferButton.click();
        }
        updateRoomUi();
      }, true);
    }

    ui.hostOfferButton.addEventListener("click", () => {
      activeRoom = createRoom("custom");
      updateRoomUi();
      startCompactor();
    }, true);

    ui.joinOfferButton.addEventListener("click", () => {
      const signal = readFriendCode(ui.remoteSignal.value);
      if (!signal) return;

      if (signal.room) activeRoom = signal.room;
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
      room
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
  }

  function padBase64(value) {
    return value.padEnd(Math.ceil(value.length / 4) * 4, "=");
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

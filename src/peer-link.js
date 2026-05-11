(function () {
  "use strict";

  const CODE_PREFIX = "HSS1.";

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
    const ui = {
      localSignal: document.getElementById("localSignal"),
      remoteSignal: document.getElementById("remoteSignal"),
      hostOfferButton: document.getElementById("hostOfferButton"),
      joinOfferButton: document.getElementById("joinOfferButton"),
      acceptAnswerButton: document.getElementById("acceptAnswerButton"),
      networkStatus: document.getElementById("networkStatus"),
      homeNetworkStatus: document.getElementById("homeNetworkStatus"),
      killFeed: document.getElementById("killFeed")
    };

    if (!ui.localSignal || !ui.remoteSignal || !ui.hostOfferButton || !ui.joinOfferButton || !ui.acceptAnswerButton) return;

    let internalAccept = false;
    let compactTimer = 0;

    ui.hostOfferButton.addEventListener("click", () => {
      startCompactor();
    }, true);

    ui.joinOfferButton.addEventListener("click", (event) => {
      const signal = readFriendCode(ui.remoteSignal.value);
      if (!signal) return;

      ui.remoteSignal.value = JSON.stringify(signal, null, 2);
      if (signal.type !== "answer") {
        startCompactor();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      internalAccept = true;
      ui.acceptAnswerButton.disabled = false;
      ui.acceptAnswerButton.click();
      internalAccept = false;
      updateStatusLabels();
    }, true);

    ui.acceptAnswerButton.addEventListener("click", async (event) => {
      if (internalAccept) return;
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
      if (!signal || ui.localSignal.value.trim().startsWith(CODE_PREFIX)) return;
      ui.localSignal.value = writeCode(signal);
    }

    function syncButtons() {
      const localReady = Boolean(ui.localSignal.value.trim());
      const status = (ui.networkStatus && ui.networkStatus.textContent || "").trim().toUpperCase();
      const waitingForReply = status === "WAITING ANSWER" || status === "SEND CODE";
      ui.acceptAnswerButton.disabled = !localReady;
      if (waitingForReply) ui.joinOfferButton.disabled = false;
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

    function addPeerNote(message) {
      if (!ui.killFeed) return;
      const item = document.createElement("div");
      item.innerHTML = `<strong>Peer Link</strong><span>${message}</span>`;
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
        addPeerNote("Code copied");
      } catch (error) {
        ui.localSignal.select();
        addPeerNote("Select code to copy");
      }
    }
  }

  function readFriendCode(value) {
    const clean = String(value || "").trim();
    if (!clean) return null;

    try {
      const parsed = clean.startsWith(CODE_PREFIX)
        ? JSON.parse(atob(padBase64(clean.slice(CODE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/"))))
        : JSON.parse(clean);
      if (!parsed || !parsed.type || !parsed.sdp) return null;
      return {
        v: 1,
        type: parsed.type,
        sdp: parsed.sdp
      };
    } catch (error) {
      return null;
    }
  }

  function writeCode(signal) {
    return `${CODE_PREFIX}${btoa(JSON.stringify({
      v: 1,
      type: signal.type,
      sdp: signal.sdp
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
  }

  function padBase64(value) {
    return value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  }
})();

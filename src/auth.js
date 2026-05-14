(function () {
  "use strict";

  const USERS_KEY = "hssae.accounts.v1";
  const SESSION_KEY = "hssae.session.username";
  const MIN_USERNAME = 3;
  const MIN_PASSWORD = 4;
  const LEGACY_LOCKER_KEY = "hssae.locker.v1";
  const PROFILE_LOCKER_PREFIX = "hssae.locker.v2.";

  const api = {
    currentUser,
    profileKey,
    requireProfileKey: profileKey
  };

  window.hssAuth = api;
  installLegacyLockerShim();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    installAuthStyles();
    const ui = {
      username: document.getElementById("authUsername"),
      password: document.getElementById("authPassword"),
      login: document.getElementById("authLoginButton"),
      create: document.getElementById("authCreateButton"),
      logout: document.getElementById("authLogoutButton"),
      status: document.getElementById("authStatus"),
      playerName: document.getElementById("playerNameInput"),
      onlineName: document.getElementById("onlineNameInput")
    };

    if (!ui.username || !ui.password || !ui.login || !ui.create || !ui.logout || !ui.status) {
      dispatchAuthChange();
      return;
    }

    const active = currentUser();
    if (active) ui.username.value = active.username;

    ui.login.addEventListener("click", () => login(ui));
    ui.create.addEventListener("click", () => createAccount(ui));
    ui.logout.addEventListener("click", () => logout(ui));
    ui.password.addEventListener("keydown", (event) => {
      if (event.key === "Enter") login(ui);
    });

    renderStatus(ui);
    syncNameInputs(ui);
    dispatchAuthChange();

    window.addEventListener("hss-auth-changed", () => {
      if (window.hssSkins && typeof window.hssSkins.setProfile !== "function") {
        const marker = `hssae.reload.${profileKey()}`;
        if (!sessionStorage.getItem(marker)) {
          sessionStorage.setItem(marker, "1");
          window.location.reload();
        }
      }
    });
  }

  async function createAccount(ui) {
    const username = sanitizeUsername(ui.username.value);
    const password = String(ui.password.value || "");
    if (username.length < MIN_USERNAME) return setStatus(ui, "Use 3+ username chars");
    if (password.length < MIN_PASSWORD) return setStatus(ui, "Use 4+ password chars");

    const users = loadUsers();
    const key = usernameKey(username);
    if (users[key]) return setStatus(ui, "Username already exists");

    const salt = createSalt();
    users[key] = {
      username,
      salt,
      passwordHash: await hashPassword(username, password, salt),
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
    saveUsers(users);
    setSession(key);
    ui.password.value = "";
    setStatus(ui, `Signed in as ${username}`);
    renderStatus(ui);
    syncNameInputs(ui);
    dispatchAuthChange();
  }

  async function login(ui) {
    const username = sanitizeUsername(ui.username.value);
    const password = String(ui.password.value || "");
    const users = loadUsers();
    const key = usernameKey(username);
    const user = users[key];
    if (!user) return setStatus(ui, "Account not found");
    const passwordHash = await hashPassword(user.username, password, user.salt);
    if (passwordHash !== user.passwordHash) return setStatus(ui, "Wrong password");

    user.lastLoginAt = Date.now();
    users[key] = user;
    saveUsers(users);
    setSession(key);
    ui.password.value = "";
    setStatus(ui, `Signed in as ${user.username}`);
    renderStatus(ui);
    syncNameInputs(ui);
    dispatchAuthChange();
  }

  function logout(ui) {
    setSession("");
    ui.password.value = "";
    setStatus(ui, "Signed out");
    renderStatus(ui);
    dispatchAuthChange();
  }

  function renderStatus(ui) {
    const user = currentUser();
    ui.logout.disabled = !user;
    if (!ui.status.textContent) setStatus(ui, user ? `Signed in as ${user.username}` : "Guest locker");
  }

  function setStatus(ui, message) {
    ui.status.textContent = message;
  }

  function syncNameInputs(ui) {
    const user = currentUser();
    if (!user) return;
    [ui.playerName, ui.onlineName].forEach((input) => {
      if (!input) return;
      input.value = user.username;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function currentUser() {
    const key = getSession();
    if (!key) return null;
    const user = loadUsers()[key];
    return user ? { username: user.username, key } : null;
  }

  function profileKey() {
    const user = currentUser();
    return user ? user.key : "guest";
  }

  function dispatchAuthChange() {
    window.dispatchEvent(new CustomEvent("hss-auth-changed", {
      detail: {
        user: currentUser(),
        profileKey: profileKey()
      }
    }));
  }

  function sanitizeUsername(value) {
    return String(value || "").replace(/[^\w .-]/g, "").trim().slice(0, 18);
  }

  function usernameKey(value) {
    return sanitizeUsername(value).toLowerCase().replace(/\s+/g, "-");
  }

  function loadUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (error) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      return localStorage.getItem(SESSION_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function setSession(key) {
    if (key) localStorage.setItem(SESSION_KEY, key);
    else localStorage.removeItem(SESSION_KEY);
  }

  function installLegacyLockerShim() {
    if (!window.Storage || Storage.prototype.__hssAuthLockerShim) return;
    const nativeGet = Storage.prototype.getItem;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    Storage.prototype.getItem = function (key) {
      return nativeGet.call(this, mapLockerKey(key));
    };
    Storage.prototype.setItem = function (key, value) {
      return nativeSet.call(this, mapLockerKey(key), value);
    };
    Storage.prototype.removeItem = function (key) {
      return nativeRemove.call(this, mapLockerKey(key));
    };
    Storage.prototype.__hssAuthLockerShim = true;
  }

  function mapLockerKey(key) {
    return key === LEGACY_LOCKER_KEY ? PROFILE_LOCKER_PREFIX + profileKey() : key;
  }

  function createSalt() {
    const bytes = new Uint8Array(12);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(username, password, salt) {
    const text = `${usernameKey(username)}:${salt}:${password}`;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const bytes = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return fallbackHash(text);
  }

  function fallbackHash(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function installAuthStyles() {
    if (document.getElementById("hssAuthStyles")) return;
    const style = document.createElement("style");
    style.id = "hssAuthStyles";
    style.textContent = `
      .auth-panel {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
        gap: 10px;
        align-items: end;
        margin: 12px 0;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.055);
      }
      .auth-field {
        display: grid;
        gap: 5px;
        min-width: 0;
      }
      .auth-field span,
      .auth-status {
        color: var(--muted, #9aa7b5);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .auth-field input {
        min-width: 0;
        height: 38px;
        padding: 0 10px;
        color: var(--ink, #f4f7fb);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.28);
      }
      .auth-actions {
        display: grid;
        grid-template-columns: repeat(3, max-content);
        gap: 8px;
      }
      .auth-status {
        grid-column: 1 / -1;
      }
      @media (max-width: 760px) {
        .auth-panel,
        .auth-actions {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();

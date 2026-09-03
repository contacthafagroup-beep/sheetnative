/**
 * SheetNative Desktop — native shell (Electron).
 * Real desktop-app feel: integrated title bar (drag regions in web chrome),
 * native notifications, Explorer file drag-drop into the app, tray with
 * launch-at-login + zoom + update check, close-to-tray, offline screen,
 * window-state persistence, keyboard shortcuts.
 */
const { app, BrowserWindow, Tray, Menu, shell, session, nativeImage, Notification, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const PROD_URL = "https://sheetnative.vercel.app";
const APP_URL = process.env.SHEETNATIVE_URL || PROD_URL;
const APP_NAME = "SheetNative";
const RELEASES_URL = "https://github.com/contacthafagroup-beep/sheetnative/releases/latest";
const RELEASES_API = "https://api.github.com/repos/contacthafagroup-beep/sheetnative/releases/latest";

let mainWindow = null;
let tray = null;
let quitting = false;
let reconnectNotify = false;

app.setAppUserModelId("com.sheetnative.desktop");

const statePath = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return {};
  }
}

function saveWindowState(patch = {}) {
  const next = { ...loadWindowState(), ...patch };
  if (mainWindow && !mainWindow.isDestroyed()) {
    const bounds = mainWindow.getBounds();
    next.width = bounds.width;
    next.height = bounds.height;
    next.x = bounds.x;
    next.y = bounds.y;
    next.maximized = mainWindow.isMaximized();
  }
  try {
    fs.writeFileSync(statePath(), JSON.stringify(next));
  } catch {}
}

function notify(title, body) {
  if (Notification.isSupported()) new Notification({ title, body, icon: trayIcon(32) }).show();
}

function trayIcon(size) {
  return nativeImage.createFromPath(path.join(__dirname, "icon", "icon-256.png")).resize({ width: size, height: size });
}

/* ---------------- window ---------------- */

function createWindow() {
  const prev = loadWindowState();

  mainWindow = new BrowserWindow({
    width: prev.width ?? 1280,
    height: prev.height ?? 840,
    x: prev.x,
    y: prev.y,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#07090f",
    title: APP_NAME,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon", "icon-256.png"),
    show: false,
    frame: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#07090f",
      symbolColor: "#94a3b8",
      hoverColor: "#1e293b",
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  if (prev.maximized) mainWindow.maximize();

  // first-run setup screen (skippable) → then the app
  if (prev.skipWelcome) mainWindow.loadURL(APP_URL);
  else
    mainWindow
      .loadFile("welcome.html", {
        query: { v: app.getVersion(), startup: app.getLoginItemSettings().openAtLogin ? "1" : "0" },
      })
      .catch(() => mainWindow.loadURL(APP_URL));

  mainWindow.once("ready-to-show", () => mainWindow.show());

  /* desktop feel: smooth fade-in + crisp text rendering */
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow.webContents.getURL().startsWith("file:")) return;
    mainWindow.webContents.insertCSS(`
      body { animation: sheetnative-boot .35s ease; }
      @keyframes sheetnative-boot { from { opacity: 0 } to { opacity: 1 } }
      ::selection { background: rgba(99,102,241,.4); }
    `);
    if (reconnectNotify) {
      reconnectNotify = false;
      notify("Back online", "SheetNative reconnected and synced.");
    }
  });

  /* navigation guard: welcome actions, file drops, external links, in-app nav */
  mainWindow.webContents.on("will-navigate", (e, url) => {
    // first-run setup actions: sheetnative://launch?remember=1&startup=1
    if (url.startsWith("sheetnative://")) {
      e.preventDefault();
      const q = new URLSearchParams(url.split("?")[1] ?? "");
      if (q.get("remember") === "1") saveWindowState({ skipWelcome: true });
      if (process.platform === "win32")
        app.setLoginItemSettings({ openAtLogin: q.get("startup") === "1", path: process.execPath });
      mainWindow.loadURL(APP_URL);
      return;
    }
    if (url.startsWith("file:///")) {
      e.preventDefault();
      const p = path.normalize(decodeURIComponent(url.replace(/^file:\/\/\//, "")));
      fs.readFile(p, (err, buf) => {
        if (!err && mainWindow) {
          mainWindow.webContents.send("native-file", { name: path.basename(p), data: buf });
          notify("Workbook received", `${path.basename(p)} dropped into SheetNative.`);
        }
      });
      return;
    }
    if (isAppUrl(url)) return; // normal in-app navigation
    e.preventDefault();
    if (isAuthUrl(url)) openAuthPopup(url); // legacy full-redirect OAuth → popup
    else shell.openExternal(url);
  });

  /* window-open handling is centralized in the global web-contents-created handler */

  /* offline → branded screen; back online → native notification */
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, _url, isMain) => {
    if (isMain && code !== 0 && !quitting) {
      reconnectNotify = true;
      mainWindow.loadFile("offline.html", { query: { url: APP_URL, reason: String(desc || code) } });
    }
  });

  /* close-to-tray (Slack behavior) */
  mainWindow.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on("closed", () => (mainWindow = null));

  const save = () => saveWindowState();
  ["resize", "move", "maximize", "unmaximize"].forEach((ev) => mainWindow.on(ev, save));

  registerShortcuts();
}

/* ---------------- keyboard shortcuts ---------------- */

function registerShortcuts() {
  const wc = () => mainWindow.webContents;
  mainWindow.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    const ctrl = input.control || input.meta;
    const key = input.key.toLowerCase();

    if (ctrl && key === "r") { wc().reload(); e.preventDefault(); }
    else if (key === "f5") { wc().reload(); e.preventDefault(); }
    else if (ctrl && (key === "+" || key === "=")) { wc().setZoomLevel(Math.min(wc().getZoomLevel() + 0.5, 5)); e.preventDefault(); }
    else if (ctrl && key === "-") { wc().setZoomLevel(Math.max(wc().getZoomLevel() - 0.5, -5)); e.preventDefault(); }
    else if (ctrl && key === "0") { wc().setZoomLevel(0); e.preventDefault(); }
    else if (key === "f11") { mainWindow.setFullScreen(!mainWindow.isFullScreen()); e.preventDefault(); }
    else if ((ctrl && input.shift && key === "i") || key === "f12") { wc().toggleDevTools(); e.preventDefault(); }
    else if (ctrl && key === "q") { quitting = true; app.quit(); }
  });
}

/* ---------------- tray ---------------- */

function buildTrayMenu() {
  const login = app.getLoginItemSettings();
  return Menu.buildFromTemplate([
    { label: "Open SheetNative", click: showWindow },
    { type: "separator" },
    { label: "Launch at Windows startup", type: "checkbox", checked: login.openAtLogin, click: (item) => {
      app.setLoginItemSettings({ openAtLogin: item.checked, path: process.execPath });
    } },
    { type: "separator" },
    { label: "Zoom in", click: () => mainWindow?.webContents.setZoomLevel(Math.min(mainWindow.webContents.getZoomLevel() + 0.5, 5)) },
    { label: "Zoom out", click: () => mainWindow?.webContents.setZoomLevel(Math.max(mainWindow.webContents.getZoomLevel() - 0.5, -5)) },
    { label: "Reset zoom", click: () => mainWindow?.webContents.setZoomLevel(0) },
    { type: "separator" },
    { label: "Check for updates…", click: checkForUpdates },
    { type: "separator" },
    { label: "Quit", click: () => { quitting = true; app.quit(); } },
  ]);
}

function createTray() {
  tray = new Tray(trayIcon(16));
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(buildTrayMenu());
  tray.on("double-click", showWindow);
}

/* ---------------- updates (GitHub releases) ---------------- */

async function checkForUpdates() {
  try {
    const res = await fetch(RELEASES_API, { headers: { "User-Agent": "SheetNative-Desktop" } });
    const json = await res.json();
    const latest = String(json.tag_name ?? "").replace(/^v/, "");
    const current = app.getVersion();
    if (latest && latest !== current) {
      const { response } = await dialog.showMessageBox({
        type: "info",
        title: "Update available",
        message: `SheetNative ${latest} is available (you have ${current}).`,
        buttons: ["Open download page", "Later"],
      });
      if (response === 0) shell.openExternal(RELEASES_URL);
    } else {
      dialog.showMessageBox({ type: "info", title: APP_NAME, message: `You're up to date (v${current}).`, buttons: ["OK"] });
    }
  } catch {
    dialog.showMessageBox({ type: "info", title: APP_NAME, message: "Couldn't check for updates — you may be offline.", buttons: ["OK"] });
  }
}

/* ---------------- ipc ---------------- */

ipcMain.on("notify", (_e, { title, body }) => notify(String(title ?? APP_NAME), String(body ?? "")));
ipcMain.handle("app:version", () => app.getVersion());

/* ---------------- auth popups & window management ---------------- */

const AUTH_HOSTS = ["supabase.co", "google.com", "github.com", "apple.com", "microsoftonline.com", "login.live.com"];
const isAuthUrl = (url) => AUTH_HOSTS.some((h) => url.includes(h));
const isAppUrl = (url) => url.startsWith(APP_URL);

function trackAuthPopup(popupWindow) {
  const wc = popupWindow.webContents;

  // visible back/reload controls injected into every page of the popup
  const injectNavButtons = () => {
    wc.insertCSS(`
      #sn-nav { position:fixed; top:10px; left:10px; z-index:2147483647; display:flex; gap:6px; }
      #sn-nav button {
        width:34px; height:34px; border-radius:50%; border:0; cursor:pointer;
        background:rgba(15,23,42,.82); color:#fff; font-size:16px; line-height:1;
        box-shadow:0 4px 14px rgba(0,0,0,.35); backdrop-filter:blur(4px);
      }
      #sn-nav button:hover { background:rgba(99,102,241,.95); }
    `).then(() =>
      wc.executeJavaScript(`
        (function () {
          if (document.getElementById("sn-nav")) return;
          const bar = document.createElement("div");
          bar.id = "sn-nav";
          const back = document.createElement("button");
          back.textContent = "\\u2190";
          back.title = "Back (Alt+Left)";
          back.onclick = () => history.back();
          const reload = document.createElement("button");
          reload.textContent = "\\u21bb";
          reload.title = "Reload";
          reload.onclick = () => location.reload();
          bar.appendChild(back);
          bar.appendChild(reload);
          document.body.appendChild(bar);
        })();
      `).catch(() => {})
    );
  };
  wc.on("did-navigate", injectNavButtons);
  wc.on("did-navigate-in-page", injectNavButtons);

  const finish = (fullUrl) => {
    if (!isAppUrl(fullUrl)) return;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(fullUrl);
    try { popupWindow.destroy(); } catch {}
  };
  wc.on("will-redirect", (e, url) => finish(url));
  wc.on("did-navigate", (_e, url) => finish(url));
  wc.on("did-finish-load", () => {
    wc.executeJavaScript("location.href", true).then((href) => finish(href)).catch(() => {});
  });
}

function openAuthPopup(url) {
  const win = new BrowserWindow({
    width: 480,
    height: 720,
    parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    title: "Sign in",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadURL(url);
  trackAuthPopup(win);
  return win;
}

// safety: Alt+Left / Alt+Right go back/forward in every window, Escape closes popups
app.on("web-contents-created", (_e, wc) => {
  wc.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.alt && input.key === "ArrowLeft" && wc.navigationHistory.canGoBack()) {
      wc.goBack();
      e.preventDefault();
    } else if (input.alt && input.key === "ArrowRight" && wc.navigationHistory.canGoForward()) {
      wc.goForward();
      e.preventDefault();
    }
  });

  wc.setWindowOpenHandler(({ url }) => {
    // sign-in flows (Google/GitHub consent etc.) open inside a small popup
    if (isAuthUrl(url) || isAppUrl(url)) {
      openAuthPopup(url);
      return { action: "deny" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });
});

/* ---------------- lifecycle ---------------- */

function showWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", showWindow);

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback, details) => {
      const ok = details.requestingUrl.startsWith(APP_URL);
      callback(ok && ["media", "notifications", "clipboard-read"].includes(permission));
    });

    createWindow();
    createTray();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("before-quit", () => {
  quitting = true;
  saveWindowState();
});

app.on("window-all-closed", () => {
  if (quitting) app.quit();
});

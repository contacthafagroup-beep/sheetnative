/**
 * SheetNative Desktop — native shell (Electron) for the SheetNative Business OS.
 * Slack-style: loads the production app, tray integration, close-to-tray,
 * external links in system browser, offline screen, window-state persistence.
 */
const { app, BrowserWindow, Tray, Menu, shell, session, nativeImage, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const PROD_URL = "https://sheetnative.vercel.app";
const APP_URL = process.env.SHEETNATIVE_URL || PROD_URL;
const APP_NAME = "SheetNative";

let mainWindow = null;
let tray = null;
let quitting = false;

const statePath = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return {};
  }
}

function saveWindowState() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const state = { ...bounds, maximized: mainWindow.isMaximized() };
  try {
    fs.writeFileSync(statePath(), JSON.stringify(state));
  } catch {}
}

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  if (prev.maximized) mainWindow.maximize();

  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // failed load (offline / DNS) → branded offline page
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url, isMain) => {
    if (isMain && code !== 0) {
      mainWindow.loadFile("offline.html", { query: { url: APP_URL, reason: String(desc || code) } });
    }
  });

  // external links → system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL) && !url.includes("supabase.co")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true } };
  });

  // close-to-tray (like Slack), real quit from tray or Cmd+Q
  mainWindow.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const save = () => saveWindowState();
  mainWindow.on("resize", save);
  mainWindow.on("move", save);
  mainWindow.on("maximize", save);
  mainWindow.on("unmaximize", save);
}

function createTray() {
  const iconPath = path.join(__dirname, "icon", "icon-256.png");
  const img = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open SheetNative", click: showWindow },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("double-click", showWindow);
}

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
    // allow camera/mic only for the product origin (voice & vision features)
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

ipcMain.handle("app:version", () => app.getVersion());

app.on("before-quit", () => {
  quitting = true;
  saveWindowState();
});

app.on("window-all-closed", () => {
  // keep running in tray (Slack behavior); real exit via tray → Quit
  if (process.platform === "darwin" && !quitting) return;
  if (quitting) app.quit();
});

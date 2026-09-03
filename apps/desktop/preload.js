const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sheetnative", {
  isDesktop: true,
  version: () => ipcRenderer.invoke("app:version"),
});

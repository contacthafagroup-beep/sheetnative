const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sheetnative", {
  isDesktop: true,
  platform: process.platform,
  version: () => ipcRenderer.invoke("app:version"),
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
});

/* Explorer file drag-drop → forward into the web app as a real drop event */
ipcRenderer.on("native-file", (_e, { name, data }) => {
  try {
    const file = new File([data], name);
    const dt = new DataTransfer();
    dt.items.add(file);
    const zone =
      document.querySelector("[data-dropzone]") ||
      document.querySelector("input[type='file']")?.closest("label, div") ||
      document.body;
    zone.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })
    );
  } catch {}
});

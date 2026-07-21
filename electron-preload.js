const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("SlowIndexElectron", {
  isElectron: true,
  setReminders(reminders) {
    return ipcRenderer.invoke("set-reminders", reminders);
  },
  showWindow() {
    return ipcRenderer.invoke("show-window");
  },
  loadGoogleEvents(config) {
    return ipcRenderer.invoke("load-google-events", config);
  },
  onStartSlow(callback) {
    ipcRenderer.on("electron-start-slow", (_event, proposalId) => {
      callback(proposalId);
    });
  },
});

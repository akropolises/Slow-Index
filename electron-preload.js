const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("SlowIndexElectron", {
  isElectron: true,
  setReminders(reminders) {
    return ipcRenderer.invoke("set-reminders", reminders);
  },
  showWindow() {
    return ipcRenderer.invoke("show-window");
  },
  enterSlowMode() {
    return ipcRenderer.invoke("enter-slow-mode");
  },
  leaveSlowMode() {
    return ipcRenderer.invoke("leave-slow-mode");
  },
  loadGoogleEvents(config) {
    return ipcRenderer.invoke("load-google-events", config);
  },
  clearGoogleAuth() {
    return ipcRenderer.invoke("clear-google-auth");
  },
  onStartSlow(callback) {
    ipcRenderer.on("electron-start-slow", (_event, proposalId) => {
      callback(proposalId);
    });
  },
});

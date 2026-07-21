const path = require("path");
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");

let mainWindow = null;
let tray = null;
const reminderTimers = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 760,
    minWidth: 360,
    minHeight: 600,
    show: false,
    title: "Slow Index",
    backgroundColor: "#fffdf8",
    webPreferences: {
      preload: path.join(__dirname, "electron-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#2e6f65"/>
      <circle cx="16" cy="16" r="8" fill="#fffdf8"/>
      <circle cx="16" cy="16" r="4" fill="#d9b66f"/>
    </svg>
  `);
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml,${iconSvg}`);
  tray = new Tray(icon);
  tray.setToolTip("Slow Index");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Slow Indexを開く", click: showMainWindow },
      {
        label: "終了",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("click", showMainWindow);
}

function showMainWindow() {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.focus();
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false);
    }
  }, 3000);
}

function clearReminderTimers() {
  reminderTimers.forEach((timer) => clearTimeout(timer));
  reminderTimers.clear();
}

function scheduleReminders(reminders) {
  clearReminderTimers();
  reminders.forEach((reminder) => {
    const dueAt = new Date(reminder.dueAt).getTime();
    const delay = dueAt - Date.now();
    if (!Number.isFinite(dueAt) || delay <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      reminderTimers.delete(reminder.id);
      showMainWindow();
      mainWindow.webContents.send("electron-start-slow", reminder.id);
    }, delay);
    reminderTimers.set(reminder.id, timer);
  });
}

ipcMain.handle("set-reminders", (_event, reminders) => {
  scheduleReminders(Array.isArray(reminders) ? reminders : []);
  return { scheduled: reminderTimers.size };
});

ipcMain.handle("show-window", () => {
  showMainWindow();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  app.setLoginItemSettings({
    openAtLogin: false,
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      showMainWindow();
    }
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  clearReminderTimers();
});

app.on("window-all-closed", () => {});

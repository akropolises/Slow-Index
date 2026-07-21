const path = require("path");
const fs = require("fs");
const http = require("http");
const crypto = require("crypto");
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require("electron");

let mainWindow = null;
let tray = null;
const reminderTimers = new Map();
const googleCalendarScope = "https://www.googleapis.com/auth/calendar.readonly";
const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleCalendarEventsUrl = "https://www.googleapis.com/calendar/v3/calendars";

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

function getTokenPath() {
  return path.join(app.getPath("userData"), "google-tokens.json");
}

function readStoredTokens() {
  try {
    return JSON.parse(fs.readFileSync(getTokenPath(), "utf8"));
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens) {
  fs.mkdirSync(path.dirname(getTokenPath()), { recursive: true });
  fs.writeFileSync(getTokenPath(), JSON.stringify(tokens, null, 2));
}

function clearStoredTokens() {
  try {
    fs.unlinkSync(getTokenPath());
  } catch {
    // No stored token yet.
  }
}

async function readErrorBody(response) {
  try {
    const text = await response.text();
    return text ? ` ${text}` : "";
  } catch {
    return "";
  }
}

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createPkcePair() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function toTimeValue(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function normalizeGoogleEvents(items) {
  return (items || [])
    .filter((event) => event.start?.dateTime && event.end?.dateTime)
    .map((event) => {
      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      return {
        id: event.id,
        title: event.summary || "予定",
        start: toTimeValue(startDate),
        duration: Math.max(Math.round((endDate - startDate) / 60000), 1),
        source: "google",
      };
    });
}

function startLoopbackServer() {
  return new Promise((resolve, reject) => {
    let settleCode;
    let rejectCode;
    const waitForCode = new Promise((codeResolve, codeReject) => {
      settleCode = codeResolve;
      rejectCode = codeReject;
    });

    const server = http.createServer((request, response) => {
      const url = new URL(request.url, "http://127.0.0.1");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      response.writeHead(error ? 400 : 200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(error ? "Google login failed. You can close this window." : "Google login complete. You can close this window.");
      server.close();

      if (error) {
        rejectCode(new Error(error));
        return;
      }
      settleCode(code);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        redirectUri: `http://127.0.0.1:${address.port}/oauth2callback`,
        waitForCode,
      });
    });
    server.once("error", rejectCode);
    server.once("error", reject);
  });
}

function buildTokenParams(params) {
  const tokenParams = new URLSearchParams(params);
  if (!tokenParams.get("client_secret")) {
    tokenParams.delete("client_secret");
  }
  return tokenParams;
}

async function exchangeCodeForTokens({ clientId, clientSecret, code, codeVerifier, redirectUri }) {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildTokenParams({
      client_id: clientId,
      client_secret: clientSecret || "",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}.${await readErrorBody(response)}`);
  }
  return response.json();
}

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: buildTokenParams({
      client_id: clientId,
      client_secret: clientSecret || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    clearStoredTokens();
    throw new Error(`Token refresh failed: ${response.status}.${await readErrorBody(response)}`);
  }
  return response.json();
}

async function getGoogleAccessToken(clientId, clientSecret) {
  const stored = readStoredTokens();
  if (stored?.refresh_token && stored.expires_at && stored.expires_at > Date.now() + 60000) {
    return stored.access_token;
  }

  if (stored?.refresh_token) {
    const refreshed = await refreshAccessToken(clientId, clientSecret, stored.refresh_token);
    const next = {
      ...stored,
      ...refreshed,
      refresh_token: stored.refresh_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    };
    writeStoredTokens(next);
    return next.access_token;
  }

  return authorizeGoogle(clientId, clientSecret);
}

async function authorizeGoogle(clientId, clientSecret) {
  const { verifier, challenge } = createPkcePair();
  const { redirectUri, waitForCode } = await startLoopbackServer();
  const authUrl = new URL(googleAuthUrl);
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: googleCalendarScope,
    access_type: "offline",
    prompt: "consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  await shell.openExternal(authUrl.toString());
  const code = await waitForCode;
  const tokens = await exchangeCodeForTokens({
    clientId,
    clientSecret,
    code,
    codeVerifier: verifier,
    redirectUri,
  });
  const stored = {
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  writeStoredTokens(stored);
  return stored.access_token;
}

async function listTodayGoogleEvents({ clientId, clientSecret, calendarId = "primary" }) {
  if (!clientId) {
    throw new Error("Missing Google OAuth Client ID.");
  }

  const accessToken = await getGoogleAccessToken(clientId, clientSecret);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const url = new URL(`${googleCalendarEventsUrl}/${encodeURIComponent(calendarId)}/events`);
  url.search = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    showDeleted: "false",
    singleEvents: "true",
    orderBy: "startTime",
  }).toString();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar API failed: ${response.status}.${await readErrorBody(response)}`);
  }

  const data = await response.json();
  return normalizeGoogleEvents(data.items);
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

ipcMain.handle("load-google-events", (_event, config) => {
  return listTodayGoogleEvents({
    clientId: config?.googleClientId,
    clientSecret: config?.googleClientSecret,
    calendarId: config?.googleCalendarId || "primary",
  });
});

ipcMain.handle("clear-google-auth", () => {
  clearStoredTokens();
  return { ok: true };
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

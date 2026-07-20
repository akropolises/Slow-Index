const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const webPush = require("web-push");

const root = __dirname;
const preferredPort = Number(process.env.PORT) || 8000;
const subscriptionFile = path.join(root, "push-subscriptions.json");
const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:slow-index@example.com";
const timers = new Map();
let lastClientHeartbeat = 0;
const activeClientWindowMs = 45000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

if (publicKey && privateKey) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn("Web Push is disabled. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
}

function readSubscriptions() {
  try {
    return JSON.parse(fs.readFileSync(subscriptionFile, "utf8"));
  } catch {
    return [];
  }
}

function writeSubscriptions(subscriptions) {
  fs.writeFileSync(subscriptionFile, JSON.stringify(subscriptions, null, 2));
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": types[".json"] });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function saveSubscription(subscription) {
  const subscriptions = readSubscriptions();
  const next = subscriptions.filter((item) => item.endpoint !== subscription.endpoint);
  next.push(subscription);
  writeSubscriptions(next);
}

function scheduleReminder(reminder) {
  if (!publicKey || !privateKey) {
    return false;
  }

  const dueAt = new Date(reminder.dueAt).getTime();
  const delay = dueAt - Date.now();
  if (!Number.isFinite(dueAt) || delay <= 0) {
    return false;
  }

  if (timers.has(reminder.id)) {
    clearTimeout(timers.get(reminder.id));
  }

  const timer = setTimeout(() => {
    timers.delete(reminder.id);
    sendReminder(reminder);
  }, delay);
  timers.set(reminder.id, timer);
  return true;
}

async function sendReminder(reminder) {
  if (Date.now() - lastClientHeartbeat < activeClientWindowMs) {
    console.log(`Skipped push for ${reminder.id}; Slow Index is open.`);
    return;
  }

  const subscriptions = readSubscriptions();
  const payload = JSON.stringify({
    title: "Micro Slowの時間です",
    body: `${reminder.eventTitle}の前に、${reminder.seconds}秒だけ整えます。`,
    proposalId: reminder.id,
    url: reminder.url,
  });

  await Promise.allSettled(
    subscriptions.map((subscription) => webPush.sendNotification(subscription, payload))
  );
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/push/public-key") {
    sendJson(response, 200, { publicKey });
    return;
  }

  if (pathname === "/api/push/subscribe" && request.method === "POST") {
    const subscription = await readJson(request);
    if (!subscription.endpoint) {
      sendJson(response, 400, { error: "Missing subscription endpoint." });
      return;
    }
    saveSubscription(subscription);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === "/api/push/reminders" && request.method === "POST") {
    const data = await readJson(request);
    const scheduled = (data.reminders || []).filter(scheduleReminder).length;
    sendJson(response, 200, { ok: true, scheduled });
    return;
  }

  if (pathname === "/api/client-heartbeat" && request.method === "POST") {
    lastClientHeartbeat = Date.now();
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "Not found." });
}

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (requestedPath === "config.local.js") {
        response.writeHead(200, { "Content-Type": types[".js"] });
        response.end(`window.SLOW_INDEX_CONFIG.pushPublicKey ||= ${JSON.stringify(publicKey)};`);
        return;
      }
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname);
        return;
      }
      serveStatic(request, response, url.pathname);
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: "Internal server error." });
    }
  });
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === "IPv4" && !network.internal)
    .map((network) => network.address);
}

function listen(port) {
  const server = createServer();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Slow Index push server: http://localhost:${port}/`);
    getLocalAddresses().forEach((address) => {
      console.log(`Phone on same Wi-Fi: http://${address}:${port}/`);
    });
  });
}

listen(preferredPort);

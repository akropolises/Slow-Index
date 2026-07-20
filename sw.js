self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Micro Slowの時間です", {
      body: data.body || "次の予定の前に、短く整えます。",
      tag: data.proposalId ? `slow-index-${data.proposalId}` : "slow-index-push",
      renotify: false,
      data: {
        proposalId: data.proposalId,
        url: data.url || self.location.origin,
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const proposalId = event.notification.data?.proposalId;
  const url = new URL(event.notification.data?.url || self.location.origin);
  if (proposalId) {
    url.searchParams.set("startSlow", proposalId);
  }

  event.waitUntil(openOrFocusClient(url.toString(), proposalId));
});

async function openOrFocusClient(url, proposalId) {
  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    const clientUrl = new URL(client.url);
    const targetUrl = new URL(url);
    if (clientUrl.origin === targetUrl.origin && clientUrl.pathname === targetUrl.pathname) {
      await client.focus();
      if (proposalId) {
        client.postMessage({
          type: "START_SLOW",
          proposalId,
        });
      }
      return;
    }
  }

  await self.clients.openWindow(url);
}

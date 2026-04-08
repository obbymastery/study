self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawTargetUrl = event.notification.data?.url || "/";
  let targetUrl = "/";

  try {
    const parsedTarget = new URL(rawTargetUrl, self.location.origin);
    if (parsedTarget.origin === self.location.origin) {
      targetUrl = `${parsedTarget.pathname}${parsedTarget.search}${parsedTarget.hash}`;
    }
  } catch {
    targetUrl = "/";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});

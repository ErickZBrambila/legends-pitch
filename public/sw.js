self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let title = "North Legends FC";
  let body = "";
  let url = "/";

  try {
    const data = event.data?.json() ?? {};
    title = data.title ?? title;
    body = data.body ?? body;
    url = data.url ?? url;
  } catch {
    // malformed payload — show a generic notification anyway
  }

  // Keep options minimal for iOS compatibility (badge not supported on iOS web push)
  const options = {
    body,
    icon: "/apple-icon.png",
    data: { url },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error("[sw] showNotification failed:", err);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url === url && "focus" in c);
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});

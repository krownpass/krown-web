// Krown Cafes Portal — Service Worker for Push Notifications

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "Krown", body: event.data.text() };
    }

    const { title = "Krown", body = "", url = "/dashboard", icon = "/krown.png" } = payload;

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            data: { url },
            vibrate: [200, 100, 200],
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/dashboard";
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(url);
            })
    );
});

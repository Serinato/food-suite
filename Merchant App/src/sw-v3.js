// Custom Service Worker V3 - Merchant App
import { precacheAndRoute } from 'workbox-precaching';

// Force immediate activation
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    notification.close();

    // Destination URL from options.data
    const urlToOpen = notification.data?.url || '/?tab=orders';

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // 1. Try to find an existing open window
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin)) {
                    // Send message to switch tab
                    client.postMessage({ type: 'NAVIGATE_TAB', tab: 'ORDERS' });
                    // Focus and return
                    return client.focus();
                }
            }

            // 2. If no window open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// public/sw.js

// 1️⃣ Instalación y activación inmediatas
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// 2️⃣ Solo manejamos los mensajes tipo SHOW_NOTIFICATION
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    // Aseguramos que mostramos la notificación desde aquí
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 3️⃣ Manejo del clic sobre la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ninguna ventana abierta en esa URL, abrimos una nueva
      return clients.openWindow(event.notification.data);
    })
  );
});
// public/sw.js

// 1️⃣ Instalación y activación inmediatas
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// 2️⃣ Manejamos los mensajes tipo SHOW_NOTIFICATION
//    Ahora incorporamos la URL de destino en options.data.url
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const { url, ...restData } = options.data || {};

    // Mostramos la notificación, inyectando la URL en data.url
    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        data: {
          // guardamos la URL para luego abrirla al hacer click
          url: url || null,
          // cualquier otro campo de data que viniera
          ...restData,
        }
      })
    );
  }
});

// 3️⃣ Manejo del clic sobre la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Sacamos la URL que guardamos en data.url
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        // Si ya hay una ventana abierta en esa URL, la enfocamos
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrimos una nueva
      return clients.openWindow(targetUrl);
    })
  );
});

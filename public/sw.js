self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'SommerVibes';
  const options = {
    body: data.body || '',
    tag: data.tag || 'sv-chat',
    data: { url: data.url || '/' },
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager.getSubscription()
      .then(subscription => {
        if (subscription) return subscription;
        return null;
      })
      .catch(() => null)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const windowClient of windows) {
      if ('focus' in windowClient) {
        windowClient.navigate(targetUrl);
        return windowClient.focus();
      }
    }
    return clients.openWindow(targetUrl);
  })());
});

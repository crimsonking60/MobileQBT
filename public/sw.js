// App-shell cache so the installed app opens instantly. Never touches the qBittorrent API.
const CACHE = 'mobileqbt-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    const fetched = fetch(req)
      .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => undefined);
    // pages: network first so updates land immediately; hashed assets: cache first
    if (req.mode === 'navigate') return (await fetched) ?? hit ?? Response.error();
    return hit ?? (await fetched) ?? Response.error();
  })());
});

// Tapping a notification brings the app forward on that torrent.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const hash = e.notification.data && e.notification.data.hash;
  const target = new URL(hash ? `./#/torrent/${hash}` : './', self.registration.scope).href;
  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      if ('focus' in c) { await c.focus(); if ('navigate' in c) await c.navigate(target).catch(() => {}); return; }
    }
    await self.clients.openWindow(target);
  })());
});

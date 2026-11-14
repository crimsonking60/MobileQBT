// App-shell cache so the installed app opens instantly. Never touches the qBittorrent API.
const CACHE = 'mobileqbt-v1';

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

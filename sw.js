const CACHE_NAME = 'sleep-animal-v1';
const ASSETS = [
  '/sleep-animal/',
  '/sleep-animal/index.html',
  '/sleep-animal/css/style.css',
  '/sleep-animal/js/app.js',
  '/sleep-animal/js/i18n.js',
  '/sleep-animal/js/locales/ko.json',
  '/sleep-animal/js/locales/en.json',
  '/sleep-animal/js/locales/ja.json',
  '/sleep-animal/js/locales/zh.json',
  '/sleep-animal/js/locales/hi.json',
  '/sleep-animal/js/locales/ru.json',
  '/sleep-animal/js/locales/es.json',
  '/sleep-animal/js/locales/pt.json',
  '/sleep-animal/js/locales/id.json',
  '/sleep-animal/js/locales/tr.json',
  '/sleep-animal/js/locales/de.json',
  '/sleep-animal/js/locales/fr.json',
  '/sleep-animal/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

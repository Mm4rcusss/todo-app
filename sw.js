const CACHE_NAME = 'tasks-app-v23';
const PRECACHE_URLS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/effects.js',
    './js/backup.js',
    './js/pet.js',
    './manifest.json',
    './favicon.svg',
    './favicon-32.png',
    './icon-192.png',
    './icon-512.png',
    './assets/background.png',
    './assets/pets/cat.gif',
    './assets/pets/slime.gif',
    './assets/pets/bunny.gif',
    './assets/pets/chick.gif',
    './assets/pets/fox.gif'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
        )
    );
    self.clients.claim();
});

function isAppShell(request) {
    const dest = request.destination;
    return dest === 'document' || dest === 'script' || dest === 'style' || dest === '';
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    if (isAppShell(request)) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});

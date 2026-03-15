// ============================================================
// Donkey Kong JS - Service Worker for Asset Caching
// Provides CDN-like performance with offline capability
// ============================================================

const CACHE_NAME = 'donkey-kong-v1.0.0';
const ASSETS_TO_CACHE = [
    '/',
    '/web/index.html',
    '/web/game.js',
    '/web/renderer.js',
    '/web/audio.js',
    '/web/util.js',
    '/web/jumpman.js',
    '/web/kong.js',
    '/web/mobs.js',
    '/web/api.js',
    '/web/wallet.js',
    '/web/chat.js',
    '/web/transactions.js',
    '/web/responsive.js',
    '/web/tutorial.js',
    '/assets/sprites/kong.png',
    '/assets/sprites/mario.png',
    '/assets/sprites/objects.png',
    '/assets/sprites/pauline.png',
    '/assets/sprites/kong.json',
    '/assets/sprites/mario.json',
    '/assets/sprites/objects.json',
    '/assets/sprites/pauline.json',
    '/assets/anims/kong.json',
    '/assets/anims/mario.json',
    '/assets/anims/objects.json',
    '/assets/anims/pauline.json',
    '/assets/maps/arcade.json',
    '/assets/images/board-barrels.png',
    '/assets/images/board-conveyors.png',
    '/assets/images/board-elevators.png',
    '/assets/images/board-rivets.png',
    '/assets/fonts/PressStart2P.ttf'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('[Service Worker] Cache failed:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip API calls and WebSocket connections
    if (url.pathname.startsWith('/api/') || 
        url.protocol === 'ws:' || 
        url.protocol === 'wss:' ||
        url.hostname.includes('supabase') ||
        url.hostname.includes('solana')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetchAndCache(request);
                    return cachedResponse;
                }
                // Not in cache, fetch from network
                return fetchAndCache(request);
            })
            .catch(() => {
                // Network failed, try cache as fallback
                return caches.match(request);
            })
    );
});

function fetchAndCache(request) {
    return fetch(request)
        .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
                return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });

            return response;
        });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                return self.clients.matchAll();
            }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'CACHE_CLEARED' });
                });
            })
        );
    }
});

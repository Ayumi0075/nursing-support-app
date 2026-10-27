// Service Worker for 看護業務支援システム PWA
const CACHE_NAME = 'nursing-care-ai-v2';
const ASSETS_TO_CACHE = [
  './',
  './看護業務支援アプリ_モバイル版.html',
  './看護業務支援アプリ.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
];

// インストール時にコアアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('一部のアセットキャッシュに失敗:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// アクティベーション時に古いキャッシュを整理
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先、失敗時にキャッシュから応答 (Network-First with Cache Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 外部APIやChatGPT等のURLはキャッシュせず素通り
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // ナビゲーションリクエストの場合はメインHTMLを返す
          if (event.request.mode === 'navigate') {
            return caches.match('./看護業務支援アプリ_モバイル版.html');
          }
        });
      })
  );
});

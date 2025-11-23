const ASSETS = [
  "./",
  "./index.html",
  "./assets/index-B8Db9IO7.js",
  "./assets/index-COmTSWHa.css",
  "./sipeed.ico",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
const CACHE_NAME = `nanokvm-usb-cache-${hashAssetList(ASSETS)}`;

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return undefined;
          })
        )
      ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        const responseClone = response.clone();
        if (event.request.method === "GET" && response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = (await caches.match(request)) ?? (await caches.match("./index.html"));
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

function hashAssetList(assets) {
  let hash = 2166136261;
  for (const asset of assets) {
    for (let i = 0; i < asset.length; i += 1) {
      hash ^= asset.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0).toString(16);
}

// TODO: Base the cache name off the app version and commit hash
const CACHE_NAME = "wordle-clone-v1.4.0-rev6";

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(resources);
};

const putInCache = async (request, response) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
};

const cacheFirst = async (request, event) => {
    const cache = await caches.open(CACHE_NAME);
    const responseFromCache = await cache.match(request);
    if (responseFromCache) {
        if (responseFromCache.ok) {
            return responseFromCache;
        }
    }
    const responseFromNetwork = await fetch(request);
    event.waitUntil(putInCache(request, responseFromNetwork.clone()));
    return responseFromNetwork;
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache([
            "/",
            "/index.html",
            "/src/index.js",
            "/CHANGELOG.html"
            // TODO: Add all other assets here?
        ]),
    )
});

self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        // This cache does not match the current version, delete
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(cacheFirst(event.request, event));
});

self.addEventListener("message", (event) => {
    console.log("message received", event);
    if (event.data === "skipWaiting") {
        self.skipWaiting();
    }
});

// TODO: Base the cache name off the app version and commit hash
const CACHE_NAME = "wordle-clone-v1.4.0";

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

self.addEventListener("fetch", (event) => {
    event.respondWith(cacheFirst(event.request, event));
});

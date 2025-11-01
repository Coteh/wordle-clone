const VERSION_NUMBER = '1.4.0';
const COMMIT_HASH = '<commit hash>';
const REVISION = '0';
const CACHE_NAME = `wordle-clone-v${VERSION_NUMBER}-${COMMIT_HASH}-${REVISION}`;

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
            "/CHANGELOG.html",
            "/config.json",
            "/images/rotate-device.png",
            "/vendor/dialog-polyfill.css",
            "/words.txt",
            "/index.css",
            "/src/index.js",
            "/src/share/index.js",
            "/src/share/browser.js",
            "/src/storage/index.js",
            "/src/storage/browser.js",
            "/src/consts.js",
            "/src/datetime.js",
            "/src/dialogManager.js",
            "/src/game.js",
            "/src/preferences.js",
            "/src/render.js",
            "/vendor/snow.js",
            "/vendor/dialog-polyfill.js",
            "/vendor/feather.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/mobile-detect/1.4.5/mobile-detect.min.js",
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

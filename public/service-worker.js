// Choose a cache name
let cacheName = "bento-v5"
// List the files to precache
const precacheResources = []

self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(cacheName).then(cache => cache.addAll(precacheResources))
	)
})

self.addEventListener("activate", event => {})

self.addEventListener("fetch", event => {
	event.respondWith(
		fetch(event.request).catch(() => caches.match(event.request))
	)
})

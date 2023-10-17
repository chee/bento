// Choose a cache name
let cacheName = "bento-v5"
// List the files to precache
const precacheResources = [
	"/",
	"/db.js",
	"/font.ttf",
	"/graphics.js",
	"/index.html",
	"/iosevka-rabbits-regular.ttf",
	"/memory.js",
	"/offline.js",
	"/operator.worklet.js",
	"/sounds.js",
	"/stylesheet.css",
	"/ui.js",
	"/unmute.js",
	"/waveform.worker.js",
	"/sounds/skh.wav",
	"/sounds/skk.wav",
	"/sounds/sko.wav",
	"/sounds/sks.wav",
	"/sounds/tkh.wav",
	"/sounds/tkk.wav",
	"/sounds/tko.wav",
	"/sounds/tks.wav",
]

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

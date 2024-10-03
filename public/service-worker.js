/// <reference types="@secret-types/serviceworker" />
// update this when changing the service worker
const SERVICE_WORKER_VERSION = "v18"

const addResourcesToCache = async resources => {
	const cache = await caches.open(SERVICE_WORKER_VERSION)
	await cache.addAll(resources)
}

self.addEventListener("install", event => {
	self.skipWaiting()
	// event.waitUntil(
	// addResourcesToCache([
	// "/404.html",
	// "/app.webmanifest",
	// "/aux/apple-touch-icon.png",
	// "/aux/fonts/font.ttf",
	// "/aux/fonts/fs.woff",
	// "/aux/fonts/iosevka-qp-light.ttf",
	// "/aux/fonts/iosevka-qp-regular.ttf",
	// "/aux/fonts/iosevka-rabbits-light.ttf"
	// "/aux/fonts/iosevka-rabbits-regular.ttf",
	// "/aux/icons/bento-monochrome.png",
	// "/aux/icons/bento.svg",
	// "/aux/icons/maskable_icon.png",
	// "/aux/iphone-silence.flac",
	// "/aux/kits/casio/a.flac",
	// "/aux/kits/casio/b.flac",
	// "/aux/kits/casio/c.flac",
	// "/aux/kits/casio/d.flac"
	// "/bento.js",
	// "/convenience/extend-native-prototypes.js",
	// "/convenience/loop.js",
	// "/db/db.js",
	// "/db/db.worker.js",
	// "/db/share.js",
	// "/elements/base.js",
	// "/elements/bento-elements.js",
	// "/elements/box.css",
	// "/elements/box.js",
	// "/elements/control-strip.css",
	// "/elements/controls/button.css",
	// "/elements/controls/button.js",
	// "/elements/controls/control.js",
	// "/elements/controls/controls.js",
	// "/elements/controls/flip.css",
	// "/elements/controls/layer-type-selector.css",
	// "/elements/controls/loop-selector.css",
	// "/elements/controls/popout-grid.css",
	// "/elements/controls/popout.css",
	// "/elements/controls/popout.js",
	// "/elements/controls/record.css",
	// "/elements/controls/speed-selector.css",
	// "/elements/grid-controls.css",
	// "/elements/grid-controls.js",
	// "/elements/grid-selector.css",
	// "/elements/grid-selector.js",
	// "/elements/grid.css",
	// "/elements/grid.js",
	// "/elements/layer-options.css",
	// "/elements/layer-selector-choice.css",
	// "/elements/layer-selector-choice.js",
	// "/elements/layer-selector.css",
	// "/elements/layer-selector.js",
	// "/elements/machine.js",
	// "/elements/master-controls.css",
	// "/elements/master-controls.js",
	// "/elements/minigrid.css",
	// "/elements/minigrid.js",
	// "/elements/nav.css",
	// "/elements/nav.js",
	// "/elements/party.js",
	// "/elements/screen-controls.css",
	// "/elements/screen-controls.js",
	// "/elements/screen-selector.css",
	// "/elements/screen-selector.js",
	// "/elements/screen.css",
	// "/elements/screen.js",
	// "/elements/settings.css",
	// "/elements/settings.js",
	// "/elements/tape.css",
	// "/elements/tape.js",
	// "/favicon.ico",
	// "/graphics/constants.js",
	// "/graphics/graphics.js",
	// "/graphics/graphics.worker.js",
	// "/icons.js",
	// "/index.html",
	// "/info.html",
	// "/io/ask.js",
	// "/io/data-transfer.js",
	// "/io/modmask.js",
	// "/log.text",
	// "/loop.js",
	// "/memory/constants.js",
	// "/memory/convert.js",
	// "/memory/memory.js",
	// "/memory/migrations.js",
	// "/memory/tree/grid.js",
	// "/memory/tree/layer.js",
	// "/memory/tree/sound.js",
	// "/memory/tree/step.js",
	// "/memory/tree/tree.js",
	// "/sounds/effects/delay.js",
	// "/sounds/effects/dj-filter.js",
	// "/sounds/effects/effect.js",
	// "/sounds/node.js",
	// "/sounds/quietparty.audioworklet.js",
	// "/sounds/quietparty.js",
	// "/sounds/sampler.audioworklet.js",
	// "/sounds/scale.js",
	// "/sounds/sounds.js",
	// "/sounds/sources/passthru.js",
	// "/sounds/sources/source.js",
	// "/sounds/sources/synth.js",
	// "/sounds/transport.audioworklet.js",
	// "/stylesheet.css"
	// ])
	// )
})

const putInCache = async (request, response) => {
	const cache = await caches.open(SERVICE_WORKER_VERSION)
	await cache.put(request, response)
}

const cacheFirst = async ({request, preloadResponsePromise = null}) => {
	const cache = await caches.open(SERVICE_WORKER_VERSION)
	const responseFromCache = await cache.match(request)
	if (responseFromCache) {
		return responseFromCache
	}
	// const preloadResponse = await preloadResponsePromise
	// if (preloadResponse) {
	// 	console.info("using preload response", preloadResponse)
	// 	putInCache(request, preloadResponse.clone())
	// 	return preloadResponse
	// }

	try {
		const responseFromNetwork = await fetch(request)
		if (responseFromNetwork.status == 200) {
			putInCache(request, responseFromNetwork.clone())
		}
		return responseFromNetwork
	} catch (error) {
		return new Response(
			"im sorry :( something went wrong and i have no idea what or why. please email me problems@chee.party",
			{
				status: 408,
				headers: {"Content-Type": "text/plain"}
			}
		)
	}
}

self.addEventListener("fetch", event => {
	event.respondWith(
		cacheFirst({
			request: event.request
			// preloadResponsePromise: event.preloadResponse
		})
	)
})

// const enableNavigationPreload = async () => {
// 	if (self.registration?.navigationPreload) {
// 		await self.registration.navigationPreload.enable()
// 	}
// }

// self.addEventListener("activate", event => {
// 	event.waitUntil(enableNavigationPreload())
// })

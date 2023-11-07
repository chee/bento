import * as sounds from "./sounds/sounds.js"
import * as graphics from "./graphics/graphics.js"
import {
	MemoryTree,
	size as MEMORY_SIZE,
	map,
	grid2layer,
	step2layerStep
} from "./memory/memory.js"
import * as db from "./db/db.js"
import Ask from "./io/ask.js"

let sharedarraybuffer = new SharedArrayBuffer(MEMORY_SIZE)

class BentoState extends MemoryTree {
	/** @param {ArrayBufferLike} sharedarraybuffer */
	constructor(sharedarraybuffer) {
		super(map(sharedarraybuffer))
	}
}

let memtree = new BentoState(sharedarraybuffer)
let party = document.querySelector("bento-party")
let ask = new Ask(document.querySelector("dialog"))

let fancyListeners = ["keydown", "click", "touchstart"]

if (history.scrollRestoration) {
	history.scrollRestoration = "manual"
}

async function getFancy() {
	if (party.fancy) {
		return
	}
	try {
		if (!db.fancy()) {
			await db.load()
			if (sounds.empty()) {
				await sounds.loadDefaultKit()
			}
		}
		if (!sounds.fancy()) {
			await sounds.start()
		}

		if (sounds.fancy() && !graphics.fancy()) {
			graphics.start(sharedarraybuffer)
		}

		if (sounds.fancy() && graphics.fancy() && db.fancy()) {
			party.fancy = true
		}
	} catch {}

	if (party.fancy) {
		if (!party.isSettingsOpen()) {
			setTimeout(() => {
				party.openScreen()
			}, 200)
		}
		let slug = db.slugify(db.getSlugFromLocation())
		history.replaceState(
			{slug},
			"",
			slug == "bento"
				? "/" + location.search
				: `/patterns/${slug}/` + location.search
		)
		party.slug = slug
	}
}

fancyListeners.map(name =>
	window.addEventListener(name, getFancy, {
		passive: true
	})
)

async function init() {
	await db.init(sharedarraybuffer)
	await graphics.init()
	await sounds.init(sharedarraybuffer)
}

await init()
getFancy()

party.hark("play", () => {
	memtree.play()
	// todo base this on memtree.update() in sounds.js
	sounds.play()
})

party.hark("pause", () => {
	memtree.pause()
	sounds.pause()
})

party.hark("stop", () => {
	memtree.stop()
	sounds.pause()
})

party.hark("set-bpm", message => {
	memtree.bpm = message.value
	// todo base these saves on memtree.update() in db.js
	db.save()
})

party.hark("select-layer", message => {
	memtree.selectedLayer = message.layer.index
})

party.hark("update-grid", message => {
	memtree.setGridValue(message.grid.index, message.property, message.value)
	db.save()
})

party.hark("select-grid", message => {
	memtree.setLayerValue(
		message.grid.layer,
		"selectedGrid",
		message.grid.indexInLayer
	)
	db.save()
})

party.hark("copy-grid", message => {
	// let {from, to} = message
	// memtree.copyGrid(memtree.selectedLayer, from, to)
})

party("toggle-grid", message => {
	memtree.toggleGrid(message.grid.index)
})

party("start-recording", async () => {
	// todo stopPropagation in party:)
	// if (party.hasAttribute("recording")) {
	// 		return
	// 	}
	//
	party.recording = true
	let audio = await sounds.recordSound()
	memtree.setSound(memtree.selectedLayer, audio)
	db.save()
})

party.hark("set-sound", async message => {
	let audio = await sounds.decode(message.value)
	memtree.setSound(memtree.selectedLayer, audio)
	db.save()
})

party.hark("flip-sound", async message => {
	memtree.setStepValue(message.step.index, "reversed", !message.step.reversed)
	db.save()
})

// party.hark("clip-sound", message => {
// 	let basedOn = message.from
// 	memtree.setStepValue(step.index, "reversed", !step.reversed)
// 	db.save()
// })

// /** @param {Memory.MousePoint} mouse */
// function getMixFromMouse(mouse) {
// 	let pan = Math.round((mouse.x / screen.canvas.width) * 12 - 6)
// 	let quiet = Math.round((mouse.y / screen.canvas.height) * 12)
// 	return {pan, quiet}
// }

// party.hark("mouse", message => {
// 	if (!("screen" in message)) {
// 		return
// 	}
// 	if (message.screen == "wav") {
// 		if (message.type == "start") {
// 			Memory.drawingRegionStart(memory, message.mouse.x)
// 		} else if (message.type == "move") {
// 			Memory.drawingRegionX(memory, message.mouse.x)
// 		} else if (message.type == "end") {
// 			Memory.drawingRegionEnd(memory, message.mouse.x)
// 			db.save()
// 		}
// 	} else if (message.screen == "mix") {
// 		let {pan, quiet} = getMixFromMouse(message.mouse)
// 		let deets = Memory.getSelectedStepDetails(memory)
// 		Memory.stepQuiet(memory, deets.layer, deets.step, quiet)
// 		Memory.stepPan(memory, deets.layer, deets.step, pan)
// 		if (message.type == "end") {
// 			db.save()
// 		}
// 	} else if (message.screen == "key") {
// 		let deets = Memory.getSelectedStepDetails(memory)
// 		Memory.stepPitch(
// 			memory,
// 			deets.layer,
// 			deets.step,
// 			Math.round(
// 				(message.mouse.x / screen.canvas.width) * Memory.NUMBER_OF_KEYS
// 			) -
// 				Memory.NUMBER_OF_KEYS / 2
// 		)
// 		if (message.type == "end") {
// 			db.save()
// 		}
// 	}
// })

party.hark("select-step", message => {
	let step = /** @type {import("./memory/memory.js").Step} */ (message.step)
	memtree.selectedUiStep = step.indexInGrid
})

party.hark("update-step", message => {
	memtree.setStepValue(message.step.index, message.property, message.value)
})

party.hark("turn-step-on", message => {
	memtree.toggleStep(message.step.index, true)
})

party.hark("turn-step-off", message => {
	memtree.toggleStep(message.step.index, false)
})

party.hark("copy-step", message => {
	// memtree.copyStep
})

// else if (message.change == "quieter") {
// 			Memory.stepQuieter(memory, layer, step)
// 			db.save()
// 		} else if (message.change == "louder") {
// 			Memory.stepLouder(memory, layer, step)
// 			db.save()
// 		} else if (message.change == "pan-left") {
// 			Memory.stepPanLeft(memory, layer, step)
// 			db.save()
// 		} else if (message.change == "pan-right") {
// 			Memory.stepPanRight(memory, layer, step)
// 			db.save()
// 		} else if (message.change == "reverse") {
// 			Memory.stepReverse(memory, layer, step)
// 			db.save()
// 		}

window.onmessage = function (event) {
	let message = event.data
	if (message.type == "recording") {
		let recording = event.data.recording
		party.toggleAttribute("recording", recording)
		party.recording = true
		party.recordingLength = event.data.length
		document.dispatchEvent(new CustomEvent("recording", {detail: message}))
	}
}

let stepWaveformCanvas = document.createElement("canvas")
// todo maybe keep this in the bento grid?
// maybe all this?
let stepWaveformUrlCache = {}
document.addEventListener(
	"waveform",
	/**
	 * @param {CustomEvent & {detail: {imageData: ImageData}}} event
	 */
	async ({detail}) => {
		/** @type {ImageBitmap} */
		let bmp = detail.bmp
		let {layer, uiStep, grid, cachename} = detail
		if (layer != memtree.selectedLayer) return
		if (grid != memtree.getSelectedLayer().selectedGrid) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height

		// does i need to make a state tree that combines values from memtree to
		// create a single state tree?
		// let box = boxes[uiStep]
		// if (!stepWaveformUrlCache[cachename]) {
		// 	let context = stepWaveformCanvas.getContext("bitmaprenderer")
		// 	context.transferFromImageBitmap(bmp)
		// 	stepWaveformUrlCache[cachename] =
		// 		stepWaveformCanvas.toDataURL("image/webp")
		// }

		// box.wav = stepWaveformUrlCache[cachename]
	}
)

// todo move below to some kind of machine/settings.js

machine.addEventListener("toggle-settings", () => {
	settings.open = !settings.open
	setTimeout(() => {
		screen.open = !settings.open
	})
})

function openScreen() {
	settings.open = false
	screen.open = true
}

screen.hark("screen", openScreen)
screen.hark("open", openScreen)
layerSelector.addEventListener("click", openScreen)
grid.addEventListener("click", openScreen)

settings.addEventListener("reset", async () => {
	let ok = await ask.confirm(
		"this will delete the current pattern from your disk FOREVER. ok?"
	)

	if (ok) {
		await db.reset()
		location.reload()
	}
})

addEventListener("popstate", async () => {
	let slug = history.state?.slug || "bento"
	await db.load(slug)
	nav.slug = slug
})

async function saveAs(/** @type {string} */ name) {
	if (!name) {
		name = await ask.prompt("enter a name")
	}
	if (name) {
		let slug = db.slugify(name)
		if (slug == db.getSlugFromLocation()) {
			await ask.alert(
				`you are looking at ${slug} right now!<br> bento autosaves btw`
			)
			return
		}
		if (slug) {
			if (await db.exists(slug)) {
				let ok = ask.confirm(
					`already pattern called ${slug}. this wil overwrite. ok?`
				)
				if (!ok) {
					return saveAs(name)
				}
			}
			db.save(slug)

			history.pushState(
				{slug},
				"",
				slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
			)
			nav.slug = slug
			screen.open = true
			settings.open = false
		}
	}
}

async function loadPattern() {
	let names = await db.getPatternNames()
	let slug = await ask.select(
		"select a pattern",
		...names.map(n => n.toString())
	)
	if (slug) {
		await db.load(slug)
		history.pushState(
			{slug},
			"",
			slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
		)
		nav.slug = slug
		screen.open = true
		settings.open = false
	}
}

async function renamePattern() {
	let currentSlug = db.getSlugFromLocation()
	await saveAs()
	db.reset(currentSlug)
}

async function newPattern() {
	let slug = db.generateRandomSlug()
	history.pushState(
		{slug},
		"",
		slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
	)
	await db.load(slug)
	await sounds.loadDefaultKit()
	nav.slug = slug
	screen.open = true
	settings.open = false
}

settings.addEventListener("load-pattern", async () => {
	await loadPattern()
})

settings.addEventListener("save-as", async () => {
	await saveAs()
})

settings.addEventListener("new-pattern", async () => {
	await newPattern()
})

settings.addEventListener("rename-pattern", async () => {
	await renamePattern()
})

let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	root.setAttribute(flag, value)
}

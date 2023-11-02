import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as db from "./db.js"
import Ask from "./ask.js"

/** @type {import("./bento-elements/bento-elements.js").BentoElement} */
let party = document.querySelector("bento-party")
let root = document.documentElement
let themeObserver = new MutationObserver(changes => {
	for (let change of changes) {
		if (change.type == "attributes") {
			if (change.attributeName == "theme") {
				party.announce("theme", root.getAttribute("theme"))
			}
		}
	}
})
themeObserver.observe(root, {
	attributes: true,
	attributeFilter: ["theme"]
})
// TODO move non ui stuff to, like, start.js
let machine = document.querySelector("bento-machine")
/** @type {import("./bento-elements/bento-elements.js").BentoMasterControls} */
let master = document.querySelector("bento-master-controls")
/** @type {import("./bento-elements/bento-elements.js").BentoNav} */
let nav = document.querySelector("bento-nav")
/** @type {import("./bento-elements/bento-elements.js").BentoLayerSelector} */
let layerSelector = machine.querySelector("bento-layer-selector")
/** @type {import("./bento-elements/bento-elements.js").BentoLayerOptions} */
let layerOptions = machine.querySelector("bento-layer-options")
/** @type {import("./bento-elements/bento-elements.js").BentoGrid} */
let grid = machine.querySelector("bento-grid")
let boxes = grid.boxes
/** @type {import("./bento-elements/bento-elements.js").BentoGridSelector} */
let gridSelector = machine.querySelector("bento-grid-selector")

/** @type {import("./bento-elements/bento-elements.js").BentoScreen} */
let screen = machine.querySelector("bento-screen")
/** @type {import("./bento-elements/bento-elements.js").BentoSettings} */
let settings = machine.querySelector("bento-settings")
/** @type {import("./bento-elements/bento-elements.js").BentoTape} */
let tape = party.querySelector("bento-tape")
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)
let dialog = /** @type {HTMLDialogElement} */ (
	document.getElementById("dialog")
)

let ask = new Ask(dialog)

root.removeAttribute("loading")

let fancyListeners = ["keydown", "click", "touchstart"]

if (history.scrollRestoration) {
	history.scrollRestoration = "manual"
}

async function getFancy() {
	if (party.hasAttribute("fancy")) {
		return
	}
	try {
		if (!sounds.fancy()) {
			await sounds.start()
		}

		if (sounds.fancy() && !graphics.fancy()) {
			graphics.start(screen.canvas, buffer)
		}

		if (sounds.fancy() && graphics.fancy() && !db.fancy()) {
			await db.load()
			if (sounds.empty()) {
				await sounds.loadDefaultKit()
			}
		}

		if (sounds.fancy() && graphics.fancy() && db.fancy()) {
			party.setAttribute("fancy", "fancy")
		}
	} catch {}

	if (party.hasAttribute("fancy")) {
		if (!settings.open) {
			setTimeout(() => {
				screen.open = true
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
		nav.slug = slug
	}
}

fancyListeners.map(name =>
	window.addEventListener(name, getFancy, {
		passive: true
	})
)

async function init() {
	await db.init(buffer)
	await graphics.init()
	await sounds.init(buffer)
}

function update(_frame = 0) {
	let selectedLayer = Memory.selectedLayer(memory)
	let bpm = Memory.bpm(memory)
	master.bpm = bpm
	master.toggleAttribute("playing", Memory.playing(memory))
	master.toggleAttribute("paused", Memory.paused(memory))
	layerSelector.selected = selectedLayer
	layerOptions.speed = Memory.layerSpeed(memory, selectedLayer)
	// layerOptions.length = Memory.numberOfStepsInGrid(memory, selectedLayer)

	let selectedUiStep = Memory.selectedUiStep(memory)
	let selectedGrid = Memory.layerSelectedGrid(memory, selectedLayer)
	let currentStep = Memory.currentStep(memory, selectedLayer)
	gridSelector.selected = selectedGrid
	gridSelector.grids = Memory.getLayerGridStepOns(memory, selectedLayer)
	gridSelector.playing = currentStep

	loop.gridSteps(uiStep => {
		/*
		 * okay so there is the UI step which is always 0x0 to 0xf
		 * and then the actual step which is 0x0 to 0x40
		 * this is so confusing i'm crying my eyes out
		 */
		let actualStep = selectedGrid * Memory.STEPS_PER_GRID + uiStep

		let box = boxes[uiStep]
		box.selected = uiStep == selectedUiStep
		box.on = Memory.stepOn(memory, selectedLayer, actualStep)
		// todo move playing to be a number property of the grid
		box.playing = currentStep == actualStep
		box.quiet = Memory.stepQuiet(memory, selectedLayer, actualStep)
		box.pan = Memory.stepPan(memory, selectedLayer, actualStep)
	})

	loop.grids(gidx => {
		gridSelector.toggle(gidx, Memory.gridOn(memory, selectedLayer, gidx))
		grid.on = Memory.gridOn(memory, selectedLayer, selectedGrid)
	})

	requestAnimationFrame(update)
}

await init()
getFancy()
update()

master.addEventListener("play", () => {
	Memory.play(memory)
	sounds.play()
})

master.addEventListener("pause", () => {
	Memory.pause(memory)
	sounds.pause()
})

master.addEventListener("stop", () => {
	Memory.stop(memory)
	sounds.pause()
})

master.addEventListener(
	"change",
	/** @param {import("./bento-elements/base.js").BentoEvent} event */
	event => {
		if (event.detail.change == "bpm") {
			Memory.bpm(memory, event.detail.value)
			db.save()
		}
	}
)

layerSelector.addEventListener(
	"change",
	/** @param {import("./bento-elements/base.js").BentoEvent} event */
	event => {
		if (event.detail.change == "layer") {
			Memory.selectedLayer(memory, event.detail.value)
		}
	}
)

layerOptions.addEventListener(
	"change",
	/** @param {import("./bento-elements/base.js").BentoEvent} event */
	event => {
		let {change, value} = event.detail
		if (change == "speed") {
			Memory.layerSpeed(memory, Memory.selectedLayer(memory), value)
			db.save()
		} else if (change == "length") {
			Memory.numberOfStepsInGrid(memory, Memory.selectedLayer(memory), value)
			db.save()
		}
	}
)

gridSelector.addEventListener(
	"change",
	/** @param {import("./bento-elements/base.js").BentoEvent} event */
	event => {
		let {change, value} = event.detail
		if (change == "grid") {
			Memory.layerSelectedGrid(memory, Memory.selectedLayer(memory), value)
			db.save()
		}
		if (change == "copy") {
			let {from, minigrid: to} = event.detail
			Memory.copyGridWithinSelectedLayer(memory, +from, +to)
			Memory.layerSelectedGrid(memory, Memory.selectedLayer(memory), +to)
			db.save()
		}
	}
)

gridSelector.addEventListener(
	"toggle",
	/** @param {import("./bento-elements/base.js").BentoEvent} event */
	event => {
		let {toggle, value} = event.detail
		if (toggle == "grid") {
			let selectedLayer = Memory.selectedLayer(memory)
			Memory.toggleGrid(memory, selectedLayer, +value)
			db.save()
		}
	}
)

layerOptions.addEventListener(
	"record",
	/** @param {import("./bento-elements/base.js").BentoEvent} _event */
	async _event => {
		if (party.hasAttribute("recording")) {
			return
		}
		party.setAttribute("recording", "recording")
		let audio = await sounds.recordSound()
		sounds.setSound(memory, Memory.selectedLayer(memory), audio)
		db.save()
	}
)

screen.addEventListener(
	"change",
	/** @param {import("./bento-elements/bento-elements.js").BentoEvent} event */
	async event => {
		if (event.detail.change == "sound") {
			sounds.setSound(
				memory,
				Memory.selectedLayer(memory),
				await sounds.decode(event.detail.file)
			)
			db.save()
		} else if (event.detail.change == "reverse") {
			let layer = Memory.selectedLayer(memory)
			Memory.stepReverse(memory, layer, Memory.getActualSelectedStep(memory))
			db.save()
		}
	}
)

screen.addEventListener("commit-sound", event => {
	let {step} = event.detail
	Memory.trimSelectedLayerSoundToStepRegion(memory, step)
})

grid.addEventListener(
	"change",
	// todo? BentoChangeEvent?
	/** @param {import("./bento-elements/bento-elements.js").BentoEvent} event */
	event => {
		let {box, change} = event.message
		if (box != null) {
			let layer = Memory.selectedLayer(memory)
			let selectedGrid = Memory.layerSelectedGrid(memory, layer)
			let uiStep = box
			let step = selectedGrid * Memory.STEPS_PER_GRID + uiStep
			if (change == "selected") {
				Memory.selectedUiStep(memory, uiStep)
			} else if (change == "on") {
				Memory.stepOn(memory, layer, step, true)
				db.save()
			} else if (change == "off") {
				Memory.stepOn(memory, layer, step, false)
				db.save()
			} else if (change == "copy") {
				let {from} = event.detail
				Memory.copyStepWithinSelectedLayerAndGrid(memory, +from, +uiStep)
				Memory.selectedUiStep(memory, +uiStep)
				db.save()
			} else if (change == "quieter") {
				Memory.stepQuieter(memory, layer, step)
				db.save()
			} else if (change == "louder") {
				Memory.stepLouder(memory, layer, step)
				db.save()
			} else if (change == "pan-left") {
				Memory.stepPanLeft(memory, layer, step)
				db.save()
			} else if (change == "pan-right") {
				Memory.stepPanRight(memory, layer, step)
				db.save()
			} else if (change == "reverse") {
				Memory.stepReverse(memory, layer, step)
				db.save()
			}
		}
	}
)

/**
 * Handle messages from my friends
 * TODO window.dispatchEvent?
 * @param {MessageEvent} event
 */
window.onmessage = function (event) {
	let message = event.data
	if (message.type == "recording") {
		let recording = event.data.recording
		party.toggleAttribute("recording", recording)
		document.dispatchEvent(new CustomEvent("recording", {detail: message}))
		tape.length = event.data.length
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
		if (layer != Memory.selectedLayer(memory)) return
		if (grid != Memory.layerSelectedGrid(memory, layer)) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height

		let box = boxes[uiStep]
		if (!stepWaveformUrlCache[cachename]) {
			let context = stepWaveformCanvas.getContext("bitmaprenderer")
			context.transferFromImageBitmap(bmp)
			stepWaveformUrlCache[cachename] =
				stepWaveformCanvas.toDataURL("image/webp")
		}

		box.wav = stepWaveformUrlCache[cachename]
	}
)

machine.addEventListener("toggle-settings", event => {
	settings.open = !settings.open
	setTimeout(() => {
		screen.open = !settings.open
	})
})

function openScreen() {
	settings.open = false
	screen.open = true
}

screen.addEventListener("screen", openScreen)
screen.addEventListener("open", openScreen)
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
			await db.save(slug)

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

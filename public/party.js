import * as sounds from "./sounds/sounds.js"
import * as graphics from "./graphics/graphics.js"
import * as Memory from "./memory/memory.js"
import * as loop from "./convenience/loop.js"
import * as db from "./db/db.js"
import Ask from "./io/ask.js"

/** @type {import("./elements/bento-elements.js").BentoElement} */
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

let machine = document.querySelector("bento-machine")
/** @type {import("./elements/bento-elements.js").BentoMasterControls} */
let master = document.querySelector("bento-master-controls")
/** @type {import("./elements/bento-elements.js").BentoNav} */
let nav = document.querySelector("bento-nav")
/** @type {import("./elements/bento-elements.js").BentoLayerSelector} */
let layerSelector = machine.querySelector("bento-layer-selector")
/** @type {import("./elements/bento-elements.js").BentoLayerOptions} */
let layerOptions = machine.querySelector("bento-layer-options")
/** @type {import("./elements/bento-elements.js").BentoGrid} */
let grid = machine.querySelector("bento-grid")
let boxes = grid.boxes
/** @type {import("./elements/bento-elements.js").BentoGridSelector} */
let gridSelector = machine.querySelector("bento-grid-selector")

/** @type {import("./elements/bento-elements.js").BentoScreen} */
let screen = machine.querySelector("bento-screen")
/** @type {import("./elements/bento-elements.js").BentoSettings} */
let settings = machine.querySelector("bento-settings")
/** @type {import("./elements/bento-elements.js").BentoTape} */
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
			graphics.start(buffer)
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
	let selectedLayerDetails = Memory.getSelectedLayerDetails(memory)
	let bpm = Memory.bpm(memory)
	master.bpm = bpm
	master.toggleAttribute("playing", Memory.playing(memory))
	master.toggleAttribute("paused", Memory.paused(memory))
	layerSelector.selected = selectedLayerDetails.layer
	layerOptions.speed = Memory.layerSpeed(memory, selectedLayerDetails.speed)
	// layerOptions.length = Memory.numberOfStepsInGrid(memory, selectedLayer)
	screen.layerType = selectedLayerDetails.type

	let selectedUiStep = Memory.selectedUiStep(memory)
	let selectedGrid = selectedLayerDetails.selectedGrid
	let currentStep = selectedLayerDetails.currentStep
	gridSelector.selected = selectedGrid
	gridSelector.grids = Memory.getLayerGridStepOns(
		memory,
		selectedLayerDetails.layer
	)

	loop.gridSteps(uiStep => {
		/*
		 * okay so there is the UI step which is always 0x0 to 0xf
		 * and then the actual step which is 0x0 to 0x40
		 * this is so confusing i'm crying my eyes out
		 */
		let actualStep = selectedGrid * Memory.STEPS_PER_GRID + uiStep

		let box = boxes[uiStep]
		box.selected = uiStep == selectedUiStep
		box.on = Memory.stepOn(memory, selectedLayerDetails.layer, actualStep)
		// todo move playing to be a number property of the grid
		box.playing = currentStep == actualStep
		box.quiet = Memory.stepQuiet(
			memory,
			selectedLayerDetails.layer,
			actualStep
		)
		box.pan = Memory.stepPan(memory, selectedLayerDetails.layer, actualStep)
	})

	loop.grids(gidx => {
		gridSelector.toggle(
			gidx,
			Memory.gridOn(memory, selectedLayerDetails.layer, gidx)
		)
		grid.on = Memory.gridOn(memory, selectedLayerDetails.layer, selectedGrid)
	})

	// follow mode
	// if (Memory.playing(memory) && !Memory.paused(memory)) {
	// 	let layer = selectedLayerDetails.layer
	// 	let step = Memory.getCurrentStepDetails(memory, layer)
	// 	Memory.selectedUiStep(memory, step.uiStep)
	// 	Memory.layerSelectedGrid(memory, layer, step.grid)
	// }

	requestAnimationFrame(update)
}

await init()
getFancy()
update()

master.hark("play", () => {
	Memory.play(memory)
	sounds.play()
})

master.hark("pause", () => {
	Memory.pause(memory)
	sounds.pause()
})

master.hark("stop", () => {
	Memory.stop(memory)
	sounds.pause()
})

master.hark("change", message => {
	if (message.change == "bpm") {
		Memory.bpm(memory, message.value)
		db.save()
	}
})

layerSelector.hark("change", message => {
	if (message.change == "layer") {
		Memory.selectedLayer(memory, message.value)
	}
})

layerOptions.hark("change", message => {
	if (message.change == "speed") {
		Memory.layerSpeed(memory, Memory.selectedLayer(memory), message.value)
		db.save()
	}
	// else if (message.change == "length") {
	// Memory.numberOfStepsInGrid(memory, Memory.selectedLayer(memory), value)
	// db.save()
	// }
})

gridSelector.hark("change", message => {
	if (message.change == "grid") {
		Memory.layerSelectedGrid(
			memory,
			Memory.selectedLayer(memory),
			message.value
		)
		db.save()
	}
	if (message.change == "copy" && "minigrid" in message) {
		let {from, minigrid: to} = message
		Memory.copyGridWithinSelectedLayer(memory, +from, +to)
		Memory.layerSelectedGrid(memory, Memory.selectedLayer(memory), +to)
		db.save()
	}
})

gridSelector.hark("toggle", message => {
	let {toggle, value} = message
	if (toggle == "grid") {
		let selectedLayer = Memory.selectedLayer(memory)
		Memory.toggleGrid(memory, selectedLayer, +value)
		db.save()
	}
})

layerOptions.hark("record", async () => {
	if (party.hasAttribute("recording")) {
		return
	}
	party.setAttribute("recording", "recording")
	let audio = await sounds.recordSound()
	sounds.setSound(memory, Memory.selectedLayer(memory), audio)
	db.save()
})

screen.hark("change", async message => {
	if (message.change == "sound") {
		sounds.setSound(
			memory,
			Memory.selectedLayer(memory),
			await sounds.decode(message.value)
		)
		db.save()
	} else if (message.change == "reverse") {
		let layer = Memory.selectedLayer(memory)
		Memory.stepReverse(memory, layer, Memory.getActualSelectedStep(memory))
		db.save()
	}
})

screen.hark("commit-sound", message => {
	let {step} = message
	Memory.trimSelectedLayerSoundToStepRegion(memory, step)
})

/** @param {Memory.MousePoint} mouse */
function getMixFromMouse(mouse) {
	let pan = Math.round((mouse.x / screen.canvas.width) * 12 - 6)
	let quiet = Math.round((mouse.y / screen.canvas.height) * 12)
	return {pan, quiet}
}

screen.hark("mouse", message => {
	if (!("screen" in message)) {
		return
	}
	if (message.screen == "wav") {
		if (message.type == "start") {
			Memory.drawingRegionStart(memory, message.mouse.x)
		} else if (message.type == "move") {
			Memory.drawingRegionX(memory, message.mouse.x)
		} else if (message.type == "end") {
			Memory.drawingRegionEnd(memory, message.mouse.x)
			db.save()
		}
	} else if (message.screen == "mix") {
		let {pan, quiet} = getMixFromMouse(message.mouse)
		let deets = Memory.getSelectedStepDetails(memory)
		Memory.stepQuiet(memory, deets.layer, deets.step, quiet)
		Memory.stepPan(memory, deets.layer, deets.step, pan)
		if (message.type == "end") {
			db.save()
		}
	} else if (message.screen == "key") {
		let deets = Memory.getSelectedStepDetails(memory)
		Memory.stepPitch(
			memory,
			deets.layer,
			deets.step,
			Math.round((message.mouse.x / screen.canvas.width) * 16)
		)
		if (message.type == "end") {
			db.save()
		}
	}
})

grid.hark("change", message => {
	if ("box" in message) {
		let layer = Memory.selectedLayer(memory)
		let selectedGrid = Memory.layerSelectedGrid(memory, layer)
		let uiStep = message.box
		let step = selectedGrid * Memory.STEPS_PER_GRID + uiStep
		if (message.change == "selected") {
			Memory.selectedUiStep(memory, uiStep)
		} else if (message.change == "on") {
			Memory.stepOn(memory, layer, step, true)
			db.save()
		} else if (message.change == "off") {
			Memory.stepOn(memory, layer, step, false)
			db.save()
		} else if (message.change == "copy") {
			Memory.copyStepWithinSelectedLayerAndGrid(memory, +message.from, +uiStep)
			Memory.selectedUiStep(memory, +uiStep)
			db.save()
		} else if (message.change == "quieter") {
			Memory.stepQuieter(memory, layer, step)
			db.save()
		} else if (message.change == "louder") {
			Memory.stepLouder(memory, layer, step)
			db.save()
		} else if (message.change == "pan-left") {
			Memory.stepPanLeft(memory, layer, step)
			db.save()
		} else if (message.change == "pan-right") {
			Memory.stepPanRight(memory, layer, step)
			db.save()
		} else if (message.change == "reverse") {
			Memory.stepReverse(memory, layer, step)
			db.save()
		}
	}
})

/**
 * Handle messages from my friends
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

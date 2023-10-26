import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as db from "./db.js"

let party = document.querySelector("bento-party")
// TODO move non ui stuff to, like, start.js
let machine = document.querySelector("bento-machine")
/** @type {import("./bento-elements/bento-elements.js").BentoMasterControls} */
let master = document.querySelector("bento-master-controls")
/** @type {import("./bento-elements/bento-elements.js").BentoLayerSelector} */
let layerSelector = machine.querySelector("bento-layer-selector")
/** @type {import("./bento-elements/bento-elements.js").BentoLayerOptions} */
let layerOptions = machine.querySelector("bento-layer-options")
/** @type {import("./bento-elements/bento-elements.js").BentoGrid} */
let grid = machine.querySelector("bento-grid")
let boxes = grid.boxes
/** @type {import("./bento-elements/bento-elements.js").BentoScreen} */
let screen = machine.querySelector("bento-screen")
/** @type {import("./bento-elements/bento-elements.js").BentoSettings} */
let settings = machine.querySelector("bento-settings")
/** @type {import("./bento-elements/bento-elements.js").BentoTape} */
let tape = party.querySelector("bento-tape")
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)
party.removeAttribute("loading")
setTimeout(() => {
	screen.open = true
})

let fancyListeners = ["keydown", "click", "touchstart"]

async function getFancy() {
	if (!sounds.fancy()) {
		await sounds.start(buffer)
		party.removeAttribute("fancy")
	}
	if (sounds.fancy() && !graphics.fancy()) {
		graphics.start(screen.canvas, buffer)
		party.removeAttribute("fancy")
	}
	if (sounds.fancy() && graphics.fancy() && !db.loaded) {
		db.load()
	}

	if (sounds.fancy() && graphics.fancy()) {
		party.setAttribute("fancy", "fancy")
	}
}

fancyListeners.map(async eventName =>
	window.addEventListener(eventName, getFancy, {
		passive: true
	})
)

async function init() {
	await graphics.init()
	await sounds.init(buffer)
	await db.init(buffer)

	Memory.bpm(memory, master.bpm)
	loop.layers(pidx => {
		Memory.layerSpeed(memory, pidx, 1)
		Memory.layerLength(memory, pidx, 16)
	})

	loop.steps(sidx => {
		let selectedLayer = Memory.selectedLayer(memory)
		Memory.stepOn(memory, selectedLayer, sidx, boxes[sidx].on)
	})
}

function update(_frame = 0) {
	let selectedLayer = Memory.selectedLayer(memory)
	let bpm = Memory.bpm(memory)
	master.bpm = bpm
	master.toggleAttribute("playing", Memory.playing(memory))
	master.toggleAttribute("paused", Memory.paused(memory))
	layerSelector.selected = selectedLayer
	layerOptions.speed = Memory.layerSpeed(memory, selectedLayer)
	// layerOptions.length = Memory.layerLength(memory, selectedLayer)

	let selectedStep = Memory.selectedStep(memory)
	loop.steps(sidx => {
		let box = boxes[sidx]
		box.selected = sidx == selectedStep
		let currentStep = Memory.currentStep(memory, selectedLayer)
		box.playing = sidx == currentStep
		box.on = Memory.stepOn(memory, selectedLayer, sidx)
		box.quiet = Memory.stepQuiet(memory, selectedLayer, sidx)
		box.pan = Memory.stepPan(memory, selectedLayer, sidx)
		// box.hidden = sidx >= layerLength
	})

	requestAnimationFrame(update)
}

await init()
getFancy()
update()

master.addEventListener("play", () => {
	Memory.play(memory)
	// todo check if this is needed
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
			db.save()
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
			Memory.layerLength(memory, Memory.selectedLayer(memory), value)
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
			Memory.stepReverse(
				memory,
				Memory.selectedLayer(memory),
				Memory.selectedStep(memory)
			)
			db.save()
		}
	}
)

grid.addEventListener(
	"change",
	// todo? BentoChangeEvent?
	/** @param {import("./bento-elements/bento-elements.js").BentoEvent} event */
	event => {
		let {box, change} = event.message
		if (box != null) {
			let step = box
			let layer = Memory.selectedLayer(memory)
			if (change == "selected") {
				Memory.selectedStep(memory, step)
			} else if (change == "on") {
				Memory.stepOn(memory, layer, step, true)
				db.save()
			} else if (change == "off") {
				Memory.stepOn(memory, layer, step, false)
				db.save()
			} else if (change == "copy") {
				let {from} = event.detail
				Memory.copyStepWithinSelectedLayer(memory, +from, +step)
				Memory.selectedStep(memory, +step)
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
		let {layer, step, cachename} = detail
		if (layer != Memory.selectedLayer(memory)) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height
		let box = boxes[step]
		if (!stepWaveformUrlCache[cachename]) {
			let context = stepWaveformCanvas.getContext("bitmaprenderer")
			context.transferFromImageBitmap(bmp)
			stepWaveformUrlCache[cachename] =
				stepWaveformCanvas.toDataURL("image/webp")
		}

		box.wav = stepWaveformUrlCache[cachename]
	}
)

machine.addEventListener("settings", event => {
	settings.open = !settings.open
	screen.open = !settings.open
})

screen.addEventListener("screen", event => {
	settings.open = false
	screen.open = true
})

screen.addEventListener("open", event => {
	settings.open = false
	screen.open = true
})

settings.addEventListener("reset", async event => {
	let ok = window.confirm("this will delete the pattern from your disk. ok?")
	if (ok) {
		console.log({ok})
		await db.reset()
		// db.load()
		// console.log("came back")
		location.reload()
	}
})

let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	party.setAttribute(flag, value)
}

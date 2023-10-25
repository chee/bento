import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
// import * as db from "./db.js"

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

let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

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
	// await db.init(buffer)

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
		} else if (change == "length") {
			Memory.layerLength(memory, Memory.selectedLayer(memory), value)
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
		} else if (event.detail.change == "reverse") {
			Memory.stepReverse(
				memory,
				Memory.selectedLayer(memory),
				Memory.selectedStep(memory)
			)
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
			} else if (change == "off") {
				Memory.stepOn(memory, layer, step, false)
			} else if (change == "copy") {
				let {from} = event.detail
				Memory.copyStepWithinSelectedLayer(memory, +from, +step)
				Memory.selectedStep(memory, +step)
			} else if (change == "quieter") {
				Memory.stepQuieter(memory, layer, step)
			} else if (change == "louder") {
				Memory.stepLouder(memory, layer, step)
			} else if (change == "pan-left") {
				Memory.stepPanLeft(memory, layer, step)
			} else if (change == "pan-right") {
				Memory.stepPanRight(memory, layer, step)
			} else if (change == "reverse") {
				Memory.stepReverse(memory, layer, step)
			}
		}
	}
)

let recordingCounterInterval
/**
 * Handle messages from my friends
 * TODO window.dispatchEvent?
 * @param {MessageEvent} event
 */
window.onmessage = function (event) {
	let message = event.data
	let messageElement = document.querySelector(".tape .message")
	let counterElement = document.querySelector(".tape .counter")
	if (message.type == "recording") {
		let recording = event.data.recording

		party.toggleAttribute("recording", recording)
		document.dispatchEvent(new CustomEvent("recording", {detail: message}))
		let length = event.data.length / 1000
		messageElement.textContent = recording
			? `recording ${length | 0} seconds of sound`
			: "recording sound"
		if (recording) {
			counterElement.innerHTML = "<span>•</span>".repeat(length)
			recordingCounterInterval = setInterval(function () {
				counterElement.removeChild(counterElement.lastElementChild)
			}, 1000)
		} else {
			clearInterval(recordingCounterInterval)
		}
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
		if (!box) {
			console.log(step)
			return
		}
		if (!stepWaveformUrlCache[cachename]) {
			let context = stepWaveformCanvas.getContext("bitmaprenderer")
			context.transferFromImageBitmap(bmp)
			stepWaveformUrlCache[cachename] =
				stepWaveformCanvas.toDataURL("image/webp")
		}

		box.wav = stepWaveformUrlCache[cachename]
	}
)

let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	party.setAttribute(flag, value)
}

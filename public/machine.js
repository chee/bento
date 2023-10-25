import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as db from "./db.js"

let party = document.querySelector("bento-party")
// TODO move non ui stuff to, like, start.js
let machine = document.querySelector(".machine")
/** @type {NodeListOf<HTMLInputElement>} */
let layerSelectors = machine.querySelectorAll(".layer-selector input")
/** @type {NodeListOf<HTMLInputElement>} */
let layerSelectorLabels = machine.querySelectorAll(".layer-selector label")
/** @type {import("./bento-elements/bento-elements.js").BentoGrid} */
let grid = machine.querySelector("bento-grid")
let boxes = grid.boxes
/** @type {HTMLSelectElement} */
let speedSelector = machine.querySelector('[name="speed"]')
/** @type {HTMLSelectElement} */
let lengthSelector = machine.querySelector('[name="length"]')
/** @type {HTMLInputElement} */
let bpmInput = machine.querySelector('[name="bpm"]')
/** @type {HTMLInputElement} */
let playButton = machine.querySelector('[name="play"]')
/** @type {HTMLButtonElement} */
let recordButton = machine.querySelector("button.recorder")
/** @type {HTMLElement} */
let screen = machine.querySelector(".screen")
/** @type {HTMLCanvasElement} */
let screenWaveformCanvas = screen.querySelector(".waveform canvas")

let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

let fancyListeners = ["keydown", "click", "touchstart"]

function fancy() {
	return sounds.fancy() && graphics.fancy()
}

async function getFancy() {
	if (!sounds.fancy()) {
		await sounds.start(buffer)
		party.removeAttribute("fancy")
	}
	if (sounds.fancy() && !graphics.fancy()) {
		graphics.start(screenWaveformCanvas, buffer)
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
	graphics.init(screenWaveformCanvas)
	sounds.init(buffer)
	await db.init(buffer)

	Memory.bpm(memory, Number(bpmInput.value))
	loop.layers(pidx => {
		Memory.layerSpeed(memory, pidx, 1)
		Memory.layerLength(memory, pidx, 16)
		if (layerSelectors[pidx].checked) {
			Memory.selectedLayer(memory, pidx)
		}
	})

	loop.steps(sidx => {
		let selectedLayer = Memory.selectedLayer(memory)
		Memory.stepOn(memory, selectedLayer, sidx, boxes[sidx].on)
	})
}

function update(frame = 0) {
	let selectedLayer = Memory.selectedLayer(memory)
	let bpm = Memory.bpm(memory).toString()
	speedSelector.querySelectorAll("option").forEach(option => {
		let label = option.dataset.label || option.value
		let full = bpm + "×" + label

		// why not a span inside? or an attr? for use in a ::before??
		if (option.textContent != full) {
			option.textContent = full
		}
	})

	speedSelector.value = Memory.layerSpeed(memory, selectedLayer).toString()
	let layerLength = Memory.layerLength(memory, selectedLayer)
	lengthSelector.value = layerLength.toString()

	playButton.classList.toggle("playing", Memory.playing(memory))
	if (bpmInput != document.activeElement) {
		bpmInput.value = bpm
	}

	layerSelectors.forEach((layerSelector, index) => {
		layerSelector.checked = index == selectedLayer
		layerSelector.toggleAttribute("checked", index == selectedLayer)
		layerSelector.parentElement.classList.toggle(
			"checked",
			index == selectedLayer
		)
	})

	let selectedStep = Memory.selectedStep(memory)

	loop.steps(sidx => {
		let box = boxes[sidx]
		box.selected = sidx == selectedStep
		let currentStep = Memory.currentStep(memory, selectedLayer)
		box.playing = sidx == currentStep
		box.on = Memory.stepOn(memory, selectedLayer, sidx)
		box.quiet = Memory.stepQuiet(memory, selectedLayer, sidx)
		box.pan = Memory.stepPan(memory, selectedLayer, sidx)
		box.hidden = sidx >= layerLength
	})

	requestAnimationFrame(update)
}

await init()
getFancy()
update()

layerSelectors.forEach((layerSelector, index) => {
	/**
	 * @param {InputEvent} _event
	 */
	layerSelector.addEventListener("change", _event => {
		if (layerSelector.checked) {
			Memory.selectedLayer(memory, index)
		}
	})
})

playButton.addEventListener("click", () => {
	Memory.play(memory)
	sounds.play()
})

machine.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.pause(memory)
	sounds.pause()
})

machine.querySelector('[name="stop"]').addEventListener("click", () => {
	Memory.stop(memory)
	sounds.pause()
})

bpmInput.addEventListener("change", () => {
	let num = Number(bpmInput.value)
	let min = Number(bpmInput.min)
	let max = Number(bpmInput.max)
	Memory.bpm(memory, Math.clamp(min, num, max))
})

speedSelector.addEventListener("change", () => {
	Memory.layerSpeed(
		memory,
		Memory.selectedLayer(memory),
		Number(speedSelector.value)
	)
})

lengthSelector.addEventListener("change", () => {
	Memory.layerLength(
		memory,
		Memory.selectedLayer(memory),
		Number(lengthSelector.value)
	)
})

recordButton.addEventListener("click", async () => {
	if (party.hasAttribute("recording")) {
		return
	}
	party.setAttribute("recording", "recording")
	let audio = await sounds.recordSound()
	sounds.setSound(memory, Memory.selectedLayer(memory), audio)
})

// TODO move to <bento-screen/> (when that exists)
/* this runs once when drag enters the target's zone */
screen.addEventListener("dragenter", async event => {
	event.preventDefault()
	if (!fancy()) {
		await getFancy()
	}

	let {items} = event.dataTransfer

	// todo allow dragging a clip to the screen to trim the sound to the length
	// of its region
	for (let item of Array.from(items)) {
		// TODO restrict to supported formats by trying to decode a silent audio
		// item of all the formats anyone supports?
		if (item.kind == "file") {
			if (item.type.startsWith("audio/")) {
				screen.setAttribute("drop-target", "")
			} else {
				console.debug(`unsupported type: ${item.kind}, ${event.type}`)
			}
		}
	}
	event.preventDefault()
})

/* this runs a billion times a second while a drag is being held on top of the
   target */
screen.addEventListener("dragover", event => {
	event.preventDefault()

	if (!fancy() || screen.hasAttribute("drop-target")) {
		return
	}

	let {items} = event.dataTransfer

	// todo allow dragging a clip to the screen to trim the sound to the length
	// of its region
	for (let item of Array.from(items)) {
		// TODO restrict to supported formats by trying to decode a silent audio
		// item of all the formats anyone supports?
		if (item.kind == "file") {
			if (item.type.startsWith("audio/")) {
				screen.setAttribute("drop-target", "")
			} else {
				console.debug(`unsupported type: ${item.kind}, ${event.type}`)
			}
		}
	}
})

/* this runs once when drag exits the target's zone */
screen.addEventListener("dragleave", event => {
	event.preventDefault()
	if (!fancy()) {
		return
	}
	screen.removeAttribute("drop-target")
})

/* i don't know when this runs. seems never */
screen.addEventListener("dragend", () => {})

screen.addEventListener("drop", async event => {
	event.preventDefault()
	if (!fancy()) {
		await getFancy()
	}
	screen.removeAttribute("drop-target")
	if (event.dataTransfer.items) {
		for (let item of Array.from(event.dataTransfer.items)) {
			if (item.kind == "file") {
				let file = item.getAsFile()
				sounds.setSound(
					memory,
					Memory.selectedLayer(memory),
					await sounds.decode(file)
				)
			}
		}
	}
})

layerSelectorLabels.forEach(layer => {
	layer.addEventListener("drop", event => {})
	layer.addEventListener("dragstart", event => {
		event.preventDefault()
	})
})

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
				Memory.copyStepWithinSelectedLayer(memory, from, step)
				Memory.selectedStep(memory, step)
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

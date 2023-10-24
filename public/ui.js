import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as db from "./db.js"
import {
	BentoBox,
	BentoGrid,
	BentoEvent
} from "./custom-elements/custom-elements.js"

// TODO move non ui stuff to, like, start.js
let ui = document.querySelector(".ui")
/** @type {NodeListOf<HTMLInputElement>} */
let layerSelectors = ui.querySelectorAll(".layer-selector input")
/** @type {NodeListOf<HTMLInputElement>} */
let layerSelectorLabels = ui.querySelectorAll(".layer-selector label")

/** @type {BentoGrid} */
let grid = ui.querySelector("bento-grid")
/** @type {Array<BentoBox>} */
let boxes = Array.from(ui.querySelectorAll("bento-box"))
/** @type {HTMLSelectElement} */
let speedSelector = ui.querySelector('[name="speed"]')
/** @type {HTMLSelectElement} */
let lengthSelector = ui.querySelector('[name="length"]')
/** @type {HTMLInputElement} */
let bpmInput = ui.querySelector('[name="bpm"]')
/** @type {HTMLInputElement} */
let playButton = ui.querySelector('[name="play"]')
/** @type {HTMLInputElement} */
let recordButton = ui.querySelector('[name="record"]')
/** @type {HTMLElement} */
let screen = ui.querySelector(".screen")
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
		document.body.removeAttribute("fancy")
	}
	if (sounds.fancy() && !graphics.fancy()) {
		graphics.start(screenWaveformCanvas, buffer)
		document.body.removeAttribute("fancy")
	}
	if (sounds.fancy() && graphics.fancy()) {
		document.body.setAttribute("fancy", "fancy")
		if (db.loaded) {
			// lmao imagine if i saved on every click
			db.save()
		} else {
			try {
				await db.load()
			} catch (error) {
				console.error("couldnt load bento, oh well :(")
			}
		}
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

	for (let box of boxes) {
		let selectedLayer = Memory.selectedLayer(memory)
		Memory.stepOn(memory, selectedLayer, box.step, box.on)
	}

	// keeping this deactivated until i have time to do it right
	// because broken service workers are a fucking nightmare
	// if (location.search == "?offline") {
	// await offline.init()
	// }
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
	for (let box of boxes) {
		box.selected = box.step == selectedStep
		let currentStep = Memory.currentStep(memory, selectedLayer)
		box.playing = box.step == currentStep
		box.on = Memory.stepOn(memory, selectedLayer, box.step)
		box.quiet = Memory.stepQuiet(memory, selectedLayer, box.step)
		box.pan = Memory.stepPan(memory, selectedLayer, box.step)
		box.hidden = box.step >= layerLength
	}

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

ui.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.pause(memory)
	sounds.pause()
})

ui.querySelector('[name="stop"]').addEventListener("click", () => {
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
	if (document.body.hasAttribute("recording")) {
		return
	}
	document.body.setAttribute("recording", "recording")
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
	"selected",
	/** @param {BentoEvent} event */
	function (event) {
		Memory.selectedStep(memory, event.detail.step)
	}
)

grid.addEventListener(
	"on",
	/** @param {BentoEvent} event */
	function (event) {
		let step = event.detail.step
		Memory.stepOn(memory, Memory.selectedLayer(memory), step, true)
	}
)

grid.addEventListener(
	"off",
	/** @param {BentoEvent} event */
	function (event) {
		let step = event.detail.step
		Memory.stepOn(memory, Memory.selectedLayer(memory), step, false)
	}
)

grid.addEventListener(
	"copy",
	/** @param {BentoEvent} event */
	function (event) {
		event.stopPropagation()
		let {from, to} = event.detail
		Memory.copyStepWithinSelectedLayer(memory, from, to)
		Memory.selectedStep(memory, to)
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
		recordButton.checked = recording
		document.body.toggleAttribute("recording", recording)
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
	document.body.setAttribute(flag, value)
}

// ================================= hotkeys ===============================
// todo let the target element handle more of this
// todo use Modmask
globalThis.addEventListener(
	"keydown",
	/** @param {KeyboardEvent} event */ event => {
		if (document.activeElement.tagName == "INPUT") {
			// why does ^ that guard not work, typescript?
			// you KNOW this mfer is an input element
			let activeElement = /** @type {HTMLInputElement} */ (
				document.activeElement
			)
			if (activeElement?.type == "number" || activeElement?.type == "text") {
				return
			}
		}
		let chan = Memory.selectedLayer(memory)
		let selected = Memory.selectedStep(memory)
		let leftColumn = !(selected % 4)
		let topRow = selected < 4
		let bottomRow = selected > 11
		let rightColumn = !((selected + 1) % 4)
		let next = selected
		let boxes = "1234qwerasdfzxcv"

		// in case you are kara brightwell / french
		let normalPersonKeyLocation =
			(event.code.startsWith("Key") || event.code.startsWith("Digit")) &&
			event.code.toLowerCase()[event.code.length - 1]

		/** @param {KeyboardEvent} event */
		let modifiers = event => {
			let ctrl = event.ctrlKey
			let alt = event.altKey
			let meta = event.metaKey
			let shift = event.shiftKey
			return {
				ctrl,
				alt,
				meta,
				shift,
				any: ctrl || alt || meta || shift
			}
		}

		let boxIndex = boxes.indexOf(normalPersonKeyLocation)
		let ops = []
		let mod = modifiers(event)

		// todo don't steal these from the radio selector
		if (!mod.any && event.key == "ArrowLeft") {
			ops.push("move")
			next += leftColumn ? 3 : -1
		} else if (!mod.any && event.key == "ArrowUp") {
			ops.push("move")
			next += topRow ? 12 : -4
		} else if (!mod.any && event.key == "ArrowRight") {
			ops.push("move")
			next += rightColumn ? -3 : 1
		} else if (!mod.any && event.key == "ArrowDown") {
			ops.push("move")
			next += bottomRow ? -12 : 4
		} else if (!mod.any && event.key == "Enter") {
			// TODO fire event on button
			Memory.togglePlaying(memory)
		} else if (!mod.any && boxIndex != -1) {
			ops.push("toggle")
			ops.push("move")
			next = boxIndex
		} else if (mod.shift && boxIndex > -1 && boxIndex < 4) {
			Memory.selectedLayer(memory, boxIndex)
		} else if (mod.ctrl && event.key == "ArrowDown") {
			let gain = Memory.stepQuiet(memory, chan, selected)
			gain = Math.clamp(0, gain + 1, 12)
			// TODO fire event on box
			Memory.stepQuiet(memory, chan, selected, gain)
		} else if (mod.ctrl && event.key == "ArrowUp") {
			let gain = Memory.stepQuiet(memory, chan, selected)
			gain = Math.clamp(0, gain - 1, 12)
			// TODO fire event on box
			Memory.stepQuiet(memory, chan, selected, gain)
		} else if (mod.ctrl && event.key == "r") {
			let reversed = Memory.stepReversed(memory, chan, selected)
			// TODO fire event on box
			Memory.stepReversed(memory, chan, selected, !reversed)
		} else {
		}
		// TODO ctrl+space + arrows for trim region??
		if (next == selected) {
			if (ops.includes("toggle")) {
				Memory.toggleStep(memory, Memory.selectedLayer(memory), next)
			}
		} else if (ops.includes("move")) {
			Memory.selectedStep(memory, next)
			boxes[next].focus()
		}
	}
)

// let optionsButton = ui.querySelector("[name='options']")
// let optionsDialog = /** @type {HTMLDialogElement} */ (
// 	ui.querySelector(".save-dialog")
// )
// let dialogCloseButton = ui.querySelector("dialog .close")

// optionsButton.addEventListener("click", () => {
// 	optionsDialog.show()
// })

// dialogCloseButton.addEventListener("click", function () {
// 	this.closest("dialog").close()
// })

// let saveButton = /** @type {HTMLInputElement} */ (
// 	optionsDialog.querySelector("[name='save']")
// )

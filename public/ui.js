import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import Math from "./math.js"

// TODO move non ui stuff to, like, start.js
let ui = document.querySelector(".ui")
/** @type {NodeListOf<HTMLInputElement>} */
let patternSelectors = ui.querySelectorAll(".pattern-selector input")
/** @type {NodeListOf<HTMLInputElement>} */
let patternSelectorLabels = ui.querySelectorAll(".pattern-selector label")

/** @type {NodeListOf<HTMLInputElement>} */
let stepInputs = ui.querySelectorAll(".pattern input")
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

let fancyListeners = ["mousedown", "keydown", "click", "touchstart"]

function fancy() {
	return sounds.fancy() && graphics.fancy()
}

async function getFancy() {
	if (!sounds.fancy()) {
		await sounds.start(buffer)
	}
	if (sounds.fancy() && !graphics.fancy()) {
		graphics.start(screenWaveformCanvas, buffer)
	}
	if (sounds.fancy() && graphics.fancy()) {
		removeFancyEventListeners()
	}
}

fancyListeners.map(eventName =>
	window.addEventListener(eventName, getFancy, {
		passive: eventName == "touchstart",
	})
)
fancyListeners.map(eventName =>
	stepInputs.forEach(stepInput =>
		stepInput.addEventListener(eventName, getFancy, {
			passive: eventName == "touchstart",
		})
	)
)

function removeFancyEventListeners() {
	fancyListeners.map(e => window.removeEventListener(e, getFancy))
	fancyListeners.map(e =>
		stepInputs.forEach(l => l.removeEventListener(e, getFancy))
	)
}

async function init() {
	graphics.init(screenWaveformCanvas)
	sounds.init()
	// keeping this deactivated until i have time to do it right
	// because broken service workers are a fucking nightmare
	// if (location.search == "?offline") {
	// 	await offline.init()
	// }
	Memory.bpm(memory, Number(bpmInput.value))
	loop.patterns(pidx => {
		Memory.patternSpeed(memory, pidx, 1)
		Memory.patternLength(memory, pidx, 16)
		if (patternSelectors[pidx].checked) {
			Memory.selectedPattern(memory, pidx)
		}
	})

	stepInputs.forEach((step, stepIndex) => {
		let chanIndex = Memory.selectedPattern(memory)
		Memory.stepOn(memory, chanIndex, stepIndex, step.checked)
	})
}

function update() {
	let selectedPattern = Memory.selectedPattern(memory)
	let bpm = Memory.bpm(memory).toString()
	speedSelector.querySelectorAll("option").forEach(option => {
		let label = option.dataset.label || option.value
		let full = bpm + "×" + label

		// why not a span inside? or an attr? for use in a ::before??
		if (option.textContent != full) {
			option.textContent = full
		}
	})

	speedSelector.value = Memory.patternSpeed(memory, selectedPattern).toString()
	let patternLength = Memory.patternLength(memory, selectedPattern)
	lengthSelector.value = patternLength.toString()

	playButton.classList.toggle("playing", Memory.playing(memory))
	if (bpmInput != document.activeElement) {
		bpmInput.value = bpm
	}

	patternSelectors.forEach((patternSelector, index) => {
		patternSelector.checked = index == selectedPattern
		patternSelector.toggleAttribute("checked", index == selectedPattern)
		patternSelector.parentElement.classList.toggle(
			"checked",
			index == selectedPattern
		)
	})

	let selectedStep = Memory.selectedStep(memory)
	stepInputs.forEach((stepElement, index) => {
		stepElement.setAttribute(
			"aria-selected",
			(index == selectedStep).toString()
		)

		let currentStep = Memory.currentStep(memory, selectedPattern)
		stepElement.classList.toggle("playing", index == currentStep)
		stepElement.checked = Memory.stepOn(memory, selectedPattern, index)
		stepElement.toggleAttribute("checked", stepElement.checked)
		stepElement.dataset.gain = Memory.stepGain(
			memory,
			selectedPattern,
			index
		).toString()
		stepElement.toggleAttribute("hidden", index >= patternLength)
	})

	requestAnimationFrame(update)
}

await init()
update()

patternSelectors.forEach((patternSelector, index) => {
	/**
	 * @param {InputEvent} _event
	 */
	patternSelector.addEventListener("change", _event => {
		if (patternSelector.checked) {
			Memory.selectedPattern(memory, index)
		}
	})
})

stepInputs.forEach((step, index) => {
	step.addEventListener("mousedown", event => {
		event.stopImmediatePropagation()
		event.preventDefault()
	})

	step.addEventListener("change", () => {
		if (step.getAttribute("aria-selected") == "true") {
			Memory.stepOn(memory, Memory.selectedPattern(memory), index, step.checked)
		} else {
			Memory.selectedStep(memory, index)
			step.focus()
		}
	})

	step.addEventListener("focus", () => {
		if (step.getAttribute("aria-selected") != "true") {
			Memory.selectedStep(memory, index)
		}
	})
})

playButton.addEventListener("click", () => {
	Memory.playing(memory, true)
	// TODO Memory.play(memory)
})

ui.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	// TODO Memory.pause(memory)
})

ui.querySelector('[name="stop"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	// TODO Memory.stop(memory)
})

bpmInput.addEventListener("change", () => {
	let num = Number(bpmInput.value)
	let min = Number(bpmInput.min)
	let max = Number(bpmInput.max)
	Memory.bpm(memory, Math.clamp(min, num, max))
})

speedSelector.addEventListener("change", () => {
	Memory.patternSpeed(
		memory,
		Memory.selectedPattern(memory),
		Number(speedSelector.value)
	)
})

lengthSelector.addEventListener("change", () => {
	Memory.patternLength(
		memory,
		Memory.selectedPattern(memory),
		Number(lengthSelector.value)
	)
})

recordButton.addEventListener("click", async () => {
	if (document.body.hasAttribute("recording")) {
		return
	}
	document.body.setAttribute("recording", "recording")
	let audio = await sounds.recordSound()
	sounds.setSound(memory, Memory.selectedPattern(memory), audio)
})

/* this runs once when drag enters the target's zone */
screen.addEventListener("dragenter", async event => {
	console.log(event.type)
	if (!fancy()) {
		return
	}
	event.preventDefault()
	screen.classList.add("droptarget")
})

let noop =
	/* this runs a billion times a second while a drag is being held on top of the target */
	screen.addEventListener("dragover", async event => {})

/* this runs once when drag exits the target's zone */
screen.addEventListener("dragleave", event => {
	console.log(event.type)
	if (!fancy()) {
		return
	}
	event.preventDefault()
	screen.classList.remove("droptarget")
})

/* i don't know when this runs. seems never */
screen.addEventListener("dragend", () => {})

screen.addEventListener("drop", async event => {
	if (!fancy()) {
		return
	}
	event.preventDefault()
	screen.classList.remove("droptarget")
	if (event.dataTransfer.items) {
		for (let item of Array.from(event.dataTransfer.items)) {
			if (item.kind == "file") {
				let file = item.getAsFile()
				sounds.setSound(
					memory,
					Memory.selectedPattern(memory),
					await sounds.decode(file)
				)
			}
		}
	}
})

patternSelectorLabels.forEach(pattern => {
	pattern.addEventListener("")
	pattern.addEventListener("dragstart", event => {
		event.preventDefault()
		console.log("stop bullying me", event)
	})
})

stepInputs.forEach(stepInput => {
	stepInput.addEventListener("dragstart", event => {
		event.preventDefault()
		console.log("stop bullying me")
	})
})

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
			counterElement.textContent = "•".repeat(length)
			recordingCounterInterval = setInterval(function () {
				counterElement.textContent =
					counterElement.textContent.slice(0, -1) || " "
			}, 1000)
		} else {
			clearInterval(recordingCounterInterval)
		}
	}
}

let stepWaveformCanvas = document.createElement("canvas")
let stepWaveformUrlCache = {}
document.addEventListener(
	"waveform",
	/**
	 * @param {CustomEvent & {detail: {imageData: ImageData}}} event
	 */
	async ({detail}) => {
		/** @type {ImageBitmap} */
		let bmp = detail.bmp
		let {pattern, step, cachename} = detail
		if (pattern != Memory.selectedPattern(memory)) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height
		let stepElement = stepInputs[step]
		if (!stepWaveformUrlCache[cachename]) {
			let context = stepWaveformCanvas.getContext("bitmaprenderer")
			context.transferFromImageBitmap(bmp)
			stepWaveformUrlCache[cachename] =
				stepWaveformCanvas.toDataURL("image/webp")
		}

		stepElement.style.backgroundImage = `url(${stepWaveformUrlCache[cachename]})`
	}
)

let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	document.body.setAttribute(flag, value)
}

/*
 * =============================================================================
 * ================================== hotkeys ==================================
 * =============================================================================
 */
globalThis.addEventListener(
	"keydown",
	/** @param {KeyboardEvent} event */ event => {
		if (document.activeElement.tagName == "INPUT") {
			// why does ^ that guard not work, typescript?
			// you KNOW this mfer is an input element
			let activeElement = document.activeElement
			if (activeElement?.type == "number" || activeElement?.type == "text") {
				return
			}
		}
		let chan = Memory.selectedPattern(memory)
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
				any: ctrl | alt | meta | shift,
			}
		}

		let boxIndex = boxes.indexOf(normalPersonKeyLocation)
		let ops = []
		let mod = modifiers(event)

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
			Memory.togglePlaying(memory)
		} else if (!mod.any && boxIndex != -1) {
			ops.push("toggle")
			ops.push("move")
			next = boxIndex
		} else if (mod.shift && boxIndex > -1 && boxIndex < 4) {
			Memory.selectedPattern(memory, boxIndex)
		} else if (mod.ctrl && event.key == "ArrowDown") {
			let gain = Memory.stepGain(memory, chan, selected)
			gain = clamp(0, gain + 1, 12)
			Memory.stepGain(memory, chan, selected, gain)
		} else if (mod.ctrl && event.key == "ArrowUp") {
			let gain = Memory.stepGain(memory, chan, selected)
			gain = clamp(0, gain - 1, 12)
			Memory.stepGain(memory, chan, selected, gain)
		} else if (mod.ctrl && event.key == "r") {
			let reversed = Memory.stepReversed(memory, chan, selected)
			Memory.stepReversed(memory, chan, selected, !reversed)
		} else {
		}
		// TODO ctrl+space + arrows for trim region??
		if (next == selected) {
			if (ops.includes("toggle")) {
				Memory.toggleStep(memory, Memory.selectedPattern(memory), next)
			}
		} else if (ops.includes("move")) {
			Memory.selectedStep(memory, next)
			stepInputs[next].focus()
		}
	}
)

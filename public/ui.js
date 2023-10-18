import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
import * as offline from "./offline.js"

// TODO move non ui stuff to, like, start.js
let ui = document.querySelector(".ui")
let channelGroup = ui.querySelector(".channels")
let channels = channelGroup.querySelectorAll("input")
let stepGroup = ui.querySelector(".steps")
let steps = stepGroup.querySelectorAll("input")
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
/** @type {HTMLCanvasElement} */
let canvas = ui.querySelector(".waveform canvas")

let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

async function init() {
	graphics.init(canvas)
	sounds.init()
	// keeping this deactivated until i have time to do it right
	// because broken service workers are a fucking nightmare
	if (location.search == "?offline") {
		await offline.init()
	}
	Memory.bpm(memory, Number(bpmInput.value))

	channels.forEach((channel, idx) => {
		Memory.channelSpeed(memory, idx, 1)
		Memory.channelLength(memory, idx, 16)
		if (channel.checked) {
			Memory.selectedChannel(memory, idx)
		}
	})

	let interactions = ["mousedown", "touchstart", "keypress"]

	let alreadyFancy = false
	function getFancy() {
		if (alreadyFancy) {
			interactions.map(e => window.removeEventListener(e, getFancy))
			return
		}
		sounds.start(buffer)
		graphics.start(canvas, buffer)
		alreadyFancy = true
	}
	interactions.map(e => window.addEventListener(e, getFancy))

	steps.forEach((step, stepIndex) => {
		let chanIndex = Memory.selectedChannel(memory)
		Memory.stepOn(memory, chanIndex, stepIndex, step.checked)
	})
}

function update() {
	let selectedChannel = Memory.selectedChannel(memory)
	let bpm = Memory.bpm(memory).toString()
	speedSelector.querySelectorAll("option").forEach(option => {
		let label = option.dataset.label || option.value
		let full = bpm + "×" + label

		// why not a span inside? or an attr? for use in a ::before??
		if (option.textContent != full) {
			option.textContent = full
		}
	})

	speedSelector.value = Memory.channelSpeed(memory, selectedChannel).toString()
	let patternLength = Memory.channelLength(memory, selectedChannel)
	lengthSelector.value = patternLength.toString()

	playButton.classList.toggle("playing", Memory.playing(memory))
	if (bpmInput != document.activeElement) {
		bpmInput.value = bpm
	}

	channels.forEach((channelElement, index) => {
		channelElement.checked = index == selectedChannel
		channelElement.toggleAttribute("checked", index == selectedChannel)
		channelElement.parentElement.classList.toggle(
			"checked",
			index == selectedChannel
		)
	})

	let selectedStep = Memory.selectedStep(memory)
	steps.forEach((stepElement, index) => {
		stepElement.setAttribute(
			"aria-selected",
			(index == selectedStep).toString()
		)

		let currentStep = Memory.currentStep(memory, selectedChannel)
		stepElement.classList.toggle("playing", index == currentStep)
		stepElement.checked = Memory.stepOn(memory, selectedChannel, index)
		stepElement.toggleAttribute("checked", stepElement.checked)
		stepElement.dataset.gain = Memory.stepGain(
			memory,
			selectedChannel,
			index
		).toString()
		stepElement.toggleAttribute("hidden", index >= patternLength)
	})

	requestAnimationFrame(update)
}

await init()
update()

channels.forEach((channel, index) => {
	channel.addEventListener("change", event => {
		if (channel.checked) {
			Memory.selectedChannel(memory, index)
		}
	})
})

steps.forEach((step, index) => {
	step.addEventListener("mousedown", event => {
		event.stopImmediatePropagation()
		event.preventDefault()
	})
	step.addEventListener("change", event => {
		if (step.getAttribute("aria-selected") == "true") {
			Memory.stepOn(memory, Memory.selectedChannel(memory), index, step.checked)
		} else {
			Memory.selectedStep(memory, index)
			step.focus()
		}
	})
	step.addEventListener("focus", event => {
		if (step.getAttribute("aria-selected") != "true") {
			Memory.selectedStep(memory, index)
		}
	})
})

playButton.addEventListener("click", () => {
	Memory.playing(memory, true)
	//TOOD Memory.play(memory)
})

ui.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	//TOOD Memory.pause(memory)
})

ui.querySelector('[name="stop"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	//TOOD Memory.stop(memory)
})

/** @type {(min: number, number: number, max: number) => number} */
let clamp = (min, num, max) => Math.min(max, Math.max(min, num))

bpmInput.addEventListener("change", event => {
	let num = Number(bpmInput.value)
	let min = Number(bpmInput.min)
	let max = Number(bpmInput.max)
	Memory.bpm(memory, clamp(min, num, max))
})

speedSelector.addEventListener("change", event => {
	Memory.channelSpeed(
		memory,
		Memory.selectedChannel(memory),
		Number(speedSelector.value)
	)
})

lengthSelector.addEventListener("change", event => {
	Memory.channelLength(
		memory,
		Memory.selectedChannel(memory),
		Number(lengthSelector.value)
	)
})

recordButton.addEventListener("click", async event => {
	let audio = await sounds.recordSound()
	sounds.setSound(memory, Memory.selectedChannel(memory), audio)
})

globalThis.onmessage = function (event) {
	if (event.data?.type == "recording") {
		recordButton.checked = event.data.start
	}
}

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
	"keyup",
	/** @param {KeyboardEvent} event */ event => {
		if (document.activeElement.tagName == "INPUT") {
			if (
				// why does ^ that guard not work, typescript?
				// you KNOW this mfer is an input element
				document.activeElement?.type == "number" ||
				document.activeElement?.type == "text"
			) {
				return
			}
		}
		let chan = Memory.selectedChannel(memory)
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
		}
		// TODO ctrl+space + arrows for trim region??
		if (next == selected) {
			if (ops.includes("toggle")) {
				Memory.toggleStep(memory, Memory.selectedChannel(memory), next)
			}
		} else if (ops.includes("move")) {
			Memory.selectedStep(memory, next)
			steps[next].focus()
		}
	}
)

function generateExtraStyles() {
	let style = document.createElement("style")
	for (let n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
		console.log(`.step[data-gain="${n}"] {
	opacity: ${(12.5 - n) / 12};
}
`)
	}
}

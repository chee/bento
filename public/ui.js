import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"

let ui = document.querySelector(".ui")
let channelGroup = ui.querySelector(".channels")
let channels = channelGroup.querySelectorAll("input")
let stepGroup = ui.querySelector(".steps")
let steps = stepGroup.querySelectorAll("input")
/** @type {HTMLInputElement} */
let speedSelector = ui.querySelector('[name="speed"]')
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

function indexOfSelf(/** @type {HTMLElement} */ element) {
	return [].indexOf.call(element.parentElement.children, element)
}

function init() {
	graphics.init(canvas)
	sounds.init()
	Memory.bpm(memory, Number(bpmInput.value))
	for (let channel of channels) {
		let idx = indexOfSelf(channel)
		Memory.channelSpeed(memory, idx, 1)
		if (channel.checked) {
			Memory.selectedChannel(memory, idx)
		}
	}

	let alreadyFancy = false
	function getFancy() {
		if (alreadyFancy) return
		sounds.start(buffer)
		graphics.update(canvas, Memory.getSelectedSoundDetails(memory))
		alreadyFancy = true
	}

	ui.addEventListener("click", getFancy, {once: true})

	window.addEventListener("keydown", getFancy, {once: true})

	steps.forEach((step, stepIndex) => {
		let chanIndex = Memory.selectedChannel(memory)
		Memory.stepOn(memory, chanIndex, stepIndex, step.checked)
	})
}

let lastChannel = Memory.selectedChannel(memory)
let lastSelectedStep = Memory.selectedStep(memory)
function update() {
	let selectedChannel = Memory.selectedChannel(memory)
	if (lastChannel != selectedChannel) {
		requestAnimationFrame(() =>
			graphics.update(canvas, Memory.getSelectedSoundDetails(memory))
		)
		lastChannel = selectedChannel
	}
	speedSelector.value = Memory.channelSpeed(memory, selectedChannel).toString()

	playButton.classList.toggle("playing", Memory.playing(memory))
	if (bpmInput != document.activeElement) {
		bpmInput.value = Memory.bpm(memory).toString()
	}

	channels.forEach((channelElement, index) => {
		channelElement.checked = index == selectedChannel
	})

	let selectedStep = Memory.selectedStep(memory)
	if (selectedStep != lastSelectedStep) {
		graphics.update(canvas, Memory.getSelectedSoundDetails(memory))
	}
	steps.forEach((stepElement, index) => {
		stepElement.setAttribute(
			"aria-selected",
			(index == selectedStep).toString()
		)

		let currentStep = Memory.currentStep(memory, selectedChannel)
		stepElement.classList.toggle("playing", index == currentStep)
		stepElement.checked = Memory.stepOn(memory, selectedChannel, index)
		stepElement.toggleAttribute("checked", stepElement.checked)
	})
	lastSelectedStep = selectedStep

	requestAnimationFrame(update)
}

init()
update()

channels.forEach((channel, index) => {
	channel.addEventListener("change", event => {
		if (channel.checked) {
			Memory.selectedChannel(memory, index)
		}
	})
})

steps.forEach((step, index) => {
	step.addEventListener("click", event => {
		step.focus()
		if (step.ariaSelected == "true") {
			Memory.stepOn(memory, Memory.selectedChannel(memory), index, step.checked)
		} else {
			step.ariaSelected = "true"
			Memory.selectedStep(memory, index)
		}
	})
	step.addEventListener("focus", event => {
		step.ariaSelected = "true"
		Memory.selectedStep(memory, index)
	})
})

window.addEventListener(
	"keyup",
	/** @param {KeyboardEvent} event */ event => {
		let selected = Memory.selectedStep(memory)
		let leftColumn = !(selected % 4)
		let topRow = selected < 4
		let bottomRow = selected > 11
		let rightColumn = !((selected + 1) % 4)
		let next = selected
		let boxes = "1234qwerasdfzxcv"
		let boxIndex = boxes.indexOf(event.key)
		let toggle = false
		if (event.key == "ArrowLeft") {
			next += leftColumn ? 3 : -1
		} else if (event.key == "ArrowUp") {
			next += topRow ? 12 : -4
		} else if (event.key == "ArrowRight") {
			next += rightColumn ? -3 : 1
		} else if (event.key == "ArrowDown") {
			next += bottomRow ? -12 : 4
		} else if (event.key == "p") {
			Memory.playing(memory, true)
		} else if (boxIndex != -1) {
			toggle = true
			next = boxIndex
		}
		if (next == selected) {
			console.log(next, selected)
			if (toggle) {
				Memory.toggleStep(memory, Memory.selectedChannel(memory), next)
			}
		} else {
			Memory.selectedStep(memory, next)
			steps[next].focus()
		}
	}
)

playButton.addEventListener("click", () => {
	Memory.playing(memory, true)
})

ui.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.playing(memory, false)
})

ui.querySelector('[name="stop"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	for (let channel of [0, 1, 2, 3]) {
		Memory.currentStep(memory, channel, 0)
	}
})

/** @typedef {Object & Event} TrimEvent
 * @property {import("./memory.js").Trim} TrimEvent.detail
 */
canvas.addEventListener(
	"trim",
	/** @param {TrimEvent} event */
	event => {
		let trim = event.detail
		let chanIndex = Memory.selectedChannel(memory)
		let stepIndex = Memory.selectedStep(memory)
		Memory.stepTrim(memory, chanIndex, stepIndex, trim)
		graphics.update(canvas, Memory.getSelectedSoundDetails(memory))
	}
)

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

recordButton.addEventListener("click", async event => {
	let audio = await sounds.recordSound()
	sounds.setSound(memory, Memory.selectedChannel(memory), audio)
	requestAnimationFrame(() =>
		graphics.update(canvas, Memory.getSelectedSoundDetails(memory))
	)
})

globalThis.onmessage = function (event) {
	if (event.data?.type == "recording") {
		recordButton.checked = event.data.start
	}
}
document.body.classList.toggle("chee", location.search == "?rabbit")

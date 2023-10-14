import * as elements from "./elements.js"
elements.register()
import * as sounds from "./sounds.js"
import * as graphics from "./graphics.js"
import * as Memory from "./memory.js"
let ui = document.querySelector("po-ui")
let channelGroup = ui.querySelector("po-channels")
let channels = channelGroup.querySelectorAll("po-channel")
let stepGroup = ui.querySelector("po-steps")
let steps = stepGroup.querySelectorAll("po-step")
let speedSelector = ui.querySelector('[name="speed"] select')
let bpmInput = ui.querySelector('[name="bpm"] input')
let playButton = ui.querySelector('[name="play"]')
let recordButton = ui.querySelector('[name="record"]')
/** @type {HTMLCanvasElement} */
let canvas = ui.querySelector('[name="waveform"] canvas')
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)
graphics.init(canvas)

Memory.bpm(memory, 120)
for (let channel of [0, 1, 2, 3]) {
	Memory.channelSpeed(memory, channel, 1)
}

ui.addEventListener(
	"click",
	() => {
		sounds.start(buffer)
		graphics.update(buffer, canvas)
	},
	{once: true}
)

channels.forEach((channel, index) => {
	if (channel.selected) {
		Memory.selectedChannel(memory, index)
	}
})

steps.forEach((step, index) => {
	if (step.on) {
		memory[`channel${Memory.selectedChannel(memory)}step${index}on`].set([1])
	}
})

let lastChannel = Memory.selectedChannel(memory)
function update() {
	let selectedChannel = Memory.selectedChannel(memory)
	if (lastChannel != selectedChannel) {
		setTimeout(() => graphics.update(buffer, canvas))
		lastChannel = selectedChannel
	}
	speedSelector.value = Memory.channelSpeed(memory, selectedChannel)

	playButton.toggleAttribute("playing", Memory.playing(memory))
	if (bpmInput != document.activeElement) {
		bpmInput.value = Memory.bpm(memory)
	}

	channels.forEach((channelElement, index) => {
		if (index == selectedChannel) {
			channelElement.selected = true
		} else {
			channelElement.selected = false
		}
	})

	steps.forEach((stepElement, index) => {
		if (index == Memory.selectedStep(memory)) {
			stepElement.selected = true
		} else {
			stepElement.selected = false
		}

		let currentStep = Memory.currentStep(memory, selectedChannel)
		if (index == currentStep) {
			stepElement.playing = true
		} else {
			stepElement.playing = false
		}
		if (Memory.stepOn(memory, selectedChannel, index)) {
			stepElement.on = true
		} else {
			stepElement.on = false
		}
	})

	requestAnimationFrame(update)
}

update()

channels.forEach((channel, index) => {
	channel.addEventListener("selected", event => {
		memory.selected_channel.set([index])
	})
})

steps.forEach((step, index) => {
	step.addEventListener("selected", event => {
		memory.selected_step.set([index])
	})
	step.addEventListener("on", event => {
		memory[`channel${Memory.selectedChannel(memory)}step${index}on`].set([1])
	})
	step.addEventListener("off", event => {
		memory[`channel${Memory.selectedChannel(memory)}step${index}on`].set([0])
	})
})

playButton.addEventListener("click", () => {
	Memory.playing(memory, true)
})
ui.querySelector('[name="pause"]').addEventListener("click", () => {
	Memory.playing(memory, false)
})
ui.querySelector('[name="stop"]').addEventListener("click", () => {
	Memory.playing(memory, false)
	for (let channel in [0, 1, 2, 3]) {
		Memory.currentStep(memory, channel, 0)
	}
})

bpmInput.addEventListener("change", event => {
	let num = Number(event.target.value)
	if (num < event.target.min) {
		num = event.target.value = event.target.min
	}
	if (num > event.target.max) {
		num = event.target.value = event.target.max
	}
	Memory.bpm(memory, num)
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
})

sounds.angel.hark("recording", recording => {
	ui.toggleAttribute("recording", recording)
})

function getPattern() {
	let pattern = ""
	pattern += Memory.bpm(memory) + "\n\n"
	for (let cidx of [0, 1, 2, 3]) {
		pattern += Memory.channelSpeed(memory, cidx) + "\n"
		for (let sidx of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
			// if i use unicode chars for this, i can create a bitmask to store a huge
			// amount of data in a single character.
			// maybe it should be emoji
			pattern += Memory.stepOn(memory, cidx, sidx) ? "■ " : "□ "
			if (!((sidx + 1) % 4)) {
				pattern += "\n"
			}
		}
		pattern += "\n"
	}
	return pattern
}

function loadPattern(pattern) {
	let [master, ...channels] = pattern.trim().split(/\n\n+/)
	let [bpm] = master.split(/\s+/)
	Memory.bpm(memory, Number(bpm))
	channels.forEach((channel, cidx) => {
		let [options, ...steps] = channel.trim().split(/\s+/)
		steps = steps.filter(s => s.trim())
		let [speed] = options.split(/\s+/)
		Memory.channelSpeed(memory, cidx, Number(speed))
		steps.forEach((step, sidx) => {
			Memory.stepOn(memory, cidx, sidx, step == "■")
		})
	})
}

globalThis.getPattern = getPattern
globalThis.loadPattern = loadPattern

if (location.search == "?rabbit") {
	document.body.classList.add("chee")
}

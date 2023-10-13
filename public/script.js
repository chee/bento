import * as elements from "./elements.js"
elements.register()
import unmute from "./unmute.js"
import * as Memory from "./memory.js"
let ui = document.querySelector("po-ui")
let channelGroup = ui.querySelector("po-channels")
let channels = channelGroup.querySelectorAll("po-channel")
let stepGroup = ui.querySelector("po-steps")
let steps = stepGroup.querySelectorAll("po-step")
let buffer = new SharedArrayBuffer(Memory.size)

// temporary until audioworklet
let audios = document.querySelectorAll("audio")

/**
 * @typedef {Object} MemoryMap
 * @property {Int8Array} MemoryMap.channel
 * @property {Int8Array} MemoryMap.step
 * @property {Uint16Array} MemoryMap.bpm
 * @property {Float32Array} MemoryMap.size
 * @type {MemoryMap}
 */
let memory = Memory.map(buffer)
let bpmElement = ui.querySelector('po-control[name="bpm"]')

channels.forEach((channel, index) => {
	if (channel.selected) {
		memory.selected_channel.set([index])
	}
})

steps.forEach((step, index) => {
	if (step.on) {
		memory[`channel${Memory.selectedChannel(memory)}step${index}on`].set([1])
	}
})

function update() {
	channels.forEach((channelElement, index) => {
		if (index == Memory.selectedChannel(memory)) {
			channelElement.selected = true
		} else {
			channelElement.selected = false
		}
	})

	steps.forEach((stepElement, index) => {
		let selected_step = memory.selected_step.at(0)
		if (index == selected_step) {
			stepElement.selected = true
		} else {
			stepElement.selected = false
		}
		let current_step = memory.current_step.at(0)
		if (index == current_step) {
			stepElement.playing = true
		} else {
			stepElement.playing = false
		}
		if (
			!!memory[`channel${Memory.selectedChannel(memory)}step${index}on`].at(0)
		) {
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

let unmuted = false
let context = new AudioContext()
ui.addEventListener("click", () => {
	if (unmuted) return
	unmuted = true
	unmute(context, true, true)
})
let lastStep = -1
setInterval(function () {
	let step = Memory.currentStep(memory)
	let toplay = []
	for (let channel of [0, 1, 2, 3]) {
		if (step != lastStep && lastStep > -1) {
			if (memory[`channel${channel}step${step}on`].at(0)) {
				toplay.push(audios[channel])
			}
		}
	}
	let audio
	while ((audio = toplay.shift())) {
		audio.currentTime = 0
		audio.play()
	}
	lastStep = step
}, 0)

let worker = new Worker("worker.js")
worker.postMessage({type: "memory", buffer})

ui.querySelectorAll('po-control[control-type="simple-button"]').forEach(
	button => {
		button.addEventListener("click", () => {
			console.debug(`${button.name} clicked, sending to worker`)
			worker.postMessage({type: button.name})
		})
	}
)

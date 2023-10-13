import * as elements from "./elements.js"
elements.register()
import * as sound from "./sound.js"

import * as Memory from "./memory.js"
let ui = document.querySelector("po-ui")
let channelGroup = ui.querySelector("po-channels")
let channels = channelGroup.querySelectorAll("po-channel")
let stepGroup = ui.querySelector("po-steps")
let steps = stepGroup.querySelectorAll("po-step")
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

ui.addEventListener("click", () => sound.start(memory), {once: true})
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
		if (index == Memory.selectedStep(memory)) {
			stepElement.selected = true
		} else {
			stepElement.selected = false
		}

		if (index == Memory.currentStep(memory)) {
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

import * as elements from "./elements.js"
elements.register()
import * as Memory from "./memory.js"
let channelGroup = document.querySelector("po-channels")
let channels = document.querySelectorAll("po-channel")
let stepGroup = document.querySelector("po-steps")
let steps = document.querySelectorAll("po-step")
let buffer = new SharedArrayBuffer(Memory.size)
/**
 * @typedef {Object} MemoryMap
 * @property {Int8Array} MemoryMap.channel
 * @property {Int8Array} MemoryMap.step
 * @property {Uint16Array} MemoryMap.bpm
 * @property {Float32Array} MemoryMap.size
 * @type {MemoryMap}
 */
let memory = Memory.map(buffer)

memory.bpm.set([120])

let selectedChannel = () => memory.selected_channel.at(0)

channels.forEach((channel, index) => {
	if (channel.selected) {
		memory.selected_channel.set([index])
	}
})

steps.forEach((step, index) => {
	if (step.on) {
		memory[`channel${selectedChannel()}step${index}on`].set([1])
	}
})

function update() {
	channels.forEach((channelElement, index) => {
		if (index == selectedChannel()) {
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
		if (!!memory[`channel${selectedChannel()}step${index}on`].at(0)) {
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
		memory[`channel${selectedChannel()}step${index}on`].set([1])
	})
	step.addEventListener("off", event => {
		memory[`channel${selectedChannel()}step${index}on`].set([0])
	})
})

let worker = new Worker("worker.js")
worker.postMessage({type: "memory", buffer})

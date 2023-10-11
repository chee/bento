import * as Memory from "./memory.js"
let channels = document.querySelectorAll("po-channel")
let steps = document.querySelectorAll("po-step")
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

memory.bpm.set([120])

function update() {
	let channel = memory.channel.at(0)
	let step = memory.step.at(0)
	channels.forEach((element, index) => {
		if (index == channel) {
			element.className = "active"
		} else {
			element.className = ""
		}
	})
	steps.forEach((element, index) => {
		if (index == step) {
			element.className = "active"
		} else {
			element.className = ""
		}
	})
	requestAnimationFrame(update)
}

update()

channels.forEach((channel, index) => {
	channel.addEventListener("click", event => {
		memory.channel.set([index])
	})
})

let worker = new Worker("worker.js")
worker.postMessage({type: "memory", buffer})

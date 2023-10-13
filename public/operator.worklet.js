import * as Memory from "./memory.js"

function add(arrays) {
	if (!arrays.length) {
		return []
	}
	let end = arrays[0].map(i => i / arrays.length)
	for (let j = 1; j < arrays.length; j++) {
		for (let i = 0; i < end.length; i++) {
			end[i] += arrays[j][i] / arrays.length
		}
	}
	return end
}

/**
	@returns {Float32Array}
 */
function addf32(arrays) {
	let end = arrays[0].map(i => i)
	for (let j = 1; j < arrays.length; j++) {
		for (let i = 0; i < end.length; i++) {
			end.set(i, end.at(i) + arrays[j].at(i))
		}
	}
	return end
}

function addf32q(arrays) {
	let end = arrays[0].map(i => i / arrays.length)
	for (let j = 1; j < arrays.length; j++) {
		for (let i = 0; i < end.length; i++) {
			end.set(i, end.at(i) + arrays[j].at(i) / arrays.length)
		}
	}
	return end
}

class Operator extends AudioWorkletProcessor {
	constructor(options) {
		super()

		let memory = Memory.map(options.processorOptions.buffer)
		this.memory = memory
		this.lastStep = -1
	}
	// :)
	process(inputs, outputs, parameters) {
		let memory = this.memory
		let output = outputs[0]
		let step = Memory.currentStep(memory)
		let toplay = []
		let channels = Array.from(Array(4), (_, i) => {
			return {
				sound: Memory.sound(memory, i),
				point: 0,
				playing: false,
			}
		})

		if (step != this.lastStep && this.lastStep > -1) {
			for (let channel of [0, 1, 2, 3]) {
				if (memory[`channel${channel}step${step}on`].at(0)) {
					toplay.push(channel)
				}
			}
		}

		this.lastStep = step

		for (let channel of toplay) {
			channels[channel].point = 0
			channels[channel].playing = true
		}

		let outs = []

		for (let channel of channels.filter(c => c.playing)) {
			let sub = channel.sound.slice(channel.point + 0, 128)
			channel.point += 128
			outs.push(sub)
		}

		if (outs.length) {
			output.forEach(channel => {
				addf32(outs).forEach((f, i) => {
					channel[i] = f
				})
			})
		}

		return true
	}
}

registerProcessor("operator", Operator)

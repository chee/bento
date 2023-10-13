import * as Memory from "./memory.js"

function add(arrays) {
	if (!arrays.length) {
		return []
	} else if (arrays.length == 1) {
		return arrays[0]
	}
	let end = arrays[0].map(i => i)
	for (let j = 1; j < arrays.length; j++) {
		for (let i = 0; i < end.length; i++) {
			end[i] += arrays[j][i] || 0
		}
	}
	return end
}

function addf32q(arrays) {
	let end = arrays[0].map(i => i)
	for (let j = 1; j < arrays.length; j++) {
		for (let i = 0; i < end.length; i++) {
			end.set(i, end.at(i) + arrays[j].at(i))
		}
	}
	return end.map(n => n / 4)
}

class Operator extends AudioWorkletProcessor {
	constructor(options) {
		super()
		let memory = Memory.map(options.processorOptions.buffer)
		this.memory = memory
		let channels = Array.from(Array(4), (_, i) => {
			return {
				index: i,
				sound: Memory.sound(memory, i),
				point: 0,
				playing: false,
				length: Memory.soundLength(memory, i),
			}
		})
		this.channels = channels
		this.lastStep = -1
	}
	// :)
	process(inputs, outputs, parameters) {
		let memory = this.memory
		let channels = this.channels
		let output = outputs[0]
		let step = Memory.currentStep(memory)
		let toplay = []

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
			if (channel.point >= channel.length) {
				channel.point = 0
				channel.playing = false
			} else {
				let sub = channel.sound.subarray(channel.point, channel.point + 128)
				if (channel.index == 3) {
					console.log(sub.map(i => i))
				}

				outs.push(sub)
			}
			channel.point += 128
		}

		if (outs.length) {
			output.forEach(ear => {
				add(outs).forEach((f, i) => {
					ear[i] = f
				})
			})
		}

		return true
	}
}

registerProcessor("operator", Operator)

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

class Operator extends AudioWorkletProcessor {
	constructor(options) {
		super()
		let memory = Memory.map(options.processorOptions.buffer)
		this.memory = memory

		let channels = Array.from(Array(4), (_, i) => {
			return {
				index: i,
				point: 0,
				playing: false,
				lastStep: -1,
			}
		})
		this.channels = channels
	}
	// :)
	process(inputs, outputs, parameters) {
		let memory = this.memory
		if (!Memory.playing(memory)) {
			return true
		}
		let bpm = Memory.bpm(memory)
		let channels = this.channels
		let output = outputs[0]
		let samplesPerBeat = (60 / bpm) * sampleRate

		let toplay = []
		for (let channelIndex of [0, 1, 2, 3]) {
			let channel = this.channels[channelIndex]
			channel.sound = Memory.sound(memory, channelIndex)
			channel.length = Memory.soundLength(memory, channelIndex)
			channel.speed = Memory.channelSpeed(memory, channelIndex)

			let samplesPerStep = samplesPerBeat / (4 * channel.speed)

			let currentStep = ((currentFrame / samplesPerStep) | 0) % 16

			if (currentStep != channel.lastStep) {
				Memory.currentStep(memory, channelIndex, currentStep)
				if (Memory.stepOn(memory, channelIndex, currentStep)) {
					toplay.push(channelIndex)
				}
			}
			channel.lastStep = currentStep
		}

		for (let channel of toplay) {
			channels[channel].point = 0
			channels[channel].playing = true
		}

		let outs = []

		for (let channel of channels.filter(c => c.playing)) {
			if (channel.point >= channel.length) {
				channel.playing = false
			} else {
				let sub = channel.sound.subarray(channel.point, channel.point + 128)
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

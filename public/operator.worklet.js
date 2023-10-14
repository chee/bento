import * as Memory from "./memory.js"

let sampleRate = /** @type {number} The samplerate, it never changes once the
context has been defined according to mdn */ (globalThis.sampleRate)

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
				playing: null,
				lastStep: -1,
				sound: new Float32Array(),
				speed: 1,
				end: 0,
			}
		})
		this.channels = channels
		this.tick = 0
	}
	// :)
	process(_inputs, outputs, _parameters) {
		let memory = this.memory
		if (!Memory.playing(memory)) {
			return true
		}
		this.tick += 128
		let bpm = Memory.bpm(memory)
		let channels = this.channels
		let output = outputs[0]
		let samplesPerBeat = (60 / bpm) * sampleRate

		let toplay = []
		for (let channelIndex of [0, 1, 2, 3]) {
			let channel = this.channels[channelIndex]
			// TODO consider only reloading things at the start of every loop
			channel.sound = Memory.sound(memory, channelIndex)
			channel.speed = Memory.channelSpeed(memory, channelIndex)

			let samplesPerStep = samplesPerBeat / (4 * channel.speed)

			let currentStep = ((this.tick / samplesPerStep) | 0) % 16

			if (currentStep != channel.lastStep) {
				Memory.currentStep(memory, channelIndex, currentStep)
				if (Memory.stepOn(memory, channelIndex, currentStep)) {
					// TODO trim should return 120000 for length to begin with
					let [start, end] = Memory.stepTrim(memory, channelIndex, currentStep)
					// TODO raw dog num use constant
					toplay[channelIndex] = this.channels[channelIndex].sound.subarray(
						start || 0,
						end || 120000
					)
				}
			}
			channel.lastStep = currentStep
		}

		let outs = []
		for (let channel of channels) {
			let sound = toplay[channel.index]
			if (sound) {
				channel.point = 0
				channel.playing = sound
			}
			if (channel.playing) {
				if (channel.point + 128 > channel.playing.length) {
					channel.playing = null
				} else {
					let sub = channel.playing.subarray(channel.point, channel.point + 128)
					outs.push(sub)
					channel.point += 128
				}
			}
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

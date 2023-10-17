import * as Memory from "./memory.js"

let sampleRate =
	/** @type {number} The samplerate, it never changes once the
context has been defined according to mdn */ globalThis.sampleRate

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
		// TODO fix stop button (channel.lastStep, may need a mem field for paused)
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

		for (let channel of this.channels) {
			// TODO consider only reloading things at the start of every loop
			channel.sound = Memory.sound(memory, channel.index)
			channel.speed = Memory.channelSpeed(memory, channel.index)

			let samplesPerStep = samplesPerBeat / (4 * channel.speed)

			let currentStep = ((this.tick / samplesPerStep) | 0) % 16

			if (currentStep != channel.lastStep) {
				Memory.currentStep(memory, channel.index, currentStep)
				if (Memory.stepOn(memory, channel.index, currentStep)) {
					// TODO trim should return 120000 for length to begin with
					let {start, end} = Memory.stepTrim(memory, channel.index, currentStep)

					// TODO raw dog num use constant
					toplay[channel.index] = this.channels[channel.index].sound.subarray(
						start || 0,
						end || Memory.SOUND_SIZE
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
				let out = add(outs)
				for (let i = 0; i < ear.length; i += 1) {
					ear[i] = out[i]
				}
			})
		}

		return true
	}
}

registerProcessor("operator", Operator)

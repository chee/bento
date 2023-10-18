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

/**
 * @param {import("./memory.js").SoundDetails} soundDetails
 * @returns {import("./memory.js").SoundDetails}
 */
function alter(soundDetails) {
	let {
		sound: originalSound,
		trim,
		soundLength,
		reversed,
		gain,
		attack,
		release,
	} = soundDetails

	let sound = originalSound.subarray(trim.start, trim.end || soundLength)

	if (gain || attack || release || reversed) {
		let output = new Float32Array(sound.length)
		// gain is a number from 0-12
		// TODO make this non-linear using some kind of math
		let gm = 1 * ((13 - gain) / 12)
		for (let i = 0; i < sound.length; i++) {
			let targetIndex = reversed ? sound.length - i : i
			output[targetIndex] = sound[i] * gm
			// TODO apply envelope
		}
		sound = output
	}
	return {...soundDetails, sound}
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
				lastStep: -1,
				/** @type {import("./memory.js").SoundDetails} */
				alteredSound: null,
				speed: 1,
				end: 0,
			}
		})
		this.channels = channels
		this.tick = 0
	}

	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
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

		let activeChannelFrames = []

		for (let channel of channels) {
			// TODO consider only reloading things at the start of every loop
			//
			// TODO also make some get* helper functions in memory.js for the
			// things needed in this worklet
			channel.speed = Memory.channelSpeed(memory, channel.index)
			let length = Memory.channelLength(memory, channel.index)

			let samplesPerStep = samplesPerBeat / (4 * channel.speed)

			let currentStep = ((this.tick / samplesPerStep) | 0) % length

			if (currentStep != channel.lastStep) {
				Memory.currentStep(memory, channel.index, currentStep)
				let soundDetails = Memory.getSoundDetails(
					memory,
					channel.index,
					currentStep
				)
				if (soundDetails.on) {
					channel.point = 0
					channel.alteredSound = alter(soundDetails)
				}
			}

			channel.lastStep = currentStep

			if (channel.alteredSound) {
				if (channel.point + 128 > channel.alteredSound.sound.length) {
					channel.alteredSound = null
				} else {
					let frame = channel.alteredSound.sound.subarray(
						channel.point,
						channel.point + 128
					)

					activeChannelFrames.push(frame)
					channel.point += 128
				}
			}
		}

		if (activeChannelFrames.length) {
			for (let ear of output) {
				let out = add(activeChannelFrames)
				for (let i = 0; i < ear.length; i += 1) {
					ear[i] = out[i]
				}
			}
		}

		return true
	}
}

registerProcessor("operator", Operator)

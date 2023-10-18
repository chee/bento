import * as Memory from "./memory.js"
import {
	Samplerate,
	Converter,
} from "./vendor/@toots/libsamplerate.js/dist/libsamplerate_browser.js"

/** @type {number} The samplerate, it never changes once the context has been
defined according to mdn */
let sampleRate = globalThis.sampleRate

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
	let {sound: originalSound, trim, soundLength, reversed} = soundDetails

	let sound = originalSound.subarray(trim.start, trim.end || soundLength)

	if (reversed) {
		sound = sound.reverse()
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
				lastRealSound: new Float32Array(),
				realSound: new Float32Array(),
				pitchedSounds: {},
				/** @type {import("./memory.js").SoundDetails} */
				alteredSound: null,
				speed: 1,
				end: 0,
			}
		})
		this.channels = channels
		this.tick = 0
	}
	repitch(cidx) {
		let resampler = new Samplerate(Converter.FASTEST)
		let channel = this.channels[cidx]
		let sound = channel.alteredSound?.sound || channel.realSound
		// lol,
		for (let pitch of [
			//-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1,
			1, 2, 3, 4, 5, 6,
			//7, 8, 9, 10, 11, 12,
		]) {
			let ratio = 1
			let twelfthpoweroftwo = Math.pow(2, 1 / 12)
			/** @type {(x: number) => number} */
			let op =
				Math.sign(pitch) < 0
					? x => x * twelfthpoweroftwo
					: x => x / twelfthpoweroftwo
			for (let i = 0; i < Math.abs(pitch); i++) {
				ratio = op(ratio)
			}
			let result = this.resampler.process({
				data: sound,
				ratio,
				last: false,
			})
			channel.pitchedSounds[pitch] = result.data
		}
		resampler.close()
	}
	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(_inputs, outputs, _parameters) {
		if (!this.resampler) {
			this.resampler = new Samplerate(Converter.BEST_QUALITY)
		}

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
			channel.realSound = Memory.sound(memory, channel.index)
			// TODO change to event-based or have a memory item for sound id
			// sound id can use source + time of recording
			if (channel.realSound.length != channel.lastRealSound.length) {
				this.repitch(channel.index)
			}
			channel.lastRealSound = channel.realSound
			channel.speed = Memory.channelSpeed(memory, channel.index)

			let samplesPerStep = samplesPerBeat / (4 * channel.speed)

			let currentStep = ((this.tick / samplesPerStep) | 0) % 16

			if (currentStep != channel.lastStep) {
				Memory.currentStep(memory, channel.index, currentStep)
				let soundDetails = Memory.getSoundDetails(
					memory,
					channel.index,
					currentStep
				)
				if (soundDetails.on) {
					channel.point = 0

					let pitch = ((Math.random() * 4) | 0) + 1

					channel.alteredSound = alter({
						...soundDetails,
						sound: channel.pitchedSounds[pitch] || channel.realSound,
					})
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

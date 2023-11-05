import * as Memory from "../memory/memory.js"
import {Scale, pitch2freq} from "./scale.js"

class BentoSamplerWorklet extends AudioWorkletProcessor {
	/** @param {{processorOptions: {buffer: SharedArrayBuffer, layerNumber:
	number}}} options */
	constructor(options) {
		super()
		let {buffer, layerNumber} = options.processorOptions
		if (!buffer || layerNumber == null) {
			let msg = "failed to instantiate BentoLayer, missing processorOption"
			console.error(msg, {
				buffer: typeof buffer,
				layerNumber
			})
			throw new Error(msg)
		}
		this.memory = Memory.map(buffer)
		this.layerNumber = layerNumber
		this.lastStep = -1
		this.tick = 0
		// todo caching of portions
		/** @type Map<string, Float32Array> */
		this.cache = new Map()
		this.portion = new Float32Array(0)
		this.scale = Scale.HarmonicMinor
	}

	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(_inputs, outputs, _parameters) {
		let memory = this.memory
		if (Memory.playing(memory) && Memory.paused(memory)) {
			return true
		} else if (!Memory.playing(memory)) {
			this.lastStep = -1
			this.tick = 0
			return true
		}
		this.tick += 128
		let bpm = Memory.bpm(memory)
		let samplesPerBeat = (60 / bpm) * sampleRate
		let layerNumber = this.layerNumber
		let speed = Memory.layerSpeed(memory, layerNumber)
		let samplesPerStep = samplesPerBeat / (4 * speed)
		// you can use all your current variables, but you won't want to
		let nextStep = ((this.tick / samplesPerStep) | 0) % Memory.STEPS_PER_GRID
		if (nextStep != this.lastStep) {
			Memory.incrementStep(memory, layerNumber)

			let currentStep = Memory.currentStep(memory, layerNumber)
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				let {sound, region, soundLength, reversed} = stepDetails
				this.point = 0
				this.portion = sound.subarray(region.start, region.end || soundLength)
				if (reversed) {
					this.portion = this.portion.slice().reverse()
				}
				this.playbackRate = pitch2freq(stepDetails.pitch, this.scale)
				this.pan = stepDetails.pan / 6 || 0
			}
			this.port.postMessage("step-change")
		}
		this.lastStep = nextStep
		let quantumPortion = this.portion.subarray(this.point, this.point + 128)
		let [left, right] = outputs[0]
		for (let i = 0; i < 128; i++) {
			let p = this.point
			if (i < quantumPortion.length) {
				let s0 = this.portion[p | 0] || 0
				let s1 = this.portion[(p | 0) + 1] || 0
				let s = s0 + (p % 1) * (s1 - s0) || 0
				left[i] = right[i] = s
			} else {
				left[i] = right[i] = 0
			}
			this.point += this.playbackRate
		}

		return true
	}
}

registerProcessor("bento-sampler", BentoSamplerWorklet)

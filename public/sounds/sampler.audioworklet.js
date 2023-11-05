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
		let layer = this.layerNumber
		let step = Memory.currentStep(memory, layer)
		if (step != this.lastStep) {
			let on = Memory.stepOn(memory, layer, step)
			if (on) {
				// todo only get the fields you need so Memory doesn't have to allocate
				// an object (once the worker code has stabilized)
				let stepDetails = Memory.getStepDetails(memory, layer, step)
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
		let quantumPortionLength = this.portion.length - this.point
		let [left, right] = outputs[0]
		for (let i = 0; i < 128; i++) {
			let p = this.point
			if (i < quantumPortionLength) {
				let s1 = this.portion[p | 0] || 0
				let s2 = this.portion[(p | 0) + 1] || 0
				let s = s1 + (p % 1) * (s2 - s1) || 0
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

import {DYNAMIC_RANGE} from "../memory/constants.js"
import MemoryTree from "../memory/tree/tree.js"
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
		this.memtree = MemoryTree.from(buffer)
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
		// todo share this logic
		let memtree = this.memtree
		let layerIndex = this.layerNumber
		let stepIndex = memtree.getCurrentStepIndex(layerIndex)
		if (stepIndex != this.lastStep) {
			let step = memtree.getLayerStep(layerIndex, stepIndex)

			if (step.on) {
				let sound = memtree.getSound(layerIndex)
				this.point = 0
				// todo stereo?
				this.portion = sound.left.subarray(
					step.start,
					step.end || sound.length
				)
				if (step.reversed) {
					this.portion = this.portion.slice().reverse()
				}
				this.playbackRate = pitch2freq(step.pitch, this.scale)
				this.pan = step.pan / (DYNAMIC_RANGE / 2) || 0
			}
		}

		this.lastStep = stepIndex

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

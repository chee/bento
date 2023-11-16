import Step from "../memory/tree/step.js"
import MemoryTree from "../memory/tree/tree.js"
import quietparty from "./quietparty.js"
import {Scale, pitch2playbackrate} from "./scale.js"

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
		this.lastStepIndex = -1
		this.tick = 0
		// todo caching of portions
		/** @type Map<string, Float32Array> */
		this.cache = new Map()
		this.portion = new Float32Array(0)
		this.scale = Scale.HarmonicMinor
		this.loop = false
		this.point = 0
		this.loops = 0

		/** @type {Step["view"]} */
		this.portionStep
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
		let stepIndex = memtree.getCurrentStepIndexInLayer(layerIndex)
		let layer = memtree.getLayer(layerIndex)

		if (layer.type != "sampler") {
			return false
		}

		if (memtree.stopped) {
			return true
		}

		if (stepIndex != this.lastStepIndex) {
			let step = memtree.getLayerStep(layerIndex, stepIndex)

			if (step.on) {
				let sound = memtree.getSound(layerIndex)
				this.portionStep = step
				// todo stereo?
				if (step.state == "on") {
					this.portion = sound.left.subarray(
						step.start,
						step.end || sound.length
					)
					this.point = 0
				}

				this.loops = 0
				if (step.reversed) {
					this.portion = this.portion.slice().reverse()
				}
				this.playbackRate = pitch2playbackrate(step.pitch, this.scale)
			}
		}

		this.lastStepIndex = stepIndex

		let quantumPortionLength = this.portion.length - this.point
		if (this.point > this.portion.length) {
			if (this.portionStep.loop && this.loops < this.portionStep.loop) {
				this.loops += 1
				this.point = 0
			}
		}
		let [left, right] = outputs[0]
		for (let i = 0; i < 128; i++) {
			let p = this.point
			if (i < quantumPortionLength) {
				let s1 = this.portion[p | 0] || 0
				let s2 = this.portion[(p | 0) + 1] || 0
				let s = s1 + (p % 1) * (s2 - s1) || 0

				;[left[i], right[i]] = quietparty(this.portionStep, [s, s])
			} else {
				left[i] = right[i] = 0
			}
			this.point += this.playbackRate
		}

		return true
	}
}

registerProcessor("bento-sampler", BentoSamplerWorklet)

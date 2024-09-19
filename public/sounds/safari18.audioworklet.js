import {DYNAMIC_RANGE} from "../memory/constants.js"
import MemoryTree from "../memory/tree/tree.js"
import * as Memory from "../memory/memory.js"
import quietparty from "./quietparty.js"
import Step from "../memory/tree/step.js"
import {Scale, pitch2playbackrate} from "./scale.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(DYNAMIC_RANGE + 1)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1.00001 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

class Safari18AudioWorklet extends AudioWorkletProcessor {
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
		// this.envelope = new Envelope(4, 4)
		this.lastStep = -1
		this.quiet = 0
		this.pan = 0
		this.layerNumber = layerNumber
		this.attack = 0
		this.release = 0

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
		this.map = Memory.map(buffer)

		/** @type {Step["view"]} */
		this.portionStep
	}
	// :)
	/**
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} parameters
	 */
	process(inputs, outputs, parameters) {
		let layerIndex = this.layerNumber
		let memtree = this.memtree
		let layer = memtree.getLayer(layerIndex)
		let stepIndex = memtree.getCurrentStepIndexInLayer(layerIndex)
		if (memtree.active) {
			this.tick += 128
			let speed = this.map.layerSpeeds.at(this.layerNumber)
			let samplesPerStep = memtree.samplesPerBeat / (4 * speed)
			let internalTick =
				((this.tick / samplesPerStep) | 0) % Memory.STEPS_PER_GRID
			if (internalTick != this.internalTick) {
				memtree.incrementStep(this.layerNumber)
				this.port.postMessage("step-change")
			}
			this.internalTick = internalTick
		} else {
			this.tick = 0
		}

		if (layer.type == "off") {
			return false
		} else if (memtree.playing && memtree.paused) {
			return true
		} else if (!memtree.playing) {
			this.lastStep = -1
			return true
		}

		let currentStep = memtree.getCurrentStepIndexInLayer(layerIndex)
		if (currentStep != this.lastStep) {
			let step = memtree.getLayerStep(layerIndex, currentStep)
			if (step.on) {
				this.quiet = step.quiet
				this.pan = step.pan
			}
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

		if (outputs[0]) {
			let [[left, right]] = outputs

			if (left && right) {
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
					;[left[i], right[i]] = quietparty(this, [left[i], right[i]])
					this.point += this.playbackRate
				}
			}
		}

		return true
	}
}

registerProcessor("safari-18", Safari18AudioWorklet)

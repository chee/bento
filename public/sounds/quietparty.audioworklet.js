import {DYNAMIC_RANGE} from "../memory/constants.js"
import MemoryTree from "../memory/tree/tree.js"
import quietparty from "./quietparty.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(DYNAMIC_RANGE + 1)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1.00001 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

class QuietPartyWorklet extends AudioWorkletProcessor {
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
	}
	// :)
	/**
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} parameters
	 */
	process(inputs, outputs, parameters) {
		let layerNumber = this.layerNumber
		let memtree = this.memtree
		let layer = memtree.getLayer(layerNumber)
		if (layer.type == "off") {
			return false
		} else if (memtree.playing && memtree.paused) {
			return true
		} else if (!memtree.playing) {
			this.lastStep = -1
			return true
		}

		let currentStep = memtree.getCurrentStepIndexInLayer(layerNumber)
		if (currentStep != this.lastStep) {
			let step = memtree.getLayerStep(layerNumber, currentStep)
			if (step.on) {
				this.quiet = step.quiet
				this.pan = step.pan
			}
		}

		if (inputs[0] && outputs[0]) {
			let [[leftInput, rightInput]] = inputs
			let [[leftOutput, rightOutput]] = outputs
			if (leftInput && rightInput && leftOutput && rightOutput) {
				for (let i = 0; i < 128; i++) {
					;[leftOutput[i], rightOutput[i]] = quietparty(this, [
						leftInput[i],
						rightInput[i]
					])
				}
			}
		}

		return true
	}
}

registerProcessor("quiet-party", QuietPartyWorklet)

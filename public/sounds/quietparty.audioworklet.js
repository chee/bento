import {DYNAMIC_RANGE} from "../memory/constants.js"
import MemoryTree from "../memory/tree/tree.js"

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
		this.point = 0
		// this.envelope = new Envelope(4, 4)
		this.lastStep = -1
		this.quiet = 0
		this.pan = 0
		this.layerNumber = layerNumber
		this.attack = 0
		this.release = 0
	}

	logSometimes(...args) {
		if (!(this.point % 100)) {
			console.info(...args)
		}
	}

	// :)
	/**
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} parameters
	 */
	process(inputs, outputs, parameters) {
		let input = {
			left: inputs[0][0],
			right: inputs[0][1]
		}
		let output = {
			left: outputs[0][0],
			right: outputs[0][1]
		}
		let layerNumber = this.layerNumber
		let memtree = this.memtree
		let layer = memtree.getLayer(layerNumber)
		if (layer.type == "off") {
			return true
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
				this.point = 0
				this.quiet = step.quiet
				this.pan = step.pan
				// todo this.env.a=a this.env.r=r this.env.start()
			}
		}
		let pan = (this.pan + DYNAMIC_RANGE / 2) / DYNAMIC_RANGE
		let panl = Math.cos((pan * Math.PI) / 2)
		let panr = Math.sin((pan * Math.PI) / 2)
		// let env = this.envelope.g
		// this.logSometimes(env)
		for (let i = 0; i < 128; i++) {
			// todo also apply env
			try {
				let l = input.left[i]
				let r = input.right[i]
				output.left[i] = l * qcurve[this.quiet] * panl
				output.right[i] = r * qcurve[this.quiet] * panr
			} catch {
				// it's chill
			}
		}
		this.point += 1
		return true
	}
}

registerProcessor("quiet-party", QuietPartyWorklet)

import * as Memory from "../../memory/memory.js"
import BentoAudioWorkletProcessor from "./base.audioworklet.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(Memory.DYNAMIC_RANGE)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

class QuietPartyWorklet extends BentoAudioWorkletProcessor {
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
		let memory = this.memory
		if (Memory.playing(memory) && Memory.paused(memory)) {
			return true
		} else if (!Memory.playing(memory)) {
			this.lastStep = -1
			return true
		}
		let layerNumber = this.layerNumber
		let currentStep = Memory.currentStep(memory, layerNumber)
		if (currentStep != this.lastStep) {
			// todo it'll be faster to access memory directly rather than creating
			// an object
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				this.point = 0
				this.quiet = stepDetails.quiet
				this.pan = stepDetails.pan
				// todo this.env.a=a this.env.r=r this.env.start()
			}
		}
		let pan = (this.pan + Memory.DYNAMIC_RANGE / 2) / Memory.DYNAMIC_RANGE
		let panl = Math.cos((pan * Math.PI) / 2)
		let panr = Math.sin((pan * Math.PI) / 2)
		// let env = this.envelope.g
		// this.logSometimes(env)
		for (let i = 0; i < 128; i++) {
			// todo also apply env
			output.left[i] = input.left[i] * qcurve[this.quiet] * panl
			output.right[i] = input.right[i] * qcurve[this.quiet] * panr
		}
		this.point += 1
		return true
	}
}

registerProcessor("quiet-party", QuietPartyWorklet)

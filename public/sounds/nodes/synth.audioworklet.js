import * as Memory from "../../memory/memory.js"
import * as consts from "../constants.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(Memory.DYNAMIC_RANGE)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

let scale = [
	880.0, 987.77, 1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 123.47, 130.81,
	146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66
]

class BentoSynthWorklet extends AudioWorkletProcessor {
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
		let memory = Memory.map(buffer)
		this.memory = memory
		this.layerNumber = layerNumber
		this.point = 0
		this.lastStep = -1
		this.tick = 0
		this.pan = 0
		this.reverb = 0
		this.pitch = 0
		this.djFrequency = 0
		this.djQ = 0
		this.delay = 0
		this.feedback = 0
		this.delayTime = 0
		this.vol = 1
	}

	logSometimes(...args) {
		if (!((this.tick / 128) % 100)) {
			console.info(...args)
		}
	}

	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} parameters
	 */
	process(_inputs, outputs, parameters) {
		let memory = this.memory
		let [delayTime] = outputs[consts.Output.DelayTime]
		let [feedback] = outputs[consts.Output.DelayFeedback]
		let [delay] = outputs[consts.Output.DelayInputLevel]
		let [pan] = outputs[consts.Output.Pan]
		let [reverb] = outputs[consts.Output.ReverbInputLevel]
		let [lgain] = outputs[consts.Output.LowPassGain]
		let [hgain] = outputs[consts.Output.HighPassGain]
		let [lfreq] = outputs[consts.Output.LowPassFrequency]
		let [hfreq] = outputs[consts.Output.HighPassFrequency]
		let [lq] = outputs[consts.Output.LowPassQ]
		let [hq] = outputs[consts.Output.HighPassQ]
		let [pitch] = outputs[consts.Output.Pitch]

		// todo why must we loop twice?
		for (let i = 0; i < 128; i++) {
			delay[i] = this.delay
			delayTime[i] = this.delayTime
			feedback[i] = this.feedback
			pan[i] = this.pan
			reverb[i] = this.reverb
			lq[i] = this.djQ
			hq[i] = this.djQ
			pitch[i] = scale[this.pitch] / 4
			outputs[consts.Output.Sound][0][i] = this.vol

			// if (this.djFrequency == 0) {
			// 	hgain[i] = 0
			// 	lgain[i] = 0
			// 	lfreq[i] = sampleRate / 2
			// 	hfreq[i] = 0
			// } else if (this.djFrequency > 0) {
			// 	hgain[i] = 1
			// 	lgain[i] = -1
			// 	lfreq[i] = sampleRate / 2
			// 	hfreq[i] = 20000 * this.dj // todo curve
			// } else if (this.djFrequency < 0) {
			// 	hgain[i] = -1
			// 	lgain[i] = 1
			// 	hfreq[i] = 0
			// 	lfreq[i] = 15000 - 15000 * -this.dj
			// }
		}
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
		// let numberOfActiveGrids = Memory.numberOfGridsInLayer(memory, layerNumber)
		// let gridLength = Memory.numberOfStepsInGrid(memory, layerNumber,
		// gridNumber)
		// what
		let samplesPerStep = samplesPerBeat / (4 * speed)

		// you can use all your current variables, but you won't want to
		let nextStep = ((this.tick / samplesPerStep) | 0) % Memory.STEPS_PER_GRID

		if (nextStep != this.lastStep) {
			this.vol = 0
			Memory.incrementStep(memory, layerNumber)
			let currentStep = Memory.currentStep(memory, layerNumber)
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				this.point = 0
				this.pitch = stepDetails.pitch
				this.pan = stepDetails.pan / 6 || 0
				this.vol = 1
				// this.dj = stepDetails.dj || 0
			}
		}
		this.lastStep = nextStep

		// if (this.alteredSound) {
		// 	// todo is this cutting off the last 127 samples?
		// 	if (this.point + 128 > this.alteredSound.sound.length) {
		// 		this.alteredSound = null
		// 		this.pan = 0
		// 		this.dj = 0
		// 	} else {
		// 		let portionOfSound = this.alteredSound.sound.subarray(
		// 			this.point,
		// 			this.point + 128
		// 		)
		// 		this.point += 128
		// 		let [leftear, rightear] = outputs[consts.Output.Sound]

		// 		for (let i = 0; i < 128; i++) {
		// 			// todo stereo
		// 			rightear[i] = leftear[i] = portionOfSound[i]
		// 		}
		// 	}
		// }

		return true
	}
}

registerProcessor("bento-synth", BentoSynthWorklet)

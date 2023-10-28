import * as Memory from "./memory.js"
import * as consts from "./sounds.const.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(Memory.DYNAMIC_RANGE)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

// let lcurve = new Float32Array(Memory.DYNAMIC_RANGE / 2)
// for (let i = 0; i < lcurve.length; i++) {
// 	lcurve[i] = 1 - Math.sin((i / (lcurve.length + 1)) * Math.PI * 0.5)
// }

// let rcurve = new Float32Array(Memory.DYNAMIC_RANGE / 2)
// for (let i = 0; i < lcurve.length; i++) {
// 	lcurve[i] = 1 - Math.cos((i / (lcurve.length + 1)) * Math.PI * 0.5)
// }

/**
 * @param {import("./memory.js").StepDetails} stepDetails
 * @returns {import("./memory.js").StepDetails}
 */
function alter(stepDetails) {
	let {
		// TODO take 2 channel for l + r and apply pan curves in here
		sound: originalSound,
		region,
		soundLength,
		reversed,
		quiet,
		attack,
		release
	} = stepDetails

	let sound = originalSound.subarray(region.start, region.end || soundLength)

	if (quiet || attack || release || reversed) {
		let output = new Float32Array(sound.length)
		for (let i = 0; i < sound.length; i++) {
			let targetIndex = reversed ? sound.length - i : i
			output[targetIndex] = sound[i] * qcurve[quiet]
		}
		sound = output
	}
	return {...stepDetails, sound}
}

class Bako extends AudioWorkletProcessor {
	constructor(options) {
		super()
		let {buffer, layerNumber} = options.processorOptions
		if (!buffer || layerNumber == null) {
			let msg = "failed to instantiate Bako, missing processorOption"
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
		/** @type {import("./memory.js").StepDetails} */
		this.alteredSound = null
		this.tick = 0
		this.pan = 0
		this.reverb = 0
		this.djFrequency = 0
		this.djQ = 0
		this.delay = 0
		this.feedback = 0
		this.delayTime = 0
		console.log(this.layerNumber)
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
		// TODO fix stop button (this.lastStep, may need a mem field for paused)
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

		for (let i = 0; i < 128; i++) {
			delay[i] = this.delay
			delayTime[i] = this.delayTime
			feedback[i] = this.feedback
			pan[i] = this.pan
			reverb[i] = this.reverb
			lq[i] = this.djQ
			hq[i] = this.djQ

			if (this.djFrequency == 0) {
				// todo figure out how to use constantsourcenode and if it's
				// possible to do all this logic in the DjFilter node and only
				// require outputs for `freq' and `q'
				hgain[i] = 0
				lgain[i] = 0
				lfreq[i] = sampleRate / 2
				hfreq[i] = 0
			} else if (this.djFrequency > 0) {
				hgain[i] = 1
				lgain[i] = -1
				lfreq[i] = sampleRate / 2
				hfreq[i] = 20000 * this.dj // todo curve
			} else if (this.djFrequency < 0) {
				hgain[i] = -1
				lgain[i] = 1
				hfreq[i] = 0
				lfreq[i] = 15000 - 15000 * -this.dj
			}
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
		let numberOfActiveGrids = Memory.layerGridLength(memory, layerNumber)
		//let gridLength = Memory.gridLength(memory, layerNumber, gridNumber)
		let gridLength = 16
		let samplesPerStep = samplesPerBeat / (4 * speed)

		let currentStep =
			((this.tick / samplesPerStep) | 0) % (numberOfActiveGrids * gridLength)

		if (currentStep != this.lastStep) {
			Memory.currentStep(memory, layerNumber, currentStep)
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				this.point = 0
				this.alteredSound = alter(stepDetails)
				this.pan = stepDetails.pan / 6 || 0
				// this.dj = stepDetails.dj || 0
			}
		}

		this.lastStep = currentStep

		if (this.alteredSound) {
			if (this.point + 128 > this.alteredSound.sound.length) {
				this.alteredSound = null
				this.pan = 0
				this.dj = 0
			} else {
				let portionOfSound = this.alteredSound.sound.subarray(
					this.point,
					this.point + 128
				)
				this.point += 128
				let [leftear, rightear] = outputs[consts.Output.Sound]

				for (let i = 0; i < 128; i++) {
					// todo stereo
					leftear[i] = rightear[i] = portionOfSound[i]
				}
			}
		}

		return true
	}
}

registerProcessor("bako", Bako)

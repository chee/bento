import * as Memory from "./memory.js"

/**
 * @param {import("./memory.js").StepDetails} stepDetails
 * @returns {import("./memory.js").StepDetails}
 */
function alter(stepDetails) {
	let {
		sound: originalSound,
		region,
		soundLength,
		reversed,
		gain,
		attack,
		release,
	} = stepDetails

	let sound = originalSound.subarray(region.start, region.end || soundLength)

	if (gain || attack || release || reversed) {
		let output = new Float32Array(sound.length)
		// gain is a number from 0-12
		// TODO make this non-linear using some kind of math
		let gm = 1 * ((13 - gain) / 12)
		for (let i = 0; i < sound.length; i++) {
			let targetIndex = reversed ? sound.length - i : i
			output[targetIndex] = sound[i] * gm
			// TODO apply envelope
		}
		sound = output
	}
	return {...stepDetails, sound}
}

class Bako extends AudioWorkletProcessor {
	constructor(options) {
		super()
		let memory = Memory.map(options.processorOptions.buffer)
		this.memory = memory
		this.patternNumber = options.processorOptions.patternNumber
		this.point = 0
		this.lastStep = -1
		/** @type {import("./memory.js").StepDetails} */
		this.alteredSound = null
		this.tick = 0
	}

	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(_inputs, outputs, _parameters) {
		let [output] = outputs
		// TODO fix stop button (this.lastStep, may need a mem field for paused)
		let memory = this.memory
		if (!Memory.playing(memory) /*|| Memory.paused(memory)*/) {
			return true
		}
		this.tick += 128
		let bpm = Memory.bpm(memory)
		let samplesPerBeat = (60 / bpm) * sampleRate
		// TODO do i need to use `this'? or can i let above the class
		let patternNumber = this.patternNumber
		let speed = Memory.patternSpeed(memory, patternNumber)
		let length = Memory.patternLength(memory, patternNumber)
		let samplesPerStep = samplesPerBeat / (4 * speed)
		let currentStep = ((this.tick / samplesPerStep) | 0) % length

		if (currentStep != this.lastStep) {
			Memory.currentStep(memory, patternNumber, currentStep)
			let stepDetails = Memory.getStepDetails(
				memory,
				patternNumber,
				currentStep
			)
			if (stepDetails.on) {
				this.point = 0
				this.alteredSound = alter(stepDetails)
			}
		}

		this.lastStep = currentStep

		if (this.alteredSound) {
			if (this.point + 128 > this.alteredSound.sound.length) {
				this.alteredSound = null
			} else {
				let portionOfSound = this.alteredSound.sound.subarray(
					this.point,
					this.point + 128
				)
				this.point += 128
				for (let ear of output) {
					for (let i = 0; i < ear.length; i += 1) {
						ear[i] = portionOfSound[i]
					}
				}
			}
		}

		return true
	}
}

registerProcessor("bako", Bako)

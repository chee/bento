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
		quiet,
		attack,
		release
	} = stepDetails

	let sound = originalSound.subarray(region.start, region.end || soundLength)

	if (quiet || attack || release || reversed) {
		let output = new Float32Array(sound.length)
		// quiet is a number from 0-12
		// TODO make this non-linear using some kind of math
		let gm = 1 * ((13 - quiet) / 12)
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
	static parameterDescriptors = [
		{
			name: "pan",
			defaultValue: 0,
			minValue: -1,
			maxValue: 1
		}
	]
	constructor(options) {
		super()
		let memory = Memory.map(options.processorOptions.buffer)
		this.memory = memory
		this.layerNumber = options.processorOptions.layerNumber
		this.point = 0
		this.lastStep = -1
		/** @type {import("./memory.js").StepDetails} */
		this.alteredSound = null
		this.tick = 0
		this.pan = 0
	}

	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} parameters
	 */
	process(_inputs, outputs, parameters) {
		let [[leftear, rightear], [pan]] = outputs
		// TODO fix stop button (this.lastStep, may need a mem field for paused)
		let memory = this.memory
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
		// TODO do i need to use `this'? or can i let above the class
		let layerNumber = this.layerNumber
		let speed = Memory.layerSpeed(memory, layerNumber)
		let length = Memory.layerLength(memory, layerNumber)
		let samplesPerStep = samplesPerBeat / (4 * speed)
		let currentStep = ((this.tick / samplesPerStep) | 0) % length

		if (currentStep != this.lastStep) {
			Memory.currentStep(memory, layerNumber, currentStep)
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				this.point = 0
				this.alteredSound = alter(stepDetails)
				this.pan = stepDetails.pan / 6
			}
		}

		this.lastStep = currentStep

		if (this.alteredSound) {
			if (this.point + 128 > this.alteredSound.sound.length) {
				this.alteredSound = null
				this.pan = 0
			} else {
				let portionOfSound = this.alteredSound.sound.subarray(
					this.point,
					this.point + 128
				)
				this.point += 128

				for (let i = 0; i < 128; i++) {
					leftear[i] = rightear[i] = portionOfSound[i]
					pan[i] = this.pan
				}
			}
		}

		return true
	}
}

registerProcessor("bako", Bako)

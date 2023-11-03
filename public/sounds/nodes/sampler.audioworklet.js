import * as Memory from "../../memory/memory.js"
import BentoAudioWorkletProcessor from "./base.audioworklet.js"

class BentoSamplerWorklet extends BentoAudioWorkletProcessor {
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
		this.layerNumber = layerNumber
		this.point = 0
		this.lastStep = -1

		this.portion = new Float32Array(0)
		this.tick = 0
	}

	/** @param {any[]} args*/
	logSometimes(...args) {
		if (!((this.tick / 128) % 100)) {
			console.info(...args)
		}
	}

	// :)
	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(_inputs, outputs, _parameters) {
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
		let layerNumber = this.layerNumber
		let speed = Memory.layerSpeed(memory, layerNumber)
		let samplesPerStep = samplesPerBeat / (4 * speed)

		// you can use all your current variables, but you won't want to
		let nextStep = ((this.tick / samplesPerStep) | 0) % Memory.STEPS_PER_GRID

		if (nextStep != this.lastStep) {
			Memory.incrementStep(memory, layerNumber)
			let currentStep = Memory.currentStep(memory, layerNumber)
			let stepDetails = Memory.getStepDetails(memory, layerNumber, currentStep)
			if (stepDetails.on) {
				let {sound, region, soundLength, reversed} = stepDetails
				this.point = 0
				this.portion = sound.subarray(region.start, region.end || soundLength)
				if (reversed) {
					this.portion = this.portion.slice().reverse()
				}
				this.pan = stepDetails.pan / 6 || 0
			}
		}
		this.lastStep = nextStep

		let quantumPortion = this.portion.subarray(this.point, this.point + 128)

		let [left, right] = outputs[0]
		for (let i = 0; i < 128; i++) {
			let s = i < quantumPortion.length ? quantumPortion[i] : 0
			left[i] = right[i] = s
		}
		this.point += 128

		return true
	}
}

registerProcessor("bento-sampler", BentoSamplerWorklet)

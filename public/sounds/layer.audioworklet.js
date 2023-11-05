import * as Memory from "../memory/memory.js"

/*
 * the transport is kept in a worker so that it can keep time uninterupted by
 * changes in the busy main thread
 */
class BentoLayerWorklet extends AudioWorkletProcessor {
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
		this.memory = Memory.map(buffer)
		this.layerNumber = layerNumber
		this.lastStep = -1
		this.tick = 0
	}

	process() {
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
		let nextStep = (this.tick / samplesPerStep) | 0
		if (nextStep != this.lastStep) {
			Memory.incrementStep(memory, layerNumber)

			this.port.postMessage("step-change")
		}
		this.lastStep = nextStep
		return true
	}
}

registerProcessor("bento-layer", BentoLayerWorklet)

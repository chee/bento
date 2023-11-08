import MemoryTree from "../memory/tree/tree.js"

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
		this.memtree = MemoryTree.from(buffer)
		this.layerNumber = layerNumber
		this.lastStepIndex = -1
		this.tick = 0
	}

	process() {
		let memtree = this.memtree

		if (memtree.playing && memtree.paused) {
			return true
		} else if (!memtree.playing) {
			this.lastStepIndex = -1
			this.tick = 0
			return true
		}

		this.tick += 128

		if (memtree.tick(this.tick, this.layerNumber, sampleRate)) {
			this.port.postMessage("step-change")
		}

		return true
	}
}

registerProcessor("bento-layer", BentoLayerWorklet)

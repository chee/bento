import MemoryTree from "../memory/tree/tree.js"
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
		this.map = Memory.map(buffer)
		this.memtree = new MemoryTree(this.map)
		this.layerNumber = layerNumber
		this.tick = 0
	}

	process() {
		let memtree = this.memtree
		if (memtree.active) {
			this.tick += 128
			let speed = this.map.layerSpeeds.at(this.layerNumber)
			let samplesPerStep = memtree.samplesPerBeat / (4 * speed)
			let internalTick =
				((this.tick / samplesPerStep) | 0) % Memory.STEPS_PER_GRID
			if (internalTick != this.internalTick) {
				memtree.incrementStep(this.layerNumber)
				this.port.postMessage("step-change")
			}
			this.internalTick = internalTick
		} else {
			this.tick = 0
		}
		return true
	}
}

// /**
//  * @param {MemoryTree} memtree
//  * @param {number} layerNumber
//  */
// function getCurrentSpeed(memtree, layerNumber) {
// 	// todo per-grid speed causes beat drift. WHY?
// 	let currentStepIndexInLayer = memtree.getCurrentStepIndexInLayer(layerNumber)
// 	let currentStepIndex = Memory.layerStep2step(
// 		layerNumber,
// 		currentStepIndexInLayer
// 	)
// 	let currentGridG = memtree.getGrid(
// 		memtree.getStep(currentStepIndex).gridIndex
// 	)
// 	// return currentGrid.speed

// 	let currentGrid = memtree.getGrid(layerNumber * Memory.GRIDS_PER_LAYER)
// 	return currentGrid.speed
// }

registerProcessor("bento-transport", BentoLayerWorklet)

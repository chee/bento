import {
	LAYERS_PER_MACHINE,
	STEPS_PER_GRID,
	STEPS_PER_LAYER
} from "../constants.js"
import {grid2layer, grid2layerGrid} from "../convert.js"
import Step from "./step.js"

export default class Grid {
	/** @type {import("../memory").MemoryMap} */
	#mem

	/**
	 * @param {import("../memory").MemoryMap} mem
	 * @param {number} index
	 */
	constructor(mem, index) {
		this.#mem = mem
		this.index = index
		this.layerIndex = grid2layer(index)
		this.indexInLayer = grid2layerGrid(index)
		this.loops = 0
	}

	set on(val) {
		this.#mem.gridOns.set([+val], this.index)
	}

	get on() {
		return Boolean(this.#mem.gridOns.at(this.index))
	}

	get jump() {
		return this.#mem.gridJumps.at(this.index)
	}

	set jump(val) {
		this.#mem.gridJumps.set([val], this.index)
	}

	get loop() {
		return this.#mem.gridLoops.at(this.index)
	}

	set loop(val) {
		this.#mem.gridLoops.set([val], this.index)
	}

	toggle() {
		this.on = !this.on
	}

	toJSON() {
		return /** @type const */ {
			index: this.index,
			indexInLayer: this.indexInLayer,
			layerIndex: this.layerIndex,
			on: this.on,
			jump: this.jump,
			loop: this.loop
		}
	}

	get view() {
		return Object.freeze(this.toJSON())
	}

	static computedKeys = ["index", "indexInLayer", "layerIndex"]

	/** @param {Grid["view"]} from */
	paste(from) {
		for (let key in from) {
			if (Grid.computedKeys.includes(key)) {
				continue
			}
			this[key] = from[key]
		}

		let thisStepStart =
			this.layerIndex * STEPS_PER_LAYER + this.indexInLayer * STEPS_PER_GRID
		let fromStepStart =
			from.layerIndex * STEPS_PER_LAYER + from.indexInLayer * STEPS_PER_GRID

		// todo this doesn't seem quite right. a little entangled
		for (let s = 0; s < STEPS_PER_GRID; s++) {
			let thisStepIndex = thisStepStart + s

			let fromStepIndex = fromStepStart + s

			let thisStep = new Step(this.#mem, thisStepIndex)
			let fromStep = new Step(this.#mem, fromStepIndex)

			thisStep.paste(fromStep.view)
		}
	}
}

import {LayerType} from "../constants.js"
export default class Layer {
	/** @type {import("../memory").MemoryMap} */
	#mem

	/**
	 * @param {import("../memory").MemoryMap} mem
	 * @param {number} index
	 */
	constructor(mem, index) {
		this.#mem = mem
		this.index = index
	}

	get selectedGrid() {
		return this.#mem.layerSelectedGrids.at(this.index)
	}

	set selectedGrid(val) {
		this.#mem.layerSelectedGrids.set([val], this.index)
	}

	get type() {
		return (
			/** @type LayerType */ (this.#mem.layerTypes.at(this.index)) ||
			LayerType.sampler
		)
	}

	set type(val) {
		this.#mem.layerTypes.set([val], this.index)
	}

	get speed() {
		/* todo this is a shame, but i can't get per-grid speed to work */
		return this.#mem.layerSpeeds.at(this.index)
	}

	set speed(val) {
		this.#mem.layerSpeeds.set([val], this.index)
	}

	toJSON() {
		return /** @type const */ ({
			index: this.index,
			type: this.type,
			selectedGrid: this.selectedGrid,
			speed: this.speed
		})
	}

	get view() {
		return Object.freeze(this.toJSON())
	}
}

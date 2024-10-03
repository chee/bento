import {LayerType} from "../constants.js"

/**
 * @typedef {ReturnType<Layer['toJSON']>} LayerJSON
 */
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

	/** @type {keyof typeof LayerType} */
	get type() {
		let type = this.#mem.layerTypes.at(this.index)
		return {
			0: "off",
			1: "sampler",
			2: "synth"
		}[type]
	}

	set type(val) {
		this.#mem.layerTypes.set([LayerType[val]], this.index)
	}

	get speed() {
		/* todo this is a shame, but i can't get per-grid speed to work */
		return this.#mem.layerSpeeds.at(this.index)
	}

	set speed(val) {
		this.#mem.layerSpeeds.set([val], this.index)
	}

	get muted() {
		return this.#mem.layerMuteds.at(this.index)
	}

	set muted(val) {
		this.#mem.layerMuteds.set([val], this.index)
	}

	toJSON() {
		return /** @type const */ ({
			index: this.index,
			type: this.type,
			selectedGrid: this.selectedGrid,
			speed: this.speed,
			muted: this.muted
		})
	}

	get view() {
		return Object.freeze(this.toJSON())
	}
}

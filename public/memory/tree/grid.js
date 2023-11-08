import {grid2layer, grid2layerGrid} from "../convert.js"

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
	}

	set on(val) {
		this.#mem.gridOns.set([+val], this.index)
		this.#view = null
	}

	get on() {
		return Boolean(this.#mem.gridOns.at(this.index))
	}

	get jump() {
		return this.#mem.gridJumps.at(this.index)
	}

	set jump(val) {
		this.#mem.gridJumps.set([val], this.index)
		this.#view = null
	}

	get loop() {
		return this.#mem.gridLoops.at(this.index)
	}

	set loop(val) {
		this.#mem.gridLoops.set([val], this.index)
		this.#view = null
	}

	get speed() {
		return this.#mem.gridSpeeds.at(this.index)
	}

	set speed(val) {
		this.#mem.gridSpeeds.set([val], this.index)
		this.#view = null
	}

	toggle() {
		this.on = !this.on
	}

	toJSON() {
		return {
			index: this.index,
			indexInLayer: this.indexInLayer,
			layerIndex: this.layerIndex,
			on: this.on,
			jump: this.jump,
			loop: this.loop,
			speed: this.speed
		}
	}

	/** @type {ReturnType<Grid["toJSON"]>} */
	#view

	get view() {
		if (!this.#view) {
			this.#view = Object.freeze(this.toJSON())
		}
		return this.#view
	}
}

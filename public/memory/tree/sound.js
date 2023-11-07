import {SOUND_SIZE} from "../constants"

export default class Sound {
	/** @type {import("../memory").MemoryMap} */
	#mem

	/**
	 * @param {import("../memory").MemoryMap} mem
	 * @param {number} layer
	 */
	constructor(mem, layer) {
		this.#mem = mem
		this.layer = layer
	}

	/** @param {Float32Array} val */
	set data(val) {
		let start = this.layer * SOUND_SIZE
		this.#mem.layerSounds.set(val, start)
		this.#mem.soundLengths.set([val.length], this.layer)
	}

	get left() {
		return this.#mem.layerSounds.subarray(this.layer, this.layer + SOUND_SIZE)
	}

	get right() {
		return this.#mem.layerSounds.subarray(this.layer, this.layer + SOUND_SIZE)
	}

	set length(val) {
		this.#mem.soundLengths.set([val], this.layer)
	}

	get length() {
		return this.#mem.soundLengths.at(this.layer)
	}

	set detune(val) {
		this.#mem.soundDetunes.set([val], this.layer)
	}

	get detune() {
		return this.#mem.soundDetunes.at(this.layer)
	}

	toJSON() {
		return {
			layer: this.layer,
			detune: this.detune,
			length: this.length,
			left: this.left,
			right: this.right
		}
	}

	get view() {
		return Object.freeze(this.toJSON())
	}
}

import {SOUND_SIZE} from "../constants.js"

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
		this.version = 0
	}

	/** @param {Float32Array} val */
	set audio(val) {
		let start = this.layer * SOUND_SIZE
		this.#mem.layerSounds.set(val, start)
		this.#mem.soundLengths.set([val.length], this.layer)
		this.#view = null
		this.version += 1
	}

	get left() {
		return this.#mem.layerSounds.subarray(this.layer, this.layer + SOUND_SIZE)
	}

	get right() {
		return this.#mem.layerSounds.subarray(this.layer, this.layer + SOUND_SIZE)
	}

	set length(val) {
		this.#mem.soundLengths.set([val], this.layer)
		this.#view = null
	}

	get length() {
		return this.#mem.soundLengths.at(this.layer)
	}

	set detune(val) {
		this.#mem.soundDetunes.set([val], this.layer)
		this.#view = null
	}

	get detune() {
		return this.#mem.soundDetunes.at(this.layer)
	}

	toJSON() {
		return /** @type const */ ({
			layer: this.layer,
			detune: this.detune,
			length: this.length,
			left: this.left,
			right: this.right,
			version: this.version
		})
	}

	/** @type {ReturnType<Sound["toJSON"]>} */
	#view

	get view() {
		if (!this.#view) {
			this.#view = Object.freeze(this.toJSON())
		}
		return this.#view
	}
}

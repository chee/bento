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
	}

	/** @param {Float32Array} val */
	set audio(val) {
		let start = this.layer * SOUND_SIZE
		this.#mem.layerSounds.set(val, start)
		this.#mem.soundLengths.set([val.length], this.layer)
		this.#mem.soundVersions.set([this.version + 1], this.layer)
	}

	get left() {
		let start = this.layer * SOUND_SIZE
		return this.#mem.layerSounds.subarray(start, start + SOUND_SIZE)
	}

	get right() {
		let start = this.layer * SOUND_SIZE
		return this.#mem.layerSounds.subarray(start, start + SOUND_SIZE)
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

	get version() {
		return this.#mem.soundVersions.at(this.layer)
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

	get view() {
		return Object.freeze(this.toJSON())
	}
}

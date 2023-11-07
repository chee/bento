import {
	grid2layerGrid,
	step2grid,
	step2gridStep,
	step2layer,
	step2layerStep
} from "../convert"

export default class Step {
	static properties = /** @type const */ ({
		on: Boolean,
		attack: Number,
		release: Number,
		filterFrequency: Number,
		filterQ: Number,
		pan: Number,
		pitch: Number,
		quiet: Number,
		start: Number,
		end: Number,
		reversed: Boolean
	})

	/**  @type {import("../memory").MemoryMap} */
	#mem

	/**
	 * @param {import("../memory").MemoryMap} mem
	 * @param {number} index
	 */
	constructor(mem, index) {
		this.#mem = mem
		this.index = index
		this.indexInGrid = step2gridStep(index)
		this.indexInLayer = step2layerStep(index)
		this.gridIndex = step2grid(index)
		this.gridIndexInLayer = grid2layerGrid(step2grid(index))
		this.layerIndex = step2layer(index)
	}

	get on() {
		return Boolean(this.#mem.stepOns.at(this.index))
	}

	set on(val) {
		this.#mem.stepOns.set([+val], this.index)
	}

	get attack() {
		return this.#mem.stepAttacks.at(this.index)
	}

	set attack(val) {
		this.#mem.stepAttacks.set([val], this.index)
	}

	get release() {
		return this.#mem.stepReleases.at(this.index)
	}

	set release(val) {
		this.#mem.stepReleases.set([val], this.index)
	}

	get filterFrequency() {
		return this.#mem.stepFilterFrequencies.at(this.index)
	}

	set filterFrequency(val) {
		this.#mem.stepFilterFrequencies.set([val], this.index)
	}

	get filterQ() {
		return this.#mem.stepFilterQs.at(this.index)
	}

	set filterQ(val) {
		this.#mem.stepFilterQs.set([val], this.index)
	}

	get pan() {
		return this.#mem.stepPans.at(this.index)
	}

	set pan(val) {
		this.#mem.stepPans.set([val], this.index)
	}

	get pitch() {
		return this.#mem.stepPitches.at(this.index)
	}

	set pitch(val) {
		this.#mem.stepPitches.set([val], this.index)
	}

	get quiet() {
		return this.#mem.stepQuiets.at(this.index)
	}

	set quiet(val) {
		this.#mem.stepQuiets.set([val], this.index)
	}

	get start() {
		return this.#mem.stepStarts.at(this.index)
	}

	set start(val) {
		this.#mem.stepStarts.set([val], this.index)
	}

	get end() {
		return this.#mem.stepStarts.at(this.index)
	}

	set end(val) {
		this.#mem.stepEnds.set([val], this.index)
	}

	get reversed() {
		return Boolean(this.#mem.stepReverseds.at(this.index))
	}

	set reversed(val) {
		this.#mem.stepReverseds.set([+val], this.index)
	}

	/**
	 * @param {boolean} [force]
	 */
	toggle(force) {
		this.on = force == null ? !this.on : force
	}

	toJSON() {
		return /** @type const */ ({
			on: this.on,
			index: this.index,
			indexInGrid: this.indexInGrid,
			indexInLayer: this.indexInLayer,
			gridIndex: this.gridIndex,
			gridIndexInLayer: this.gridIndexInLayer,
			layerIndex: this.layerIndex,
			attack: this.attack,
			release: this.release,
			filterFrequency: this.filterFrequency,
			filterQ: this.filterQ,
			pan: this.pan,
			pitch: this.pitch,
			quiet: this.quiet,
			start: this.start,
			end: this.end,
			reversed: this.reversed
		})
	}

	get view() {
		return Object.freeze(this.toJSON())
	}

	/** @param {Step} from */
	paste(from) {
		this.attack = from.attack
		this.release = from.release
		this.filterFrequency = from.filterFrequency
		this.filterQ = from.filterQ
		this.pan = from.pan
		this.pitch = from.pitch
		this.quiet = from.quiet
		this.start = from.start
		this.end = from.end
		this.reversed = from.reversed
	}
}

import {DYNAMIC_RANGE, NUMBER_OF_KEYS} from "../constants.js"
import {
	grid2layerGrid,
	step2grid,
	step2gridStep,
	step2layer,
	step2layerStep
} from "../convert.js"

/**
 * @typedef {Step["view"]} StepView
 */

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
		this.layerIndex = step2layer(index)
		this.gridIndex = step2grid(index)
		this.gridIndexInLayer = grid2layerGrid(step2grid(index))
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
		val = Math.clamp(val, -(DYNAMIC_RANGE / 2), DYNAMIC_RANGE / 2)
		this.#mem.stepPans.set([val], this.index)
	}

	get pitch() {
		return this.#mem.stepPitches.at(this.index)
	}

	set pitch(val) {
		val = Math.clamp(val, -(NUMBER_OF_KEYS / 2), NUMBER_OF_KEYS / 2)
		this.#mem.stepPitches.set([val], this.index)
	}

	get quiet() {
		return this.#mem.stepQuiets.at(this.index)
	}

	set quiet(val) {
		val = Math.clamp(val, 0, DYNAMIC_RANGE)
		this.#mem.stepQuiets.set([val], this.index)
	}

	get start() {
		return this.#mem.stepStarts.at(this.index)
	}

	set start(val) {
		this.#mem.stepStarts.set([val], this.index)
	}

	get end() {
		return this.#mem.stepEnds.at(this.index)
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

	get loop() {
		return Boolean(this.#mem.stepLoops.at(this.index))
	}

	set loop(val) {
		this.#mem.stepLoops.set([+val], this.index)
	}

	/**
	 * @param {boolean} [force]
	 */
	toggle(force) {
		this.on = force == null ? !this.on : force
	}

	/**
	 * @param {boolean} [force]
	 */
	flip(force) {
		this.reversed = force == null ? !this.reversed : force
	}

	quieter() {}
	louder() {}
	lefter() {}
	righter() {}

	toJSON() {
		return /** @type const */ ({
			index: this.index,
			indexInGrid: this.indexInGrid,
			indexInLayer: this.indexInLayer,
			gridIndex: this.gridIndex,
			gridIndexInLayer: this.gridIndexInLayer,
			on: this.on,
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
			reversed: this.reversed,
			loop: this.loop
		})
	}

	static computedKeys = [
		"index",
		"indexInGrid",
		"indexInLayer",
		"gridIndex",
		"gridIndexInLayer"
	]

	get view() {
		return Object.freeze(this.toJSON())
	}

	/** @param {Step["view"]} from */
	paste(from) {
		for (let key in from) {
			if (Step.computedKeys.includes(key)) {
				continue
			}
			this[key] = from[key]
		}
	}
}

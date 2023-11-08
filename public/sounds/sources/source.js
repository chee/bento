import Step from "../../memory/tree/step.js"
import BentoDjFilter from "../effects/dj-filter.js"
import BentoAudioNode from "../node.js"
import {Scale} from "../scale.js"

export default class BentoSoundSource extends BentoAudioNode {
	/** @type Scale */
	scale
	// todo make getters and setters for these that perform the lerp
	/** @type number */
	attack
	/** @type number */
	decay
	/** @type number */
	sustain
	/** @type number */
	release

	/**
	 * @param {AudioContext} context
	 */
	constructor(context) {
		super(context)
		this.scale = Scale.HarmonicMinor
		this.source = new GainNode(context, {gain: 1})
		this.filter = new BentoDjFilter(context)
		this.source.connect(this.filter.in)
		this.out = new GainNode(context, {gain: 1})
		this.filter.out.connect(this.out)
	}

	/**
	 * @param {Step["view"]} step
	 */
	play(step) {
		// TODO use bpm to calculate a value for targetValueAtTime
		this.filter.freq = step.filterFrequency
		this.filter.q = step.filterQ
	}

	/**
	 * @param {AudioNode} destination
	 * @param {number?} [output]
	 * @param {number?} [input]
	 */
	connect(destination, output, input) {
		if (input != null) {
			return this.out.connect(destination, output, input)
		}
		if (output != null) {
			return this.out.connect(destination, output)
		}
		return this.out.connect(destination)
	}
}

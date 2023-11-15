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
		if (step.on) {
			this.filter.freq = step.filterFrequency
			this.filter.q = step.filterQ
		}
	}

	/** @type AudioNode */
	#destination

	/**
	 * @param {AudioNode} destination
	 * @param {number?} [output]
	 * @param {number?} [input]
	 */
	connect(destination, output, input) {
		this.#destination = destination
		if (input != null) {
			return this.out.connect(destination, output, input)
		}
		if (output != null) {
			return this.out.connect(destination, output)
		}
		return this.out.connect(destination)
	}

	destroy() {
		this.out.gain.value = 0.000001
		this.source.disconnect(this.filter.in)
		this.filter.out.disconnect(this.out)
		this.out.disconnect(this.#destination)
		this.source = null
		this.filter = null
		this.out = null
	}
}

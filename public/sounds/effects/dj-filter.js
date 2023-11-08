import BentoEffect from "./effect.js"

/**
 * @typedef {Object} BDFFilter
 * @prop {AudioParam} gain
 * @prop {AudioParam} q
 * @prop {AudioParam} freq
 */

export default class BentoDjFilter extends BentoEffect {
	/** @type BiquadFilterNode */
	#filter
	#freq = 0
	#q = 0

	/** @param {AudioContext} context */
	constructor(context) {
		super(context)
		this.context = context
		this.in = new GainNode(context, {
			gain: 1
		})
		this.#filter = new BiquadFilterNode(context, {
			type: "allpass"
		})
		this.out = this.#filter
		this.in.connect(this.#filter)
	}

	get freq() {
		return this.#freq
	}

	set freq(val) {
		let {sampleRate} = this.context
		this.#freq = val
		if (val == 0) {
			this.#filter.type = "allpass"
		} else if (val > 0) {
			this.#filter.type = "highpass"
			// todo make this good
			this.#filter.frequency.setValueAtTime(
				(sampleRate / 2) * Math.sin((val / 17) * Math.PI * 0.5),
				// todo base this on bpm
				this.context.currentTime
			)
		} else {
			this.#filter.type = "lowpass"
			this.#filter.frequency.setValueAtTime(
				((sampleRate / 2) * Math.sin((Math.abs(val) / 17) * Math.PI * 0.5)) /
					2,
				this.context.currentTime
			)
		}
	}

	get q() {
		return this.#q
	}

	set q(val) {
		this.#q = val
		this.#filter.Q.value = val / 12
	}
}

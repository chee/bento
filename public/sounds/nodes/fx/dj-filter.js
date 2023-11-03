import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

/**
 * @typedef {Object} BDFFilter
 * @prop {AudioParam} gain
 * @prop {AudioParam} q
 * @prop {AudioParam} freq
 */

export default class BentoDjFilter extends BentoAudioNode {
	/** @type {BDFFilter} */
	lo
	/** @type {BDFFilter} */
	hi

	constructor(
		/** @type {AudioContext} */
		context,
		{
			/** @type {AudioWorkletNode} */
			layer
		} = {layer: undefined}
	) {
		super(context)
		this.in = new GainNode(context, {
			gain: 1
		})
		this.out = new GainNode(context, {
			gain: 1
		})

		// todo provide boolean audioparam that can flip these vols without
		// knowledge of internals
		let logain = new GainNode(context, {gain: 0.5})
		let lo = new BiquadFilterNode(context, {
			type: "lowpass",
			frequency: context.sampleRate / 2
		})
		this.lo = {
			gain: logain.gain,
			freq: lo.frequency,
			q: lo.Q
		}

		let higain = new GainNode(context, {gain: 0.5})
		let hi = new BiquadFilterNode(context, {
			type: "highpass",
			frequency: 0
		})
		this.hi = {
			gain: higain.gain,
			freq: hi.frequency,
			q: hi.Q
		}

		this.in.connect(logain)
		this.in.connect(higain)
		logain.connect(this.out)
		higain.connect(this.out)

		if (layer) {
			layer.connect(this.lo.gain, constants.Output.LowPassGain)
			layer.connect(this.lo.freq, constants.Output.HighPassFrequency)
			layer.connect(this.lo.q, constants.Output.HighPassQ)
			layer.connect(this.hi.gain, constants.Output.HighPassGain)
			layer.connect(this.lo.freq, constants.Output.HighPassFrequency)
			layer.connect(this.lo.q, constants.Output.HighPassQ)
		}
	}
}

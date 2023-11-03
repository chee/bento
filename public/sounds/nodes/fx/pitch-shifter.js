import * as constants from "../../constants.js"
import BentoAudioNode from "../node.js"

export default class BentoPitchShifter extends BentoAudioNode {
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
			gain: 0
		})
		this.out = new GainNode(context, {
			gain: 1
		})

		let delay1 = new DelayNode(context, {maxDelayTime: 1, delayTime: 0.1})
		let delay2 = new DelayNode(context, {maxDelayTime: 1, delayTime: 0.1})
		let osc1 = new OscillatorNode(context, {
			type: "sawtooth",
			frequency: 0.01,
			detune: 0
		})
		let osc2 = new OscillatorNode(context, {
			type: "sawtooth",
			frequency: 0.01,
			detune: 0
		})
		osc1.frequency.value = 2 ** (1 / 12)
		osc1.frequency.value = 2 ** (1 / 12)

		let delay = new DelayNode(context)
		this.time = delay.delayTime
		let feedback = new DelayNode(context, {delayTime: 0})
		let ws = 0.05

		this.in.connect(delay1)
		this.in.connect(delay2)
		osc1.connect(delay1.delayTime)
		osc2.connect(delay2.delayTime)
		feedback.connect(this.in)
		delay1.connect(this.out)
		delay2.connect(this.out)

		if (layer) {
			// layer.connect(this.in.gain, constants.Output.Delay)
			// layer.connect(this.time, constants.Output.DelayTime)
			// layer.connect(this.feedback, constants.Output.DelayFeedback)
		}
	}
}

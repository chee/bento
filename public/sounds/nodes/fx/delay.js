import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

export default class BentoDelay extends BentoAudioNode {
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

		let delay = new DelayNode(context)
		this.time = delay.delayTime
		let feedback = new GainNode(context, {
			gain: 0
		})
		this.feedback = feedback.gain
		delay.connect(feedback)
		feedback.connect(delay)
		this.in.connect(delay)

		delay.connect(this.out)
		feedback.connect(this.out)

		if (layer) {
			layer.connect(this.in.gain, constants.Output.DelayInputLevel)
			layer.connect(this.time, constants.Output.DelayTime)
			layer.connect(this.feedback, constants.Output.DelayFeedback)
		}
	}
}

import BentoSoundEffect from "./effect.js"

export default class Delay extends BentoSoundEffect {
	constructor(
		/** @type {AudioContext} */
		context
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
	}
}

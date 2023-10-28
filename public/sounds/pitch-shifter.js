export default function createPitchShifter(
	/** @type {AudioContext} */
	context
) {
	let feedbackGain = new GainNode(context)
	let feedbackDelay = new DelayNode(context)
	let delay = new DelayNode(context, {maxDelayTime: 1})
	let sawtooth = new OscillatorNode(context, {
		type: "sawtooth"
	})
}

export default class PitchShiftNode extends AudioNode {
	get numberOfInputs() {
		return 1
	}
	get numberOfOutputs() {
		return 1
	}
	get channelCount() {
		return 2
	}
	get feedback() {}
	constructor(context, options) {
		super()
		this.context = context
		this.feedbackGain = new GainNode(context)
		this.delay1 = new DelayNode(context)
		this.delay2 = new DelayNode(context)
		this.osc1 = new OscillatorNode(context)
	}
}

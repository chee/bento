import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

export default class BentoDelay extends BentoAudioNode {
	/** @type {GainNode} */
	#in
	/** @type {DelayNode} */
	#delay
	/** @type {GainNode} */
	#feedback
	/** @type {GainNode} */
	#out
	constructor(
		/** @type {AudioContext} */
		context
	) {
		super(context)
		this.#in = new GainNode(context, {
			gain: 0
		})
		this.#delay = new DelayNode(context, {
			delayTime: 0
		})
		this.#feedback = new GainNode(context, {
			gain: 0
		})
		this.#in.connect(this.#delay)
		this.#delay.connect(this.#feedback)
		this.#feedback.connect(this.#delay)
		this.inputLevel = this.#in.gain
		this.time = this.#delay.delayTime
		this.feedback = this.#feedback.gain
		this.#out = new GainNode(context, {
			gain: 1
		})
		this.#delay.connect(this.#out)
		this.#feedback.connect(this.#out)
		this.in = this.#in
		this.out = this.#out
	}

	connectLayerParams(/** @type {AudioWorkletNode} */ layer) {
		layer.connect(this.inputLevel, constants.Output.DelayInputLevel)
		layer.connect(this.time, constants.Output.DelayTime)
		layer.connect(this.feedback, constants.Output.DelayFeedback)
	}

	connectInput(
		/** @type {AudioNode} */
		input
	) {
		super.connectInput(input)
		input.connect(this.#in)
	}

	disconnectInput(
		/** @type {AudioNode} */
		input
	) {
		super.disconnectInput(input)
		input.disconnect(this.#in)
	}

	connectOutput(
		/** @type {AudioNode} */
		output
	) {
		super.connectOutput(output)
		this.#delay.connect(output)
		this.#feedback.connect(output)
	}

	disconnectOutput(
		/** @type {AudioNode} */
		output
	) {
		super.disconnectOutput(output)
		output.disconnect(this.#in)
	}
}

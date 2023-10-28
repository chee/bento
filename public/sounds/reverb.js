import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

/**
 * Create a convolver from an audio buffer
 * @param {AudioBuffer} audiobuffer
 */
function createReverb(audiobuffer) {
	let convolver = (convolver.buffer = audiobuffer)
	return convolver
}

export default class BentoReverb extends BentoAudioNode {
	/** @type {GainNode} */
	#inputLevel
	/** @type {ConvolverNode} */
	#convolver
	constructor(
		/** @type {AudioContext} */
		context,
		/** @type {AudioBuffer} ir impulse response */
		ir
	) {
		super()
		this.#convolver = new ConvolverNode(context, {
			buffer: ir,
			disableNormalization: true
		})
		this.#inputLevel = new GainNode(context, {
			gain: 0
		})
		this.#inputLevel.connect(this.#convolver)
		this.inputLevel = this.#inputLevel.gain
		this.in = this.#inputLevel
		this.out = this.#convolver
	}

	setImpulseResponse(/** @type {AudioBuffer} */ ir) {
		this.#convolver.buffer = ir
	}

	connectLayerParams(/** @type {AudioWorkletNode} */ layer) {
		layer.connect(this.inputLevel, constants.Output.ReverbInputLevel)
	}

	connectInput(/** @type {AudioNode} */ input) {
		super.connectInput(input)
		input.connect(this.#inputLevel)
	}

	disconnectInput(
		/** @type {AudioNode} */
		input
	) {
		super.disconnectInput(input)
		input.disconnect(this.#inputLevel)
	}

	connectOutput(
		/** @type {AudioNode} */
		output
	) {
		super.connectOutput(output)
		this.#convolver.connect(output)
	}

	disconnectOutput(
		/** @type {AudioNode} */
		output
	) {
		super.disconnectOutput(output)
		output.disconnect(this.#convolver)
	}
}

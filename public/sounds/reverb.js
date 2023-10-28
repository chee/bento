import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

export default class BentoReverb extends BentoAudioNode {
	constructor(
		/** @type {AudioContext} */
		context,
		{
			/** @type {AudioWorkletNode} */
			layer,
			/** @type {Float32Array} */
			ir
		} = {layer: undefined, ir: undefined}
	) {
		super(context)
		this.out = new ConvolverNode(context, {
			buffer: ir,
			disableNormalization: true
		})
		this.in = new GainNode(context, {
			gain: 0
		})
		this.in.connect(this.out)

		if (layer) {
			layer.connect(this.in.gain, constants.Output.ReverbInputLevel)
		}
	}

	setImpulseResponse(/** @type {AudioBuffer} */ ir) {
		this.out.buffer = ir
	}
}

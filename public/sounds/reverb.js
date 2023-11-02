import * as constants from "../sounds.const.js"
import BentoAudioNode from "./node.js"

export default class BentoReverb extends BentoAudioNode {
	constructor(
		/** @type {AudioContext} */
		context,
		{
			/** @type {Float32Array} */
			ir
		} = {ir: undefined}
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
	}

	setImpulseResponse(/** @type {AudioBuffer} */ ir) {
		this.out.buffer = ir
	}
}

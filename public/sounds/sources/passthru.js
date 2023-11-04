// this proved to keep unreliable time. unacceptable
import BentoSoundSource from "./source.js"

export default class Passthru extends BentoSoundSource {
	/** @param {AudioContext} context */
	constructor(context) {
		super(context)
		this.in = new GainNode(context, {gain: 1})
		this.in.connect(this.source)
	}
}

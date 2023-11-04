export default class BentoAudioNode {
	/** @type {AudioNode} */
	out
	/** @param {AudioContext} context */
	constructor(context) {
		this.context = context
		this.sampleRate = context.sampleRate
	}
}

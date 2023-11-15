// this proved to keep unreliable time. unacceptable
import BentoSoundSource from "./source.js"

export default class Passthru extends BentoSoundSource {
	/** @type AudioNode */
	#source

	/**
	 * @param {AudioContext} context
	 * @param {AudioWorkletNode} node
	 */
	constructor(context, node) {
		super(context)
		node.connect(this.source)
		this.#source = node
	}

	destroy() {
		this.#source.disconnect(this.source)
		super.destroy()
	}
}

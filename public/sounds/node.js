export default class BentoAudioNode {
	inputs = new Set()
	outputs = new Set()

	constructor(/** @type {AudioContext} */ _context) {}

	/** @abstract */
	connectLayerParams(/** @type {AudioWorkletNode} */ _layer) {}

	connectInput(/** @type {AudioNode} */ input) {
		if (this.inputs.has(input)) {
			throw new Error(
				`this ${this.constructor.name} already has this ${input.constructor.name} as an input`
			)
		} else {
			this.inputs.add(input)
		}
	}

	disconnectInput(
		/** @type {AudioNode} */
		input
	) {
		if (this.inputs.has(input)) {
			this.inputs.delete(input)
		} else {
			throw new Error(
				`this ${this.constructor.name} doesn't have this ${input.constructor.name} as an input`
			)
		}
	}

	connectOutput(
		/** @type {AudioNode} */
		output
	) {
		if (this.outputs.has(output)) {
			throw new Error(
				`this ${this.constructor.name} already has this particular ${output.constructor.name} as an output`
			)
		} else {
			this.outputs.add(output)
		}
	}

	disconnectOutput(
		/** @type {AudioNode} */
		output
	) {
		if (this.outputs.has(output)) {
			this.outputs.delete(output)
		} else {
			throw new Error(
				`this ${this.constructor.name} doesn't have this ${output.constructor.name} as an input`
			)
		}
	}
}

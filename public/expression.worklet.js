import * as Memory from "./memory.js"

/**
 * @typedef {(
 // the input value (f32)
 * n: number,
 // index
 * i: number,
 // all the samples for this quantum
 * q: Float32Array,
 // samplerate
 * s: number,
 // frame
 * f: number,
 // time
 * t: number,
 // which ear
 * e: number,
 // Math
 * m: Math
 * ) => number} Expression
 */

class Expressions extends AudioWorkletProcessor {
	constructor(options) {
		super()
		/** @type {Expression} */
		this.expression = (f32, _i, _q) => f32
		this.port.onmessage = event => {
			let message = event.data
			if (message.type == "expression") {
				this.expression = new Function(
					"n",
					"i",
					"q",
					"s",
					"f",
					"t",
					"e",
					"m",
					"return (() => " + message.expression + ")()"
				)
			}
		}
	}

	/**
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(inputs, outputs, _parameters) {
		outputs[0].forEach((ear, earIndex) => {
			let input = inputs[0][earIndex]
			for (let f32index = 0; f32index < ear.length; f32index += 1) {
				ear[f32index] = this.expression(
					input[f32index],
					f32index,
					input,
					sampleRate,
					currentFrame,
					currentTime,
					earIndex,
					Math
				)
			}
		})

		return true
	}
}

registerProcessor("expressions", Expressions)

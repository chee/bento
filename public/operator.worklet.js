import * as Memory from "./memory.js"
let buffer = new SharedArrayBuffer(Memory.size)
let memory = Memory.map(buffer)

class Operator extends AudioWorkletProcessor {
	process(inputs, outputs, parameters) {
		let output = outputs[0]
		return true
	}
}

registerProcessor("operator", Operator)

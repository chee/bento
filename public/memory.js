const chanopts = Array.from(Array(4), (_, channel) => [
	// 0-16
	{name: `channel${channel}length`, type: Uint8Array, size: 1},
	// 0, 1, 2, 3, 4 (default 2)
	{name: `channel${channel}speed`, type: Uint8Array, size: 1},
	...Array.from(Array(16), (_, step) => [
		{name: `channel${channel}step${step}on`, type: Int8Array, size: 1},
		{name: `channel${channel}step${step}pitch`, type: Int8Array, size: 1},
		{name: `channel${channel}step${step}attack`, type: Uint8Array, size: 1},
		{name: `channel${channel}step${step}release`, type: Uint8Array, size: 1},
		{name: `channel${channel}step${step}start`, type: Uint8Array, size: 1},
		{name: `channel${channel}step${step}end`, type: Uint8Array, size: 1},
	]).flat(),
])

// TODO convert this to jsdoc type using magic
// TODO bitmasking to use less space?
export let arrays = [
	{name: "selected_channel", type: Uint8Array, size: 1},
	{name: "selected_step", type: Uint8Array, size: 1},
	{name: "current_step", type: Uint8Array, size: 1},
	{name: "playing", type: Uint8Array, size: 1},
	{name: "bpm", type: Uint8Array, size: 1},
	{name: "swing", type: Uint8Array, size: 1},
	{name: "space", type: Uint8Array, size: 2},
	{name: "frame", type: Float32Array, size: 128},
	// 2.5 seconds at 48000hz
	{name: `channel0sound`, type: Float32Array, size: 120000},
	{name: `channel1sound`, type: Float32Array, size: 120000},
	{name: `channel2sound`, type: Float32Array, size: 120000},
	{name: `channel3sound`, type: Float32Array, size: 120000},
	...chanopts.flat(),
]

export let size = arrays.reduce(
	(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
	0
)

/**
 * @typedef {Object} MemoryMap
 * @property {Int8Array} MemoryMap.channel
 * @property {Int8Array} MemoryMap.step
 * @property {Uint16Array} MemoryMap.bpm
 * @property {Float32Array} MemoryMap.size
 * @returns {MemoryMap}
 */
export function map(buffer) {
	let memory = {}
	let offset = 0
	for (let array of arrays) {
		// TODO handle the offset needing to be a multiple of BYTES_PER_ELEMENT

		memory[array.name] = new array.type(buffer, offset, array.size)
		offset += array.size * array.type.BYTES_PER_ELEMENT
	}
	return memory
}

/**
 * @param {MemoryMap} memory
 * @param {number} val
 * @returns {number}
 */
export function selectedChannel(memory, val) {
	if (typeof val == "number") {
		memory.selected_channel.set([val])
	}
	return memory.selected_channel.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {number} val
 * @returns {number}
 */
export function currentStep(memory, val) {
	if (typeof val == "number") {
		memory.current_step.set([val])
	}
	return memory.current_step.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {number} val
 * @returns {number}
 */
export function selectedStep(memory, val) {
	if (typeof val == "number") {
		memory.selected_step.set([val])
	}
	return memory.selected_step.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} val
 * @returns {boolean}
 */
export function playing(memory, val) {
	if (typeof val == "boolean") {
		memory.playing.set([Number(val)])
	}
	return Boolean(memory.playing.at(0))
}

/**
 * @param {MemoryMap} memory
 * @param {number} val
 * @returns {number}
 */
export function bpm(memory, val) {
	if (typeof val == "number") {
		memory.bpm.set([val])
	}
	return memory.bpm.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {number} val
 * @returns {number}
 */
export function swing(memory, val) {
	if (typeof val == "number") {
		memory.swing.set([val])
	}
	return memory.swing.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {Float32Array} sound
 * @returns {Float32Array}
 */
export function sound(memory, channel, sound) {
	if (typeof sound != "undefined") {
		memory[`channel${channel}sound`].set(sound)
	}
	return memory[`channel${channel}sound`]
}

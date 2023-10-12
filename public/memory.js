const chanopts = Array.from(Array(4), (_, channel) => [
	// 0-16
	{name: `channel${channel}length`, type: Uint8Array, size: 1},
	// 0, 1, 2, 3, 4 (default 2)
	{name: `channel${channel}speed`, type: Uint8Array, size: 1},
	//{name: `chan${index}sample`, type: Float32Array, size: Infinity lmao},
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

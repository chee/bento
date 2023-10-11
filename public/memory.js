// TODO convert this to jsdoc type using magic
export let arrays = [
	{name: "channel", type: Int8Array, size: 1},
	{name: "step", type: Int8Array, size: 1},
	{name: "bpm", type: Uint16Array, size: 1},
	{name: "frame", type: Float32Array, size: 128},
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
		memory[array.name] = new array.type(buffer, offset)
		offset += array.size * array.type.BYTES_PER_ELEMENT
	}
	return memory
}

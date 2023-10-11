export let map = [
	{name: "channel", type: Int8Array, size: 1},
	{name: "step", type: Int8Array, size: 1},
	{name: "bpm", type: UInt16Array, size: 1},
	{name: "frame", type: Float32Array, size: 128},
]

export default function create(buffer) {
	let memory = {}
	let offset = 0
	for (let mem in mems) {
		memory[mem.name] = new mem.type(buffer, offset)
		offset += mem.size * mem.type.BYTES_PER_ELEMENT
	}
	return memory
}

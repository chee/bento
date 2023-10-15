// 2.5 seconds at 48000hz
export const SOUND_SIZE = 120000
const CHANNELS = 4
const STEPS = 16
const QUANTUM = 128

// TODO swing?
export let arrays = [
	{name: "selectedChannel", type: Uint8Array, size: 1},
	{name: "selectedStep", type: Uint8Array, size: 1},
	{name: "playing", type: Uint8Array, size: 1},
	{name: "bpm", type: Uint8Array, size: 1},
	{name: "channelLengths", type: Uint8Array, size: CHANNELS},
	{name: "frame", type: Float32Array, size: QUANTUM},
	{name: "soundLengths", type: Uint32Array, size: CHANNELS},
	{name: "channelSpeeds", type: Float32Array, size: CHANNELS},
	{name: "currentSteps", type: Uint8Array, size: CHANNELS},
	{name: "stepOns", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepPitches", type: Int8Array, size: CHANNELS * STEPS},
	{name: "stepAttacks", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepReleases", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepStarts", type: Uint32Array, size: CHANNELS * STEPS},
	{name: "stepEnds", type: Uint32Array, size: CHANNELS * STEPS},
	{name: "channelSounds", type: Float32Array, size: SOUND_SIZE * CHANNELS},
]

export let size = arrays.reduce(
	(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
	0
)

/**
	for (let arrays of (await import("./public/memory.js")).arrays) {
  console.log(`* @property {${arrays.type.name}} MemoryMap.${arrays.name}`)
}
 * @typedef {Object} MemoryMap
 * @property {Uint8Array} MemoryMap.selectedChannel
 * @property {Uint8Array} MemoryMap.selectedStep
 * @property {Uint8Array} MemoryMap.playing
 * @property {Uint8Array} MemoryMap.bpm
 * @property {Uint8Array} MemoryMap.channelLengths
 * @property {Float32Array} MemoryMap.frame
 * @property {Uint32Array} MemoryMap.soundLengths
 * @property {Float32Array} MemoryMap.channelSpeeds
 * @property {Uint8Array} MemoryMap.currentSteps
 * @property {Uint8Array} MemoryMap.stepOns
 * @property {Int8Array} MemoryMap.stepPitches
 * @property {Uint8Array} MemoryMap.stepAttacks
 * @property {Uint8Array} MemoryMap.stepReleases
 * @property {Uint8Array} MemoryMap.stepStarts
 * @property {Uint8Array} MemoryMap.stepEnds
 * @property {Float32Array} MemoryMap.channelSounds
 */
/**
 * @param {SharedArrayBuffer} buffer
 * @returns {MemoryMap}
 */
export function map(buffer) {
	/** @type {MemoryMap}*/
	let memory = {} // shut up typescript it's fine
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
 * @param {number} [val]
 * @returns {number}
 */
export function selectedChannel(memory, val) {
	if (typeof val == "number") {
		memory.selectedChannel.set([val])
	}
	return memory.selectedChannel.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} [val]
 * @returns {number}
 */
export function currentStep(memory, channel, val) {
	if (typeof val == "number") {
		memory.currentSteps.set([val], channel)
	}
	return memory.currentSteps.at(channel)
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} [val]
 * @returns {number}
 */
export function channelSpeed(memory, channel, val) {
	if (typeof val == "number") {
		memory.channelSpeeds.set([val], channel)
	}
	return memory.channelSpeeds.at(channel)
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepOn(memory, channel, step, val) {
	let {stepOns} = memory
	let at = channel * STEPS + step

	if (typeof val == "boolean") {
		stepOns.set([Number(val)], at)
	}

	return Boolean(stepOns.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function selectedStep(memory, val) {
	if (typeof val == "number") {
		memory.selectedStep.set([val])
	}
	return memory.selectedStep.at(0)
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} [val]
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
 * @param {number} [val]
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
// your evening of swing has been canceled
// export function swing(memory, val) {
// 	if (typeof val == "number") {
// 		memory.swing.set([val])
// 	}
// 	return memory.swing.at(0)
// }

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {Float32Array} [sound]
 * @returns {Float32Array}
 */
export function sound(memory, channel, sound) {
	let start = channel * SOUND_SIZE
	// TODO instanceof
	if (typeof sound != "undefined") {
		memory.channelSounds.set(sound, start)
	}

	return memory.channelSounds.subarray(start, start + SOUND_SIZE)
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} [length]
 * @returns {number}
 */
export function soundLength(memory, channel, length) {
	if (typeof length == "number") {
		memory.soundLengths.set([length], channel)
	}
	return memory.soundLengths.at(channel)
}

/**
 * @typedef {Object} Trim
 * @property {number} Trim.start
 * @property {number} Trim.end
 */

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {Trim} [trim]
 * @returns {Trim}
 */
// TODO these should probably be together as stepTrims in memory
export function stepTrim(memory, channel, step, trim) {
	let offset = channel * STEPS + step
	if (typeof trim !== "undefined") {
		let {start, end} = trim
		memory.stepStarts.set([start], offset)
		memory.stepEnds.set([end], offset)
	}
	return {
		start: memory.stepStarts.at(offset),
		end: memory.stepEnds.at(offset),
	}
}

/**
 * @param {MemoryMap} memory
 * @param {Trim} [trim]
 * @returns {Trim}
 */
export function selectedStepTrim(memory, trim) {
	let channel = selectedChannel(memory)
	let step = selectedStep(memory)
	return stepTrim(memory, channel, step, trim)
}

/**
 * @param {MemoryMap} memory
 * @param {Float32Array} [val]
 * @returns {Float32Array}
 */
export function selectedChannelSound(memory, val) {
	let channel = selectedChannel(memory)
	return sound(memory, channel, val)
}

/**
 * @typedef {Object} SoundDetails
 * @property {Float32Array} SoundDetails.sound
 * @property {Object} SoundDetails.trim
 * @property {number} SoundDetails.trim.start
 * @property {number} SoundDetails.trim.end
 * @property {number} [SoundDetails.attack]
 * @property {number} [SoundDetails.release]
 * @property {number} [SoundDetails.pitch]
 */

/*
 * Some read-only functions starting with `get'
 */

/**
 * @param {MemoryMap} memory
 * @returns {SoundDetails}
 */
export function getSelectedSoundDetails(memory) {
	let sound = selectedChannelSound(memory)
	let trim = selectedStepTrim(memory)
	return {sound, trim}
}

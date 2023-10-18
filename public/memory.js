// ~3 seconds at 44.1khz
export const SOUND_SIZE = 2 ** 17
const CHANNELS = 4
const STEPS = 16
const QUANTUM = 128

// TODO swing?
export let arrays = [
	// for the trim ui experience
	{name: "trim", type: Float32Array, size: 4},
	{name: "master", type: Uint8Array, size: 16},
	{name: "channelLengths", type: Uint8Array, size: CHANNELS},
	{name: "frame", type: Float32Array, size: QUANTUM},
	{name: "soundLengths", type: Uint32Array, size: CHANNELS},
	{name: "channelGains", type: Uint8Array, size: CHANNELS},
	{name: "channelSpeeds", type: Float32Array, size: CHANNELS},
	{name: "currentSteps", type: Uint8Array, size: CHANNELS},
	{name: "stepOns", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepReverseds", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepPitches", type: Int8Array, size: CHANNELS * STEPS},
	{name: "stepGains", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepAttacks", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepReleases", type: Uint8Array, size: CHANNELS * STEPS},
	{name: "stepStarts", type: Uint32Array, size: CHANNELS * STEPS},
	{name: "stepEnds", type: Uint32Array, size: CHANNELS * STEPS},
	{name: "channelSounds", type: Float32Array, size: SOUND_SIZE * CHANNELS},
	// TODO what size is this? is it the same on every platform? hahaha
	{name: "channelWaveforms", type: Uint8ClampedArray, size: CHANNELS},
]

const BPM = 0
const SELECTED_CHANNEL = 1
const SELECTED_STEP = 2
const PLAYING = 3
const PAUSED = 4

const TRIM_START = 0
const TRIM_END = 1
const TRIM_X = 2
const X_MULTIPLIER = 3

export let size = arrays.reduce(
	(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
	0
)

/**
for (let arrays of (await import("./public/memory.js")).arrays)
console.log(`* @property {${arrays.type.name}} MemoryMap.${arrays.name}`)
 * @typedef {Object} MemoryMap
 * @property {Float32Array} MemoryMap.trim
 * @property {Uint8Array} MemoryMap.master
 * @property {Uint8Array} MemoryMap.channelLengths
 * @property {Float32Array} MemoryMap.frame
 * @property {Uint32Array} MemoryMap.soundLengths
 * @property {Float32Array} MemoryMap.channelSpeeds
 * @property {Uint8Array} MemoryMap.currentSteps
 * @property {Uint8Array} MemoryMap.stepOns
 * @property {Uint8Array} MemoryMap.stepReverseds
 * @property {Uint8Array} MemoryMap.stepGains
 * @property {Uint8Array} MemoryMap.stepAttacks
 * @property {Uint8Array} MemoryMap.stepReleases
 * @property {Uint32Array} MemoryMap.stepStarts
 * @property {Uint32Array} MemoryMap.stepEnds
 * @property {Float32Array} MemoryMap.channelSounds
 * @property {Uint8ClampedArray} MemoryMap.channelWaveform
 */
/**
 * @param {SharedArrayBuffer} buffer
 * @returns {MemoryMap}
 */
export function map(buffer) {
	/** @type {MemoryMap}*/
	// @ts-ignore: i know what i'm doing
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
 * @param {number} [val]
 * @returns {number}
 */
export function selectedChannel(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], SELECTED_CHANNEL)
	}
	return memory.master.at(SELECTED_CHANNEL)
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
 * @param {number} channel
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepReversed(memory, channel, step, val) {
	let {stepReverseds} = memory
	let at = channel * STEPS + step

	if (typeof val == "boolean") {
		stepReverseds.set([Number(val)], at)
	}

	return Boolean(stepReverseds.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepAttack(memory, channel, step, val) {
	let {stepAttacks} = memory
	let at = channel * STEPS + step

	if (typeof val == "number") {
		stepAttacks.set([val], at)
	}

	return Number(stepAttacks.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepRelease(memory, channel, step, val) {
	let {stepReleases} = memory
	let at = channel * STEPS + step

	if (typeof val == "number") {
		stepReleases.set([val], at)
	}

	return Number(stepReleases.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepPitch(memory, channel, step, val) {
	let {stepPitches} = memory
	let at = channel * STEPS + step

	if (typeof val == "number") {
		stepPitches.set([val], at)
	}

	return Number(stepPitches.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepGain(memory, channel, step, val) {
	let {stepGains} = memory
	let at = channel * STEPS + step

	if (typeof val == "number") {
		stepGains.set([val], at)
	}

	return Number(stepGains.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 */
export function toggleStep(memory, channel, step) {
	let {stepOns} = memory
	let at = channel * STEPS + step
	stepOns.set([stepOns.at(at) ^ 1], at)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function selectedStep(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], SELECTED_STEP)
	}
	return memory.master.at(SELECTED_STEP)
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function playing(memory, val) {
	if (typeof val == "boolean") {
		memory.master.set([Number(val)], PLAYING)
	}
	return Boolean(memory.master.at(PLAYING))
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function paused(memory, val) {
	if (typeof val == "boolean") {
		memory.master.set([Number(val)], PAUSED)
	}
	return Boolean(memory.master.at(PAUSED))
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} pause
 * @returns {boolean}
 */
export function togglePlaying(memory, pause = false) {
	if (!pause) {
		for (let channel of [0, 1, 2, 3]) {
			currentStep(memory, channel, 0)
		}
	}
	return playing(memory, !playing(memory))
}

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function bpm(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], BPM)
	}
	return memory.master.at(BPM)
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
 * NOTE: Sets trim start AND clears trim end AND clears trim x
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function trimStart(memory, x) {
	if (typeof x == "number") {
		memory.trim.set([x], TRIM_START)
		// note this happening
		memory.trim.set([x], TRIM_X)
		memory.trim.set([-1], TRIM_END)
	}

	return memory.trim.at(TRIM_START)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function trimX(memory, x) {
	if (typeof x == "number") memory.trim.set([x], TRIM_X)
	return memory.trim.at(TRIM_X)
}

/**
 * @param {number} l
 * @param {number} r
 * @returns {[number, number]}
 */
let lr = (l, r) => (l > r ? [r, l] : [l, r])

/**
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function trimEnd(memory, x) {
	if (typeof x == "number") {
		memory.trim.set([x], TRIM_END)
		let [start, end] = lr(trimStart(memory), trimEnd(memory))
		selectedStepTrim(memory, {
			start: start / xm(memory),
			end: end / xm(memory),
		})
	}
	return memory.trim.at(TRIM_END)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [xm]
 * @returns {number}
 */

export function xm(memory, xm) {
	if (typeof xm == "number") memory.trim.set([xm], X_MULTIPLIER)
	return memory.trim.at(X_MULTIPLIER)
}

/**
 * @param {MemoryMap} memory
 * @returns {boolean}
 */
export function trimming(memory) {
	return memory.trim.at(TRIM_START) != -1 && memory.trim.at(TRIM_END) == -1
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

/*
 * Some read-only functions starting with `get'
 */

/**
 * @typedef {Object} SoundDetails
 * @property {Float32Array} SoundDetails.sound
 * @property {number} SoundDetails.trim.soundLength the channel's soundLength
 * @property {Object} SoundDetails.trim
 * @property {number} SoundDetails.trim.start
 * @property {number} SoundDetails.trim.end
 * @property {number} SoundDetails.channel
 * @property {number} SoundDetails.step
 * @property {number} SoundDetails.attack
 * @property {number} SoundDetails.release
 * @property {number} SoundDetails.pitch
 * @property {number} SoundDetails.gain
 * @property {boolean} SoundDetails.on
 * @property {boolean} SoundDetails.reversed
 */

/**
 * @param {MemoryMap} memory
 * @param {number} channel
 * @param {number} step
 * @returns {SoundDetails}
 */
export function getSoundDetails(memory, channel, step) {
	let snd = sound(memory, channel)
	let length = soundLength(memory, channel)
	let trim = stepTrim(memory, channel, step)
	let attack = stepAttack(memory, channel, step)
	let release = stepRelease(memory, channel, step)
	let gain = stepGain(memory, channel, step)
	let pitch = stepPitch(memory, channel, step)
	let on = stepOn(memory, channel, step)
	let reversed = stepReversed(memory, channel, step)
	return {
		sound: snd,
		soundLength: length,
		trim,
		channel,
		attack,
		release,
		gain,
		pitch,
		step,
		on,
		reversed,
	}
}

/**
 * @param {MemoryMap} memory
 * @returns {SoundDetails}
 */
export function getSelectedSoundDetails(memory) {
	return getSoundDetails(memory, selectedChannel(memory), selectedStep(memory))
}

/**
 * @param {MemoryMap} memory
 * @param {Uint8ClampedArray} [val]
 * @returns {Uint8ClampedArray}
 */
export function selectedChannelWaveform(memory, val) {
	if (typeof val != undefined) {
		// memory.channelWaveform.set(val)
	}

	return memory.channelWaveform
}

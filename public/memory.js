// ~3 seconds at 44.1khz
export const SOUND_SIZE = 2 ** 17
export const NUMBER_OF_PATTERNS = 4
export const NUMBER_OF_STEPS = 16
export const QUANTUM = 128

// TODO swing?
export let arrays = [
	{name: "master", type: Uint8Array, size: 16},
	{name: "patternLengths", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{name: "frame", type: Float32Array, size: QUANTUM},
	{name: "soundLengths", type: Uint32Array, size: NUMBER_OF_PATTERNS},
	{name: "patternGains", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{name: "patternSpeeds", type: Float32Array, size: NUMBER_OF_PATTERNS},
	{name: "currentSteps", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{
		name: "stepOns",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepReverseds",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepPitches",
		type: Int8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepGains",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepAttacks",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepReleases",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{
		name: "stepStarts",
		type: Uint32Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS * 2,
	},
	{
		name: "stepEnds",
		type: Uint32Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS,
	},
	{name: "drawingRegion", type: Float32Array, size: 4},
	{
		name: "patternSounds",
		type: Float32Array,
		size: SOUND_SIZE * NUMBER_OF_PATTERNS,
	},
	// TODO what size is this? is it the same on every platform? hahaha
	//{name: "waveforms", type: Uint8ClampedArray, size: NUMBER_OF_PATTERNS *},
]

/**
 * Location of item in master control state
 * @readonly
 * @enum {number}
 */
const Master = {
	bpm: 0,
	selectedPattern: 1,
	selectedStep: 2,
	playing: 3,
	paused: 4,
}

/**
 * Location of item in the actively draawn region
 * @readonly
 * @enum {number}
 */
const DrawingRegion = {
	start: 0,
	end: 1,
	x: 2,
	xMultiplier: 3,
}

export let size = arrays.reduce(
	(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
	0
)

/**
for (let arrays of (await import("./public/memory.js")).arrays)
console.log(`* @property {${arrays.type.name}} MemoryMap.${arrays.name}`)
 * @typedef {Object} MemoryMap
 * @property {Uint8Array} MemoryMap.master
 * @property {Uint8Array} MemoryMap.patternLengths
 * @property {Float32Array} MemoryMap.frame
 * @property {Uint32Array} MemoryMap.soundLengths
 * @property {Uint8Array} MemoryMap.patternGains
 * @property {Float32Array} MemoryMap.patternSpeeds
 * @property {Uint8Array} MemoryMap.currentSteps
 * @property {Uint8Array} MemoryMap.stepOns
 * @property {Uint8Array} MemoryMap.stepReverseds
 * @property {Int8Array} MemoryMap.stepPitches
 * @property {Uint8Array} MemoryMap.stepGains
 * @property {Uint8Array} MemoryMap.stepAttacks
 * @property {Uint8Array} MemoryMap.stepReleases
 * @property {Uint32Array} MemoryMap.stepStarts
 * @property {Uint32Array} MemoryMap.stepEnds
 * @property {Float32Array} MemoryMap.drawingRegion
 * @property {Float32Array} MemoryMap.patternSounds

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
export function selectedPattern(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], Master.selectedPattern)
	}
	return memory.master.at(Master.selectedPattern)
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} [val]
 * @returns {number}
 */
export function currentStep(memory, pattern, val) {
	if (typeof val == "number") {
		memory.currentSteps.set([val], pattern)
	}
	return memory.currentSteps.at(pattern)
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} [val]
 * @returns {number}
 */
export function patternLength(memory, pattern, val) {
	if (typeof val == "number") {
		memory.patternLengths.set([val], pattern)
	}
	return memory.patternLengths.at(pattern)
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} [val]
 * @returns {number}
 */
export function patternSpeed(memory, pattern, val) {
	if (typeof val == "number") {
		memory.patternSpeeds.set([val], pattern)
	}
	return memory.patternSpeeds.at(pattern)
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepOn(memory, pattern, step, val) {
	let {stepOns} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "boolean") {
		stepOns.set([Number(val)], at)
	}

	return Boolean(stepOns.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepReversed(memory, pattern, step, val) {
	let {stepReverseds} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "boolean") {
		stepReverseds.set([Number(val)], at)
	}

	return Boolean(stepReverseds.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepAttack(memory, pattern, step, val) {
	let {stepAttacks} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepAttacks.set([val], at)
	}

	return Number(stepAttacks.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepRelease(memory, pattern, step, val) {
	let {stepReleases} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepReleases.set([val], at)
	}

	return Number(stepReleases.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepPitch(memory, pattern, step, val) {
	let {stepPitches} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepPitches.set([val], at)
	}

	return Number(stepPitches.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepGain(memory, pattern, step, val) {
	let {stepGains} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepGains.set([val], at)
	}

	return Number(stepGains.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 */
export function toggleStep(memory, pattern, step) {
	let {stepOns} = memory
	let at = pattern * NUMBER_OF_STEPS + step
	stepOns.set([stepOns.at(at) ^ 1], at)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function selectedStep(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], Master.selectedStep)
	}
	return memory.master.at(Master.selectedStep)
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function playing(memory, val) {
	if (typeof val == "boolean") {
		memory.master.set([Number(val)], Master.playing)
	}
	return Boolean(memory.master.at(Master.playing))
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function paused(memory, val) {
	if (typeof val == "boolean") {
		memory.master.set([Number(val)], Master.paused)
	}
	return Boolean(memory.master.at(Master.paused))
}

/**
 * @param {MemoryMap} memory
 * @param {boolean} pause
 * @returns {boolean}
 */
export function togglePlaying(memory, pause = false) {
	if (!pause) {
		for (let pattern of [0, 1, 2, 3]) {
			currentStep(memory, pattern, 0)
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
		memory.master.set([val], Master.bpm)
	}
	return memory.master.at(Master.bpm)
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
 * @param {number} pattern
 * @param {Float32Array} [sound]
 * @returns {Float32Array}
 */
export function sound(memory, pattern, sound) {
	let start = pattern * SOUND_SIZE
	// TODO instanceof
	if (typeof sound != "undefined") {
		memory.patternSounds.set(sound, start)
		memory.soundLengths.set([sound.length], pattern)
	}

	return memory.patternSounds.subarray(start, start + SOUND_SIZE)
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} [length]
 * @returns {number}
 */
export function soundLength(memory, pattern, length) {
	if (typeof length == "number") {
		memory.soundLengths.set([length], pattern)
	}
	return memory.soundLengths.at(pattern)
}

/**
 * NOTE: Sets drawingRegion start AND clears drawingRegion end AND clears drawingRegion x
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function drawingRegionStart(memory, x) {
	if (typeof x == "number") {
		memory.drawingRegion.set([x], DrawingRegion.start)
		// note this happening
		memory.drawingRegion.set([x], DrawingRegion.x)
		memory.drawingRegion.set([-1], DrawingRegion.end)
	}

	return memory.drawingRegion.at(DrawingRegion.start)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function drawingRegionX(memory, x) {
	if (typeof x == "number") memory.drawingRegion.set([x], DrawingRegion.x)
	return memory.drawingRegion.at(DrawingRegion.x)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [x]
 * @returns {number}
 */
export function drawingRegionEnd(memory, x) {
	if (typeof x == "number") {
		memory.drawingRegion.set([x], DrawingRegion.end)
		let [start, end] = [drawingRegionStart(memory), drawingRegionEnd(memory)]
		let details = getSelectedSoundDetails(memory)
		let m = drawingRegionXMultiplier(memory)
		;[start, end] = [start / m, end / m]
		if (start > end) {
			;[start, end] = [end, start]
		}
		if (details.reversed) {
			;[start, end] = [details.soundLength - end, details.soundLength - start]
		}
		if ((start | 0) == (end | 0)) {
			;[start, end] = [0, 0]
		}
		console.log(start, end)
		selectedStepDrawingRegion(memory, {
			start,
			end,
		})
	}
	return memory.drawingRegion.at(DrawingRegion.end)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [xm]
 * @returns {number}
 */

export function drawingRegionXMultiplier(memory, xm) {
	if (typeof xm == "number")
		memory.drawingRegion.set([xm], DrawingRegion.xMultiplier)
	return memory.drawingRegion.at(DrawingRegion.xMultiplier)
}

/**
 * @param {MemoryMap} memory
 * @returns {boolean}
 */
export function regionIsBeingDrawn(memory) {
	return (
		memory.drawingRegion.at(DrawingRegion.start) != -1 &&
		memory.drawingRegion.at(DrawingRegion.end) == -1
	)
}

/**
 * @typedef {Object} Region
 * @property {number} Region.start
 * @property {number} Region.end
 */

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {Region} [region]
 * @returns {Region}
 */
export function stepRegion(memory, pattern, step, region) {
	let offset = pattern * NUMBER_OF_STEPS + step
	if (typeof region !== "undefined") {
		let {start, end} = region
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
 * @param {Region} [region]
 * @returns {Region}
 */
export function selectedStepDrawingRegion(memory, region) {
	let pattern = selectedPattern(memory)
	let step = selectedStep(memory)
	return stepRegion(memory, pattern, step, region)
}

/**
 * @param {MemoryMap} memory
 * @param {Float32Array} [val]
 * @returns {Float32Array}
 */
export function selectedPatternSound(memory, val) {
	let pattern = selectedPattern(memory)
	return sound(memory, pattern, val)
}

/*
 * Some read-only functions starting with `get'
 */

/**
 * @typedef {Object} SoundDetails
 * @property {Float32Array} SoundDetails.sound
 * @property {number} SoundDetails.soundLength the pattern's soundLength
 * @property {Object} SoundDetails.region
 * @property {number} SoundDetails.region.start
 * @property {number} SoundDetails.region.end
 * @property {number} SoundDetails.pattern
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
 * @param {number} pattern
 * @param {number} step
 * @returns {SoundDetails}
 */
export function getSoundDetails(memory, pattern, step) {
	let snd = sound(memory, pattern)
	let length = soundLength(memory, pattern)
	let region = stepRegion(memory, pattern, step)
	let attack = stepAttack(memory, pattern, step)
	let release = stepRelease(memory, pattern, step)
	let gain = stepGain(memory, pattern, step)
	let pitch = stepPitch(memory, pattern, step)
	let on = stepOn(memory, pattern, step)
	let reversed = stepReversed(memory, pattern, step)

	return {
		sound: snd,
		soundLength: length,
		region,
		pattern,
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
	return getSoundDetails(memory, selectedPattern(memory), selectedStep(memory))
}

/**
 * @param {MemoryMap} memory
 * @param {Uint8ClampedArray} [val]
 * @returns {Uint8ClampedArray}
 */
// export function selectedPatternWaveformGraphic(memory, val) {
// 	if (typeof val != undefined) {
// 		memory.waveformGraphics.set(val, selectedPattern(memory))
// 	}

// 	return memory.waveformGraphics.at(selectedPattern(memory))
// }

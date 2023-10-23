// ~4.75 seconds at 44.1khz
export const SOUND_SIZE = 2 ** 16 * 4
export const NUMBER_OF_PATTERNS = 4
export const NUMBER_OF_STEPS = 16
export const QUANTUM = 128

// TODO swing?
export let arrays = [
	{name: "master", type: Uint8Array, size: 16},
	{name: "patternLengths", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{name: "frame", type: Float32Array, size: QUANTUM},
	{name: "soundLengths", type: Uint32Array, size: NUMBER_OF_PATTERNS},
	// this monotonic exists just to force a refresh when things change
	// user may experience unexpected behaviour if they replace a sound more than
	// 4294967295 times in one session
	{name: "soundVersions", type: Uint32Array, size: NUMBER_OF_PATTERNS},
	{name: "patternGains", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{name: "patternSpeeds", type: Float32Array, size: NUMBER_OF_PATTERNS},
	{name: "currentSteps", type: Uint8Array, size: NUMBER_OF_PATTERNS},
	{
		name: "stepOns",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepReverseds",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepPitches",
		type: Int8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepQuiets",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepPans",
		type: Int8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepAttacks",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepReleases",
		type: Uint8Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{
		name: "stepStarts",
		type: Uint32Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS * 2
	},
	{
		name: "stepEnds",
		type: Uint32Array,
		size: NUMBER_OF_PATTERNS * NUMBER_OF_STEPS
	},
	{name: "drawingRegion", type: Float32Array, size: 4},
	{
		name: "patternSounds",
		type: Float32Array,
		size: SOUND_SIZE * NUMBER_OF_PATTERNS
	}
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
	paused: 4
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
	xMultiplier: 3
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
 * @property {Uint32Array} MemoryMap.soundVersions
 * @property {Uint8Array} MemoryMap.patternGains
 * @property {Float32Array} MemoryMap.patternSpeeds
 * @property {Uint8Array} MemoryMap.currentSteps
 * @property {Uint8Array} MemoryMap.stepOns
 * @property {Uint8Array} MemoryMap.stepReverseds
 * @property {Int8Array} MemoryMap.stepPitches
 * @property {Uint8Array} MemoryMap.stepQuiets
 * @property {Uint8Array} MemoryMap.stepPans
 * @property {Uint8Array} MemoryMap.stepAttacks
 * @property {Uint8Array} MemoryMap.stepReleases
 * @property {Uint32Array} MemoryMap.stepStarts
 * @property {Uint32Array} MemoryMap.stepEnds
 * @property {Float32Array} MemoryMap.drawingRegion
 * @property {Float32Array} MemoryMap.patternSounds
 */

/**
 * @param {SharedArrayBuffer | ArrayBuffer} buffer
 * @param {MemoryMap} [from]
 * @returns {MemoryMap}
 */
export function map(buffer, from) {
	let memory = /** @type {MemoryMap}*/ ({})
	let offset = 0
	for (let arrayInfo of arrays) {
		// todo handle the offset needing to be a multiple of BYTES_PER_ELEMENT
		let array = (memory[arrayInfo.name] =
			/** @type {typeof arrayInfo.type.prototype} */ (
				new arrayInfo.type(buffer, offset, arrayInfo.size)
			))
		offset += arrayInfo.size * arrayInfo.type.BYTES_PER_ELEMENT
		if (from) {
			if (arrayInfo.name == "master") {
				array.set([from.master.at(Master.bpm)], Master.bpm)
				// not playing or paused
				array.set(
					[from.master.at(Master.selectedPattern)],
					Master.selectedPattern
				)
				array.set([from.master.at(Master.selectedStep)], Master.selectedStep)
			} else {
				array.set(from[arrayInfo.name])
			}
		}
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
 * for those who need a quiet party
 *
 * 12 should be enough dynamic range for anyone
 *
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val] between 0 and 12
 * @returns {number} between 0 and 12
 */
export function stepQuiet(memory, pattern, step, val) {
	let {stepQuiets} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepQuiets.set([val], at)
	}

	return Number(stepQuiets.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @param {number} [val] between -12 and 12
 * @returns {number} between -12 and 12
 */
export function stepPan(memory, pattern, step, val) {
	let {stepPans} = memory
	let at = pattern * NUMBER_OF_STEPS + step

	if (typeof val == "number") {
		stepPans.set([val], at)
	}

	return Number(stepPans.at(at))
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
 */
export function play(memory) {
	memory.master.set([0], Master.paused)
	memory.master.set([1], Master.playing)
}
/**
 * @param {MemoryMap} memory
 */
export function pause(memory) {
	memory.master.set([1], Master.paused)
}
/**
 * @param {MemoryMap} memory
 */
export function stop(memory) {
	memory.master.set([0], Master.playing)
	memory.master.set([0], Master.paused)
	memory.currentSteps.set(Array(NUMBER_OF_PATTERNS).fill(0))
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
	// todo instanceof
	if (typeof sound != "undefined") {
		memory.patternSounds.set(sound, start)
		fixRegions(memory, pattern)
		memory.soundLengths.set([sound.length], pattern)
		memory.soundVersions.set([memory.soundVersions.at(pattern) + 1], pattern)
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
		let details = getSelectedStepDetails(memory)
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

		selectedStepDrawingRegion(memory, {
			start,
			end
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
		end: memory.stepEnds.at(offset)
	}
}

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 */
export function clearRegions(memory, pattern) {
	memory.stepStarts.set(Array(NUMBER_OF_STEPS).fill(0), pattern)
	memory.stepEnds.set(Array(NUMBER_OF_STEPS).fill(0), pattern)
}

/**
 * todo maybe only clear the regions if they are beyond the bounds?
 * @param {MemoryMap} memory
 * @param {number} pattern
 */
export function fixRegions(memory, pattern) {
	clearRegions(memory, pattern)
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
 * @property {number} SoundDetails.pattern
 * @property {number} SoundDetails.version
 */

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @returns {SoundDetails}
 */
export function getSoundDetails(memory, pattern) {
	return {
		pattern,
		sound: sound(memory, pattern),
		soundLength: soundLength(memory, pattern),
		version: memory.soundVersions.at(pattern)
	}
}

// i cannot get @extends or @augments or &intersection to work
/**
 * @typedef {SoundDetails & {
 pattern: number
 version: number
 region: Region
 step: number
 attack: number
 release: number
 pitch: number
 quiet: number
 pan: number
 on: boolean
 reversed: boolean
}} StepDetails

 * @property {number} StepDetails.soundLength the pattern's sound's length
 * @property {number} StepDetails.pattern
 * @property {number} StepDetails.version
 * @property {Region} StepDetails.region
 * @property {number} StepDetails.step
 * @property {number} StepDetails.attack
 * @property {number} StepDetails.release
 * @property {number} StepDetails.pitch
 * @property {number} StepDetails.quiet
 * @property {number} StepDetails.pan
 * @property {boolean} StepDetails.on
 * @property {boolean} StepDetails.reversed
 */

/**
 * @param {MemoryMap} memory
 * @param {number} pattern
 * @param {number} step
 * @returns {StepDetails}
 */
export function getStepDetails(memory, pattern, step) {
	let snd = sound(memory, pattern)
	let length = soundLength(memory, pattern)
	let region = stepRegion(memory, pattern, step)
	let attack = stepAttack(memory, pattern, step)
	let release = stepRelease(memory, pattern, step)
	let quiet = stepQuiet(memory, pattern, step)
	let pan = stepQuiet(memory, pattern, step)
	let pitch = stepPitch(memory, pattern, step)
	let on = stepOn(memory, pattern, step)
	let reversed = stepReversed(memory, pattern, step)
	let version = memory.soundVersions.at(pattern)

	return {
		sound: snd,
		soundLength: length,
		region,
		pattern,
		attack,
		release,
		quiet,
		pitch,
		pan,
		step,
		on,
		reversed,
		version
	}
}

/**
 * @param {MemoryMap} memory
 * @returns {StepDetails}
 */
export function getSelectedStepDetails(memory) {
	return getStepDetails(memory, selectedPattern(memory), selectedStep(memory))
}

/**
 * copy one step's copyable details to another
 * @param {MemoryMap} memory
 * @param {number} from
 * @param {number} to
 */
export function copyStepWithinSelectedPattern(memory, from, to) {
	let pattern = selectedPattern(memory)
	let fromDetails = getStepDetails(memory, pattern, from)
	stepRegion(memory, pattern, to, fromDetails.region)
	stepQuiet(memory, pattern, to, fromDetails.quiet)
	stepPan(memory, pattern, to, fromDetails.pan)
	stepOn(memory, pattern, to, fromDetails.on)
	stepReversed(memory, pattern, to, fromDetails.reversed)

	// let version = memory.soundVersions.at(pattern)
	// let snd = sound(memory, pattern)
	// let length = soundLength(memory, pattern)
	// let attack = stepAttack(memory, pattern, step)
	// let release = stepRelease(memory, pattern, step)
	// let pitch = stepPitch(memory, pattern, step)
}

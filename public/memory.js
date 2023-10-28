// ~4.75 seconds at 44.1khz
export const SOUND_SIZE = 2 ** 16 * 4
// let NUMBER_OF_LAYERS = number_of_samplers + number_of_synths
export const LAYERS_PER_MACHINE = 4
export const GRIDS_PER_LAYER = 8
export const STEPS_PER_GRID = 16
export const STEPS_PER_LAYER = GRIDS_PER_LAYER * STEPS_PER_GRID
export const QUANTUM = 128
export const DYNAMIC_RANGE = 12
/* for a time when there are an odd number of layers */
export const LAYER_NUMBER_OFFSET = 4 - (LAYERS_PER_MACHINE % 4)

export let arrays = [
	{name: "master", type: Uint8Array, size: 16},
	/* the 0x1-GRIDS_PER_LAYER grid-length of a given layer  */
	{
		name: "numberOfGridsInLayers",
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	/* the 0x1-0x10 step-length of an individual grid  */
	{
		name: "numberOfStepsInGrids",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER
	},
	{
		name: "soundLengths",
		type: Uint32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	// this monotonic exists just to force a refresh when things change
	// user may experience unexpected behaviour if they replace a sound more than
	// 4294967295 times in one session
	{
		name: "soundVersions",
		type: Int32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	{
		name: "layerSelectedGrids",
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	{
		name: "layerSpeeds",
		type: Float32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	{
		name: "currentSteps",
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	{
		name: "stepOns",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepReverseds",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepPitches",
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepQuiets",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepPans",
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepAttacks",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepReleases",
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepStarts",
		type: Uint32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepEnds",
		type: Uint32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepDjFreqs",
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepDelayTimes",
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	{
		name: "stepDelayGains",
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},

	{name: "drawingRegion", type: Float32Array, size: 4},
	{
		name: "layerSounds",
		type: Float32Array,
		size: SOUND_SIZE * (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET)
	},
	{name: "mouse", type: Float32Array, size: 2},
	{name: "theme", type: Uint8Array, size: 8}
	// TODO what size is this? is it the same on every platform? hahaha
	//{name: "waveforms", type: Uint8ClampedArray, size: NUMBER_OF_LAYERS *},
]

/**
 * Location of item in master control state
 * @readonly
 * @enum {number}
 */
const Master = {
	bpm: 0,
	selectedLayer: 1,
	selectedUiStep: 2,
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
console.log(`* @prop {${arrays.type.name}} MemoryMap.${arrays.name}`)
 * @typedef {Object} MemoryMap
 * @prop {Uint8Array} MemoryMap.master
 * @prop {Uint8Array} MemoryMap.numberOfGridsInLayers
 * @prop {Uint8Array} MemoryMap.numberOfStepsInGrids
 * @prop {Float32Array} MemoryMap.frame
 * @prop {Uint32Array} MemoryMap.soundLengths
 * @prop {Uint32Array} MemoryMap.soundVersions
 * @prop {Float32Array} MemoryMap.layerSounds
 * @prop {Float32Array} MemoryMap.layerSpeeds
 * @prop {Uint8Array} MemoryMap.currentSteps
 * @prop {Uint8Array} MemoryMap.stepOns
 * @prop {Uint8Array} MemoryMap.layerSelectedGrids
 * @prop {Uint8Array} MemoryMap.stepReverseds
 * @prop {Int8Array} MemoryMap.stepPitches
 * @prop {Uint8Array} MemoryMap.stepQuiets
 * @prop {Uint8Array} MemoryMap.stepPans
 * @prop {Uint8Array} MemoryMap.stepAttacks
 * @prop {Uint8Array} MemoryMap.stepReleases
 * @prop {Uint32Array} MemoryMap.stepStarts
 * @prop {Uint32Array} MemoryMap.stepEnds
 * @prop {Float32Array} MemoryMap.drawingRegion
 * @prop {Float32Array} MemoryMap.mouse
 * @prop {Float32Array} MemoryMap.stepDjFreqs
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
			// TODO export some kind of `Memory.ALWAYS_FRESH_FIELDS`
			if (arrayInfo.name == "currentSteps") continue
			if (arrayInfo.name == "drawingRegion") continue
			// maybe move play/paused out so master can be completely ignored
			if (arrayInfo.name == "master") {
				array.set([from.master.at(Master.bpm)], Master.bpm)
				// not playing or paused
				array.set([from.master.at(Master.selectedLayer)], Master.selectedLayer)
				array.set(
					[from.master.at(Master.selectedUiStep)],
					Master.selectedUiStep
				)
			} else {
				try {
					if (arrayInfo.name in from) {
						array.set(from[arrayInfo.name])
					} else {
						console.warn(
							`tried to copy ${arrayInfo.name} from an ${from.constructor.name} without one.`
						)
					}
				} catch (error) {
					console.error(error, arrayInfo, Object.keys(from))
				}
			}
		}
	}
	return memory
}

/*
 * @returns {MemoryMap}
 */
// export function fresh() {
// 	let fresh = map(new ArrayBuffer(size))
// 	stepOn(fresh, 0, 0x0, true)
// 	stepOn(fresh, 0, 0x4, true)
// 	stepOn(fresh, 0, 0x8, true)
// 	stepOn(fresh, 0, 0xc, true)
// 	bpm(fresh, 120)
// }

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function selectedLayer(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], Master.selectedLayer)
	}
	return memory.master.at(Master.selectedLayer)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [val]
 * @returns {number}
 */
export function layerSelectedGrid(memory, layer, val) {
	if (typeof val == "number") {
		memory.layerSelectedGrids.set([val], layer)
	}
	return memory.layerSelectedGrids.at(layer)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [val]
 * @returns {number}
 */
export function currentStep(memory, layer, val) {
	if (typeof val == "number") {
		memory.currentSteps.set([val], layer)
	}
	return memory.currentSteps.at(layer)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [val]
 * @returns {number}
 */
export function numberOfGridsInLayer(memory, layer, val) {
	if (typeof val == "number") {
		memory.numberOfGridsInLayers.set([val], layer)
	}
	return memory.numberOfGridsInLayers.at(layer)
}
/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [val]
 * @returns {number}
 */
export function numberOfStepsInGrid(memory, layer, val) {
	if (typeof val == "number") {
		memory.numberOfStepsInGrids.set([val], layer)
	}
	return memory.numberOfStepsInGrids.at(layer)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [val]
 * @returns {number}
 */
export function layerSpeed(memory, layer, val) {
	if (typeof val == "number") {
		memory.layerSpeeds.set([val], layer)
	}
	return memory.layerSpeeds.at(layer)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepOn(memory, layer, step, val) {
	let {stepOns} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "boolean") {
		stepOns.set([Number(val)], at)
	}

	return Boolean(stepOns.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function stepReversed(memory, layer, step, val) {
	let {stepReverseds} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "boolean") {
		stepReverseds.set([Number(val)], at)
	}

	return Boolean(stepReverseds.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function stepReverse(memory, layer, step) {
	stepReversed(memory, layer, step, !stepReversed(memory, layer, step))
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepAttack(memory, layer, step, val) {
	let {stepAttacks} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepAttacks.set([val], at)
	}

	return Number(stepAttacks.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepRelease(memory, layer, step, val) {
	let {stepReleases} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepReleases.set([val], at)
	}

	return Number(stepReleases.at(at))
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepPitch(memory, layer, step, val) {
	let {stepPitches} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepPitches.set([val], at)
	}

	return Number(stepPitches.at(at))
}

/**
 * for those who need a quiet party
 *
 * 12 ought to be enough dynamic range for anybody
 *
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val] between 0 and 12
 * @returns {number} between 0 and 12
 */
export function stepQuiet(memory, layer, step, val) {
	let {stepQuiets} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepQuiets.set([Math.clamp(0, val, DYNAMIC_RANGE)], at)
	}

	return stepQuiets.at(at)
}

/**
 * for those who need a quieter party
 *
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function stepQuieter(memory, layer, step) {
	stepQuiet(memory, layer, step, stepQuiet(memory, layer, step) + 1)
}

/**
 * for those who need a louder party
 *
 * 12 should be enough dynamic range for anyone
 *
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function stepLouder(memory, layer, step) {
	stepQuiet(memory, layer, step, stepQuiet(memory, layer, step) - 1)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val] between -12 and 12
 * @returns {number} between -12 and 12
 */
export function stepPan(memory, layer, step, val) {
	let {stepPans} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepPans.set(
			[Math.clamp(-(DYNAMIC_RANGE / 2), val, DYNAMIC_RANGE / 2)],
			at
		)
	}

	return stepPans.at(at)
}
/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function stepPanLeft(memory, layer, step) {
	stepPan(memory, layer, step, stepPan(memory, layer, step) - 1)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function stepPanRight(memory, layer, step) {
	stepPan(memory, layer, step, stepPan(memory, layer, step) + 1)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 */
export function toggleStep(memory, layer, step) {
	let {stepOns} = memory
	let at = layer * STEPS_PER_LAYER + step
	stepOns.set([stepOns.at(at) ^ 1], at)
}

/**
 * @param {MemoryMap} memory
 * @param {number} [val]
 * @returns {number}
 */
export function selectedUiStep(memory, val) {
	if (typeof val == "number") {
		memory.master.set([val], Master.selectedUiStep)
	}
	return memory.master.at(Master.selectedUiStep)
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
	memory.currentSteps.set(
		Array(LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET).fill(0)
	)
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
		for (let layer of [0, 1, 2, 3]) {
			currentStep(memory, layer, 0)
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
 * @param {number} layer
 * @param {Float32Array} [sound]
 * @returns {Float32Array}
 */
export function sound(memory, layer, sound) {
	let start = layer * SOUND_SIZE
	// todo instanceof
	if (typeof sound != "undefined") {
		memory.layerSounds.set(sound, start)
		fixRegions(memory, layer)
		memory.soundLengths.set([sound.length], layer)
		memory.soundVersions.set([memory.soundVersions.at(layer) + 1], layer)
	}

	return memory.layerSounds.subarray(start, start + SOUND_SIZE)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} [length]
 * @returns {number}
 */
export function soundLength(memory, layer, length) {
	if (typeof length == "number") {
		memory.soundLengths.set([length], layer)
	}
	return memory.soundLengths.at(layer)
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
 * @param {number} layer
 * @param {number} step
 * @param {Region} [region]
 * @returns {Region}
 */
export function stepRegion(memory, layer, step, region) {
	let offset = layer * STEPS_PER_LAYER + step
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
 * @param {number} layer
 */
export function clearRegions(memory, layer) {
	// memory.stepStarts.set(Array(STEPS_PER_LAYER).fill(0), layer)
	// memory.stepEnds.set(Array(STEPS_PER_LAYER).fill(0), layer)
}

/**
 * todo maybe only clear the regions if they are beyond the bounds?
 * @param {MemoryMap} memory
 * @param {number} layer
 */
export function fixRegions(memory, layer) {
	clearRegions(memory, layer)
}

/**
 * @typedef {Object} MousePoint
 * @prop {number} x
 * @prop {number} y
 */
/**
 * @param {MemoryMap} memory
 * @param {MousePoint} [point]
 * @returns {MousePoint}
 */
export function mouse(memory, point) {
	if (point && typeof point.x == "number" && typeof point.y == "number") {
		memory.mouse.set([point.x, point.y])
	}
	return {
		x: memory.mouse.at(0),
		y: memory.mouse.at(1)
	}
}

/**
 * @param {MemoryMap} memory
 * @param {Region} [region]
 * @returns {Region}
 */
export function selectedStepDrawingRegion(memory, region) {
	let layer = selectedLayer(memory)
	let step = getActualSelectedStep(memory)
	return stepRegion(memory, layer, step, region)
}

/**
 * @param {MemoryMap} memory
 * @param {Float32Array} [val]
 * @returns {Float32Array}
 */
export function selectedLayerSound(memory, val) {
	let layer = selectedLayer(memory)
	return sound(memory, layer, val)
}

/*
 * Some read-only functions starting with `get'
 */

/**
 * @param {MemoryMap} memory
 * @returns {number}
 */
export function getSelectedGrid(memory) {
	let layer = selectedLayer(memory)
	return layerSelectedGrid(memory, layer)
}

/**
 * @param {MemoryMap} memory
 * @returns {number}
 */
export function getActualSelectedStep(memory) {
	return getSelectedGrid(memory) * STEPS_PER_GRID + selectedUiStep(memory)
}

/**
 * @typedef {Object} SoundDetails
 * @property {Float32Array} SoundDetails.sound
 * @property {number} SoundDetails.soundLength the layer's soundLength
 * @property {number} SoundDetails.layer
 * @property {number} SoundDetails.version
 */

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @returns {SoundDetails}
 */
export function getSoundDetails(memory, layer) {
	return {
		layer,
		sound: sound(memory, layer),
		soundLength: soundLength(memory, layer),
		version: memory.soundVersions.at(layer)
	}
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @returns {boolean[][]}
 */
export function getLayerGridStepOns(memory, layer) {
	let start = layer * STEPS_PER_LAYER
	let end = start + STEPS_PER_LAYER

	return Array.from(memory.stepOns.subarray(start, end))
		.map(Boolean)
		.chunk(STEPS_PER_GRID)
		.slice(0, memory.numberOfGridsInLayers.at(layer))
}

// i cannot get @extends or @augments or &intersection to work
/**
 * @typedef {SoundDetails & {
 layer: number
 version: number
 region: Region
 step: number
 uiStep: number
 grid: number
 attack: number
 release: number
 pitch: number
 quiet: number
 pan: number
 on: boolean
 reversed: boolean
}} StepDetails

 */

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @returns {StepDetails}
 */
export function getStepDetails(memory, layer, step) {
	let snd = sound(memory, layer)
	let length = soundLength(memory, layer)
	let region = stepRegion(memory, layer, step)
	let attack = stepAttack(memory, layer, step)
	let release = stepRelease(memory, layer, step)
	let quiet = stepQuiet(memory, layer, step)
	let pan = stepPan(memory, layer, step)
	let pitch = stepPitch(memory, layer, step)
	let on = stepOn(memory, layer, step)
	let reversed = stepReversed(memory, layer, step)
	// let djFreq = stepDjFreqs.at(layer, step)
	// let djQ = stepDjQs.at(layer, step)
	// let delay = stepDelayGains.at(layer, step)
	// let delayTime = stepDelayTimes.at(layer, step)
	// let reverb = stepReverbs.at(layer, step)
	let version = memory.soundVersions.at(layer)

	return {
		sound: snd,
		soundLength: length,
		region,
		layer,
		attack,
		release,
		quiet,
		pitch,
		pan,
		step,
		on,
		reversed,
		version,
		grid: Math.floor(step / STEPS_PER_GRID),
		uiStep: step % STEPS_PER_GRID
		// djFreq,
		// djQ,
		// delay,
		// delayTime,
		// reverb
	}
}

/**
 * @param {MemoryMap} memory
 * @returns {StepDetails}
 */
export function getSelectedStepDetails(memory) {
	let layer = selectedLayer(memory)
	return getStepDetails(memory, layer, getActualSelectedStep(memory))
}

/**
 * copy one step's copyable details to another
 * @param {MemoryMap} memory
 * @param {number} from
 * @param {number} to
 */
export function copyStepWithinSelectedLayerAndGrid(memory, from, to) {
	let layer = selectedLayer(memory)
	let grid = layerSelectedGrid(memory, layer)
	let fromDetails = getStepDetails(memory, layer, grid * STEPS_PER_GRID + from)

	console.log(
		`i think you want to copy from ${grid * STEPS_PER_GRID + from} to ${
			grid * STEPS_PER_GRID + to
		} correct?`
	)

	stepRegion(memory, layer, grid * STEPS_PER_GRID + to, fromDetails.region)
	stepQuiet(memory, layer, grid * STEPS_PER_GRID + to, fromDetails.quiet)
	stepPan(memory, layer, grid * STEPS_PER_GRID + to, fromDetails.pan)
	stepOn(memory, layer, grid * STEPS_PER_GRID + to, fromDetails.on)
	stepReversed(memory, layer, grid * STEPS_PER_GRID + to, fromDetails.reversed)

	// let version = memory.soundVersions.at(layer)
	// let snd = sound(memory, layer)
	// let length = soundLength(memory, layer)
	// let attack = stepAttack(memory, layer, step)
	// let release = stepRelease(memory, layer, step)
	// let pitch = stepPitch(memory, layer, step)
}

/**
 * copy one step's copyable details to another
 * @param {MemoryMap} memory
 * @param {number} from
 * @param {number} to
 */
export function copyStepWithinSelectedLayer(memory, from, to) {
	let layer = selectedLayer(memory)
	let fromDetails = getStepDetails(memory, layer, from)

	stepRegion(memory, layer, to, fromDetails.region)
	stepQuiet(memory, layer, to, fromDetails.quiet)
	stepPan(memory, layer, to, fromDetails.pan)
	stepOn(memory, layer, to, fromDetails.on)
	stepReversed(memory, layer, to, fromDetails.reversed)
}

/**
 * copy one grid's steps details to another
 * @param {MemoryMap} memory
 * @param {number} from
 * @param {number} to
 */
export function copyGridWithinSelectedLayer(memory, from, to) {
	for (let i = 0; i < STEPS_PER_GRID; i++) {
		copyStepWithinSelectedLayer(
			memory,
			from * STEPS_PER_GRID + i,
			to * STEPS_PER_GRID + i
		)
	}
}

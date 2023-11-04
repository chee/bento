import {DB_VERSION} from "../db/share.js"
import migrations from "./migrations.js"
// ~4.75 seconds at 44.1khz
// todo stereo
export const SOUND_SIZE = 2 ** 16 * 4
export const SAMPLERS_PER_MACHINE = 4
export const SYNTHS_PER_MACHINE = 1
export const LAYERS_PER_MACHINE = SAMPLERS_PER_MACHINE + SYNTHS_PER_MACHINE
export const GRIDS_PER_LAYER = 8
export const STEPS_PER_GRID = 16
export const STEPS_PER_LAYER = GRIDS_PER_LAYER * STEPS_PER_GRID
export const QUANTUM = 128
export const DYNAMIC_RANGE = 12
/* for a time when there are an odd number of layers */
export const LAYER_NUMBER_OFFSET = 4 - (LAYERS_PER_MACHINE % 4)

/**
 * @typedef {Uint8Array | Int8Array | Int32Array | Uint32Array | Float32Array} BentoTypedArray
 */

/**
 * @typedef {Object} ArrayInfo
 * @prop {new (size: number) => BentoTypedArray} type
 * @prop {number} size
 * @prop {number[]} [default]
 * @prop {number} [defaultFill]
 */

/**
 * @typedef {Record<string, ArrayInfo>} MemoryArrayDefinition
 */

/**
 * @readonly
 * @enum {number}
 */
export const LayerType = {
	sampler: 1,
	synth: 2
}

/**
 * @satisfies {MemoryArrayDefinition}
 */
export let arrays = {
	master: {type: Uint8Array, size: 16, default: [120]},
	soundLengths: {
		type: Uint32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	// this monotonic exists just to force a refresh when things change
	// user may experience unexpected behaviour if they replace a sound more than
	// 4294967295 times in one session
	soundVersions: {
		type: Int32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	layerSelectedGrids: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	layerSpeeds: {
		type: Float32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET,
		defaultFill: 1
	},
	layerTypes: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET,
		default: [
			LayerType.sampler,
			LayerType.sampler,
			LayerType.sampler,
			LayerType.sampler,
			LayerType.synth
		]
	},
	currentSteps: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET,
		defaultFill: -1
	},
	stepOns: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER,
		// let 4onthefloor = 0x8888
		//                    .toString(2)
		//                    .split("")
		//	                   .map(Number)
		default: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1]
	},
	gridOns: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		default: Array.from(
			{length: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER},
			// 1 at the start of every layer, 0 everywhere else
			(_, i) => {
				return Number(!(i % (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET)))
			}
		)
	},
	stepReverseds: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepPitches: {
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepQuiets: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepPans: {
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepAttacks: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepReleases: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepStarts: {
		type: Uint32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepEnds: {
		type: Uint32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepDjFreqs: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepDjQs: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepDelayTimes: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepDelayGains: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	drawingRegion: {type: Float32Array, size: 4},
	layerSounds: {
		type: Float32Array,
		size: SOUND_SIZE * (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) // * 2? then
		// place the right channel at layer+lpm from the left channel
	},
	mouse: {type: Float32Array, size: 2},
	theme: {type: Uint8Array, size: 8}
}

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
	paused: 4,
	dbversion: 5
}

/**
 * Location of item in the actively drawn region
 * @readonly
 * @enum {number}
 */
const DrawingRegion = {
	start: 0,
	end: 1,
	x: 2,
	xMultiplier: 3
}

export let size = Object.values(arrays).reduce(
	(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
	0
)

/**
 * @template {MemoryArrayDefinition} Arrays
 * @typedef {{[Name in keyof Arrays]: InstanceType<Arrays[Name]["type"]>}} MemoryMapOf
 */

/**
 * @typedef {MemoryMapOf<typeof arrays>} MemoryMap
 */

/**
 * @param {SharedArrayBuffer | ArrayBuffer} buffer
 * @returns {MemoryMap}
 */
export function map(buffer) {
	let memory = /** @type {MemoryMap}*/ ({})
	let offset = 0

	for (let [name, arrayInfo] of Object.entries(arrays)) {
		let description = `maping ${name} as ${arrayInfo.type.name} of ${
			arrayInfo.size * arrayInfo.type.BYTES_PER_ELEMENT
		} at ${offset}`
		try {
			console.debug(description)
			memory[name] = new arrayInfo.type(buffer, offset, arrayInfo.size)
		} catch (error) {
			console.error(error)
			throw new Error(description)
		}
		offset += arrayInfo.size * arrayInfo.type.BYTES_PER_ELEMENT
		if (
			"defaultFill" in arrayInfo &&
			memory[name].every(/** @param {number} n */ n => !n)
		) {
			memory[name].fill(arrayInfo.defaultFill)
		}
	}
	return memory
}

/*
 * load and save are very similar procedures and it is extremely tempting to make
 * them the same function, but they are not the same.
 */

/**
 * @param {MemoryMap} memory
 * @param {MemoryMap} safe
 */
export function load(memory, safe, fields = new Set(Object.keys(safe))) {
	let savedDbVersion = safe.master?.at(Master.dbversion) || 0
	for (let migrate of migrations.slice(savedDbVersion, DB_VERSION)) {
		safe = migrate(safe)
	}
	for (let [name, arrayInfo] of Object.entries(arrays)) {
		if (fields.has(name)) {
			if (name == "currentSteps") continue
			if (name == "drawingRegion") continue
			// maybe move play/paused out so master can be completely ignored
			if (name == "master") {
				bpm(memory, bpm(safe))
				selectedLayer(memory, selectedLayer(safe))
				selectedUiStep(memory, selectedUiStep(safe))
				continue
			}
			try {
				if (!(name in memory)) {
					console.warn(`can't copy ${name} from a safe which does not have it`)
					continue
				}
				if (!(name in safe)) {
					console.warn(`can't copy ${name} to a safe which does not have it`)
					continue
				}

				let content = /** @type {typeof arrayInfo.type.prototype} */ (
					safe[name]
				)
				content = content.subarray(0, memory[name].length)
				if (
					"default" in arrayInfo &&
					content.every(/** @param {number} n */ n => !n)
				) {
					content.set(arrayInfo.default)
				} else if (
					"defaultFill" in arrayInfo &&
					content.every(/** @param {number} n */ n => !n)
				) {
					content.fill(arrayInfo.defaultFill)
				}
				memory[name].set(content)
			} catch (error) {
				console.error(`error loading ${name} from safe`, error)
			}
		} else {
			console.debug(`skipping ${name} because it is not in the fields array`)
		}
	}
}

/**
 * @param {MemoryMap} memory
 * @param {MemoryMap} safe
 */
export function save(memory, safe, fields = new Set(Object.keys(memory))) {
	for (let [name] of Object.entries(arrays)) {
		if (fields.has(name)) {
			if (name == "currentSteps") continue
			if (name == "drawingRegion") continue
			// maybe move play/paused out so master can be completely ignored
			if (name == "master") {
				bpm(safe, bpm(memory))
				selectedLayer(safe, selectedLayer(memory))
				selectedUiStep(safe, selectedUiStep(memory))
				safe.master.set([DB_VERSION], Master.dbversion)
				continue
			}
			try {
				if (!(name in memory)) {
					console.warn(`can't save ${name} to a safe which does not have it`)
					continue
				}
				if (!(name in safe)) {
					console.warn(`can't save ${name} to a safe which does not have it`)
					continue
				}
				safe[name].set(memory[name])
			} catch (error) {
				console.error(`error loading ${name} from safe`, error)
			}
		} else {
			console.debug(`skipping ${name} because it is not in the fields array`)
		}
	}
}

/**
 * Returns a fresh array buffer that can be loaded
 * @returns {MemoryMap}
 */
export function fresh() {
	let arraybuffer = new ArrayBuffer(size)
	let memory = /** @type {MemoryMap}*/ ({})
	let offset = 0
	for (let [name, arrayInfo] of Object.entries(arrays)) {
		let typedarray = (memory[name] =
			/** @type {typeof arrayInfo.type.prototype} */ (
				new arrayInfo.type(arraybuffer, offset, arrayInfo.size)
			))
		if ("default" in arrayInfo) {
			typedarray.set(arrayInfo.default)
		} else if ("defaultFill" in arrayInfo) {
			typedarray.set(Array(arrayInfo.size).fill(arrayInfo.defaultFill))
		}
		offset += arrayInfo.size * arrayInfo.type.BYTES_PER_ELEMENT
	}
	memory.master.set([DB_VERSION], Master.dbversion)
	return memory
}

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
 * @returns {LayerType}
 */
export function getLayerType(memory, layer) {
	return memory.layerTypes.at(layer)
}

/**
 * @typedef {{
		layer: number
		selectedGrid: number
		type: LayerType
		currentStep: number
		speed: number
	}} LayerDetails
 */

/**
 * todo return all the step infos as an array?
 * @param {MemoryMap} memory
 * @returns {LayerDetails}
 */
export function getSelectedLayerDetails(memory) {
	let layer = memory.master.at(Master.selectedLayer)
	let selectedGrid = layerSelectedGrid(memory, layer)
	let type = getLayerType(memory, layer) || 1 // todo lol remove this 1
	let step = currentStep(memory, layer)
	let speed = layerSpeed(memory, layer)

	return {
		layer,
		selectedGrid,
		type,
		currentStep: step,
		speed
	}
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
 */
export function incrementStep(memory, layer) {
	let current = memory.currentSteps.at(layer)
	let activeGrids = Array.from(
		memory.gridOns.subarray(
			layer * GRIDS_PER_LAYER,
			layer * GRIDS_PER_LAYER + GRIDS_PER_LAYER
		)
	)
		.map((on, index) => ({index, on}))
		.filter(n => n.on)
	if (current > STEPS_PER_LAYER) {
		let grid = activeGrids[0]
		if (grid) {
			currentStep(memory, layer, grid.index * STEPS_PER_GRID)
		}
	} else if (current % STEPS_PER_GRID == STEPS_PER_GRID - 1) {
		let absoluteCurrentGrid = Math.floor(current / STEPS_PER_GRID)
		let nextGrid =
			activeGrids.find(g => g.index > absoluteCurrentGrid)?.index ||
			activeGrids[0]?.index ||
			0
		let nextStep = nextGrid * STEPS_PER_GRID
		if (activeGrids.length == 0) {
			nextStep = -1
		}

		currentStep(memory, layer, nextStep)
	} else {
		let next = current + 1
		currentStep(memory, layer, next)
	}
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
 * @param {number} grid
 * @param {boolean} [val]
 * @returns {boolean}
 */
export function gridOn(memory, layer, grid, val) {
	let {gridOns} = memory
	let at = layer * GRIDS_PER_LAYER + grid

	if (typeof val == "boolean") {
		gridOns.set([Number(val)], at)
	}

	return Boolean(gridOns.at(at))
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
 * @param {number} [val]
 * @returns {number}
 */
export function stepDjFreqs(memory, layer, step, val) {
	let {stepDjFreqs} = memory
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepDjFreqs.set([val], at)
	}

	return stepDjFreqs.at(at)
}

/**
 * @param {MemoryMap} memory
 * @param {number} layer
 * @param {number} step
 * @param {number} [val]
 * @returns {number}
 */
export function stepDjQs(memory, layer, step, val) {
	let stepDjQs = memory.stepDjQs
	let at = layer * STEPS_PER_LAYER + step

	if (typeof val == "number") {
		stepDjQs.set([val], at)
	}

	return stepDjQs.at(at)
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
		stepQuiets.set([Math.clamp(val, 0, DYNAMIC_RANGE)], at)
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
			[Math.clamp(val, -(DYNAMIC_RANGE / 2), DYNAMIC_RANGE / 2)],
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
 * @param {number} layer
 * @param {number} grid
 */
export function toggleGrid(memory, layer, grid) {
	let {gridOns} = memory
	let layerStart = layer * GRIDS_PER_LAYER
	let at = layerStart + grid
	let layerGridOns = gridOns.subarray(layerStart, layerStart + GRIDS_PER_LAYER)
	let currentState = gridOns.at(at)
	let nextState = currentState ^ 1
	// todo allow turning off the last grid in Advanced+ Mode
	if (layerGridOns.filter(Boolean).length < 2 && !nextState) {
		return
	}
	gridOns.set([nextState], at)
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
		Array(LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET).fill(-1)
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
		// todo rememeber why i turned this off?
		// fixRegions(memory, layer)
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
	memory.stepStarts.set(Array(STEPS_PER_LAYER).fill(0), layer)
	memory.stepEnds.set(Array(STEPS_PER_LAYER).fill(0), layer)
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
 freq: number
 q: number
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
	let djFreq = stepDjFreqs(memory, layer, step)
	let djQ = stepDjQs(memory, layer, step)
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
		uiStep: step % STEPS_PER_GRID,
		freq: djFreq,
		q: djQ
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
 * @param {MemoryMap} memory
 * @param {number} layer
 * @returns {StepDetails}
 */
export function getCurrentStepDetails(memory, layer) {
	return getStepDetails(memory, layer, currentStep(memory, layer))
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
	stepPitch(memory, layer, to, fromDetails.pitch)
	// attack, relese, sound
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

	let absoluteFrom = grid * STEPS_PER_GRID + from
	let absoluteTo = grid * STEPS_PER_GRID + to
	copyStepWithinSelectedLayer(memory, absoluteFrom, absoluteTo)
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
	gridOn(
		memory,
		selectedLayer(memory),
		to,
		gridOn(memory, selectedLayer(memory), from)
	)
}

/**
 * copy one grid's steps details to another
 * @param {MemoryMap} memory
 * @param {number} uiStep
 */
export function trimSelectedLayerSoundToStepRegion(memory, uiStep) {
	let layer = selectedLayer(memory)
	let grid = layerSelectedGrid(memory, layer)
	let absoluteStep = grid * STEPS_PER_GRID + uiStep
	let deets = getStepDetails(memory, layer, absoluteStep)
	let region = deets.region
	if (region.start || region.end) {
		sound(
			memory,
			layer,
			sound(memory, layer).subarray(region.start, region.end)
		)
		clearRegions(memory, layer)
	}
}

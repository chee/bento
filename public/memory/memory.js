import {DB_VERSION} from "../db/share.js"
import {setStep} from "../io/data-transfer.js"
import migrations from "./migrations.js"
// ~4.75 seconds at 44.1khz
// todo stereo
export const SOUND_SIZE = 2 ** 16 * 4
export const SAMPLERS_PER_MACHINE = 4
export const SYNTHS_PER_MACHINE = 0
export const LAYERS_PER_MACHINE = SAMPLERS_PER_MACHINE + SYNTHS_PER_MACHINE
export const GRIDS_PER_LAYER = 8
export const STEPS_PER_GRID = 16
export const STEPS_PER_LAYER = GRIDS_PER_LAYER * STEPS_PER_GRID
export const QUANTUM = 128
export const DYNAMIC_RANGE = 12
export const NUMBER_OF_KEYS = 16
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

/** @typedef {typeof LayerType[keyof typeof LayerType]} LayerType */
export const LayerType = /** @type const */ ({
	sampler: 1,
	synth: 2
})

/** @typedef {typeof Master[keyof typeof Master]} Master */
export const Master = /** @type const */ ({
	bpm: 0,
	selectedLayer: 1,
	selectedUiStep: 2,
	playing: 3,
	paused: 4,
	dbversion: 5
})

// todo when you have the energy make this shaped like:
//
// arrays.sounds.length: {type: Uint32Array, size: 123123}
//
// it'll require a db migration or a rewrite of save/load to perform the
// flattening so it's not appealing, but it will make the code better in
// memorytree
/**
 * @satisfies {MemoryArrayDefinition}
 */
export let arrays = {
	master: {
		type: Uint8Array,
		size: 16,
		default: [120]
	},
	soundLengths: {
		type: Uint32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	soundDetunes: {
		type: Int8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	layerSelectedGrids: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
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
	layerSounds: {
		type: Float32Array,
		size: SOUND_SIZE * (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) // * 2? then
		// place the right channel at layer+lpm from the left channel
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
	gridSpeeds: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: 1
	},
	gridLengths: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: STEPS_PER_GRID
	},
	gridLoops: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: STEPS_PER_GRID
	},
	gridJumps: {
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: 0
	},
	stepReverseds: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepPitchs: {
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
	stepFilterFrequencys: {
		type: Float32Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	stepFilterQs: {
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
	drawingRegion: {
		type: Float32Array,
		size: 4
	},
	theme: {type: Uint8Array, size: 16}
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
			// console.debug(description)
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
				memory.master.set([safe.master.at(Master.bpm)], Master.bpm)
				memory.master.set(
					[safe.master.at(Master.selectedLayer)],
					Master.selectedLayer
				)
				memory.master.set(
					[safe.master.at(Master.selectedUiStep)],
					Master.selectedUiStep
				)
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
				memory.master.set([safe.master.at(Master.bpm)], Master.bpm)
				memory.master.set(
					[safe.master.at(Master.selectedLayer)],
					Master.selectedLayer
				)
				memory.master.set(
					[safe.master.at(Master.selectedUiStep)],
					Master.selectedUiStep
				)
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
 * @typedef {Object} Layer
 * @prop {number} index
 *	@prop {LayerType} type
 * @prop {number} selectedGrid
 */

/**
 * @typedef {keyof Omit<Layer, "index">} LayerKey
 */

/**
 * @typedef {Object} Grid
 * @prop {number} index
 * @prop {number} indexInLayer
 * @prop {number} layer
 *	@prop {boolean} on
 *	@prop {number} speed
 * @prop {number} jump
 * @prop {number} loop
 */

/**
 * @typedef {keyof Omit<Grid, "index"|"layer"|"indexInLayer">} GridKey
 */

/**
 * @typedef {Object} Step
 * @prop {number} index
 * @prop {number} indexInLayer
 * @prop {number} indexInGrid
 * @prop {number} layer
 * @prop {number} grid

 * @prop {boolean} on
 * @prop {boolean} reversed
 * @prop {number} start
 * @prop {number} end
 * @prop {number} attack
 * @prop {number} release
 * @prop {number} pitch
 * @prop {number} quiet
 * @prop {number} pan
 * @prop {number} filterFrequency
 * @prop {number} filterQ
 */

//class Step {}

/**
 * @typedef {keyof Omit<Step,
		"layer"|"grid"|"index"|"indexInLayer"|"indexInGrid">
	} StepKey
 */

/**
 * @typedef {Object} Sound
 * @prop {number} layer
 * @prop {Float32Array} left
 * @prop {Float32Array} right
 * @prop {number} length
 * @prop {number} detune
 */

/**
 * @typedef {keyof Omit<Sound, "layer">} SoundKey
 */

/** @type {(layer: number, step: number) => number} */
export function layerStep2step(layer, step) {
	return layer * STEPS_PER_LAYER + step
}

/** @type {(layer: number, grid: number) => number} */
export function layerGrid2layer(layer, grid) {
	return layer * GRIDS_PER_LAYER + grid
}

/** @type {(layer: number, grid: number, step: number) => number} */
export function gridStep2step(layer, grid, step) {
	return layer * STEPS_PER_LAYER + grid * STEPS_PER_GRID + step
}

/** @type {(step: number) => number} */
export function step2layerStep(step) {
	return step % STEPS_PER_LAYER
}

/** @type {(step: number) => number} */
export function step2gridStep(step) {
	return step % STEPS_PER_GRID
}

/** @type {(grid: number) => number} */
export function grid2layerGrid(grid) {
	return grid % GRIDS_PER_LAYER
}

/** @type {(step: number) => number} */
export function step2grid(step) {
	return Math.floor(step / STEPS_PER_GRID)
}

/** @type {(step: number) => number} */
export function step2layer(step) {
	return Math.floor(step / STEPS_PER_LAYER)
}

/** @type {(grid: number) => number} */
export function grid2layer(grid) {
	return Math.floor(grid / GRIDS_PER_LAYER)
}

/** @type {(layer: number, grid: number) => number} */
export function layerGrid2grid(layer, grid) {
	return layer * GRIDS_PER_LAYER + grid
}

export class MemoryTree {
	/** @type {MemoryMap} */
	#mem

	/** @param {MemoryMap} map */
	constructor(map) {
		this.#mem = map
	}

	/** @type {Map<number, Readonly<Layer>>} */
	#layers = new Map()
	get layers() {
		return this.#grids
	}

	/** @type {Map<number, Readonly<Grid>>} */
	#grids = new Map()
	get grids() {
		return this.#grids
	}

	/** @type {Map<number, Readonly<Step>>} */
	#steps = new Map()
	get steps() {
		return this.#grids
	}

	/** @type {Map<number, Readonly<Sound>>} */
	#sounds = new Map()
	get sounds() {
		return this.#grids
	}

	/** @type {Set<() => void>} */
	#listeners = new Set()

	/**
	 * @param {"layers"|"grids"|"steps"|"sounds"|"master"} item
	 * @param {number} index
	 */
	announce(item, index) {
		for (let listener of this.#listeners) {
			listener()
		}
		if (item && index) {
			// something in here for the workers
		}
	}

	/** @type {(fn: () => void) => () => void} */
	listen(fn) {
		this.#listeners.add(fn)
		return () => this.#listeners.delete(fn)
	}

	/** @param {number} index */
	getSound(index) {
		if (!this.#sounds.has(index)) {
			let mem = this.#mem
			let data = mem.layerSounds.subarray(index, index + SOUND_SIZE)
			/** @type Sound */
			let sound = {
				layer: index,
				left: data,
				right: data,
				length: mem.soundLengths.at(index),
				detune: mem.soundDetunes.at(index)
			}
			this.#sounds.set(index, Object.freeze(sound))
		}
		return this.#sounds.get(index)
	}

	/**
	 * @param {number} index
	 * @returns {Layer}
	 */
	getLayer(index) {
		if (!this.#layers.has(index)) {
			let mem = this.#mem
			/** @type Layer */
			let layer = {
				index,
				selectedGrid: mem.layerSelectedGrids.at(index),
				type:
					/** @type LayerType */ (mem.layerTypes.at(index)) ||
					LayerType.sampler
			}
			this.#layers.set(index, Object.freeze(layer))
		}
		return this.#layers.get(index)
	}

	/**
	 * @param {number} index
	 * @returns {Readonly<Grid>}
	 */
	getGrid(index) {
		if (!this.#grids.has(index)) {
			let mem = this.#mem
			/** @type Grid */
			let grid = {
				index,
				indexInLayer: grid2layerGrid(index),
				on: Boolean(mem.gridOns.at(index)),
				layer: grid2layer(index),
				jump: mem.gridJumps.at(index),
				loop: mem.gridLoops.at(index),
				speed: mem.gridSpeeds.at(index)
			}
			this.#grids.set(index, Object.freeze(grid))
		}
		return this.#grids.get(index)
	}

	/** @type {(layer: number, grid: number) => Grid} */
	getLayerGrid(layer, grid) {
		return this.getGrid(layerGrid2layer(layer, grid))
	}

	/** @type {(index: number) => Readonly<Step>} */
	getStep(index) {
		if (!this.#steps.has(index)) {
			let mem = this.#mem
			let layerIdx = step2layer(index)
			/** @type Step */
			let step = {
				index,
				on: Boolean(mem.stepOns.at(index)),
				attack: mem.stepAttacks.at(index),
				release: mem.stepReleases.at(index),
				filterFrequency: mem.stepFilterFrequencys.at(index),
				filterQ: mem.stepFilterQs.at(index),
				indexInGrid: step2gridStep(index),
				indexInLayer: step2layerStep(index),
				grid: step2grid(index),
				layer: layerIdx,
				pan: mem.stepPans.at(index),
				pitch: mem.stepPitchs.at(index),
				quiet: mem.stepQuiets.at(index),
				start: mem.stepStarts.at(index) || 0,
				end: mem.stepStarts.at(index) || this.getSound(layerIdx).length,
				reversed: Boolean(mem.stepReverseds.at(index))
			}
			this.#steps.set(index, Object.freeze(step))
		}
		return this.#steps.get(index)
	}

	/** @type {(layer: number, step: number) => Readonly<Step>} */
	getLayerStep(layer, step) {
		return this.getStep(layerStep2step(layer, step))
	}

	/** @type {(layer: number, grid: number, step: number) => Readonly<Step>} */
	getGridStep(layer, grid, step) {
		return this.getStep(gridStep2step(layer, grid, step))
	}

	/**
	 * @template {LayerKey} Key
	 * @param {number} layer
	 * @param {Key} prop
	 * @param {Layer[Key]} val
	 */
	setLayerValue(layer, prop, val) {
		let p = prop.replace(/(.)/, $1 => $1.toUpperCase())
		// yikes?
		this.#mem[`layer${p}s`].set(val, layer)
		this.#layers.delete(layer)
		this.announce("layers", layer)
	}

	/**
	 * @param {number} grid
	 */
	toggleGrid(grid) {
		this.setGridValue(grid, "on", !this.getGrid(grid).on)
	}

	/**
	 * @param {number} layer
	 * @param {number} grid
	 */
	toggleLayerGrid(layer, grid) {
		this.setGridValue(
			layerGrid2grid(layer, grid),
			"on",
			!this.getGrid(grid).on
		)
	}

	/**
	 * @template {GridKey} Key
	 * @param {number} grid
	 * @param {Key} prop
	 * @param {Grid[Key]} val
	 */
	setGridValue(grid, prop, val) {
		let p = prop.replace(/(.)/, $1 => $1.toUpperCase())
		// yikes?
		this.#mem[`grid${p}s`].set(val, grid)
		this.#grids.delete(grid)
		this.announce("grids", grid)
	}

	/**
	 * @template {GridKey} Key
	 * @param {number} layer
	 * @param {number} grid
	 * @param {Key} prop
	 * @param {Grid[Key]} val
	 */
	setLayerGridValue(layer, grid, prop, val) {
		this.setGridValue(layerGrid2layer(layer, grid), prop, val)
	}

	/**
	 * @template {StepKey} Key
	 * @param {number} step
	 * @param {Key} prop
	 * @param {Step[Key]} val
	 */
	setStepValue(step, prop, val) {
		let p = prop.replace(/(.)/, $1 => $1.toUpperCase())
		// yikes?
		this.#mem[`step${p}s`].set(val, step)
		this.#steps.delete(step)
		this.announce("steps", step)
	}

	/**
	 * @param {number} step
	 * @param {boolean} [force]
	 */
	toggleStep(step, force) {
		let state = force == null ? !this.getStep(step) : force
		this.setStepValue(step, "on", state)
	}

	/**
	 * @param {number} layer
	 * @param {number} step
	 */
	toggleLayerStep(layer, step) {
		this.toggleStep(layerStep2step(layer, step))
	}

	/**
	 * @param {number} layer
	 * @param {number} grid
	 * @param {number} step
	 */
	toggleGridStep(layer, grid, step) {
		this.toggleStep(gridStep2step(layer, grid, step))
	}

	/**
	 * @template {StepKey} Key
	 * @param {number} layer
	 * @param {number} step
	 * @param {Key} prop
	 * @param {Step[Key]} val
	 */
	setLayerStepValue(layer, step, prop, val) {
		this.setStepValue(layerStep2step(layer, step), prop, val)
	}

	/**
	 * @template {StepKey} Key
	 * @param {number} layer
	 * @param {number} grid
	 * @param {number} step
	 * @param {Key} prop
	 * @param {Step[Key]} val
	 */
	setGridStepValue(layer, grid, step, prop, val) {
		this.setStepValue(gridStep2step(layer, grid, step), prop, val)
	}

	/**
	 * @template {StepKey} Key
	 * @param {Key} prop
	 * @param {Step[Key]} val
	 */
	setSelectedStepValue(prop, val) {
		this.setStepValue(this.selectedStep, prop, val)
	}

	/**
	 * @param {number} index
	 * @param {Float32Array} val
	 */
	setSound(index, val) {
		let mem = this.#mem
		let start = index * SOUND_SIZE
		mem.layerSounds.set(val, start)
		mem.soundLengths.set([val.length], index)
		this.#layers.delete(index)
		this.announce("sounds", index)
	}

	/**
	 * @param {number} val
	 */
	set selectedLayer(val) {
		this.#mem.master.set([val], Master.selectedLayer)
		this.announce("master", Master.selectedLayer)
	}

	get selectedLayer() {
		return this.#mem.master.at(Master.selectedLayer)
	}

	get bpm() {
		return this.#mem.master.at(Master.bpm)
	}

	/**
	 * @param {number} val
	 */
	set bpm(val) {
		this.#mem.master.set([val], Master.bpm)
	}

	get selectedUiStep() {
		return this.#mem.master.at(Master.selectedUiStep)
	}

	/**
	 * @param {number} val
	 */
	set selectedUiStep(val) {
		this.#mem.master.set([val], Master.selectedUiStep)
	}

	play() {
		this.#mem.master.set([0], Master.paused)
		this.#mem.master.set([1], Master.playing)
	}

	pause() {
		this.#mem.master.set([1], Master.paused)
	}

	stop() {
		this.#mem.master.set([0], Master.playing)
		this.#mem.master.set([0], Master.paused)
		this.#mem.currentSteps.set(
			Array(LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET).fill(-1)
		)
	}

	get playing() {
		return Boolean(this.#mem.master.at(Master.playing))
	}

	get paused() {
		return Boolean(this.#mem.master.at(Master.playing))
	}

	/** @param {number} layer */
	getCurrentStep(layer) {
		return this.#mem.currentSteps.at(layer)
	}

	incrementStep(layer) {
		let current = this.getCurrentStep(layer)

		let activeGrids = Array.from(
			this.#mem.gridOns.subarray(
				layer * GRIDS_PER_LAYER,
				layer * GRIDS_PER_LAYER + GRIDS_PER_LAYER
			)
		)
			.map((on, index) => ({index, on}))
			.filter(n => n.on)
		if (current > STEPS_PER_LAYER) {
			let grid = activeGrids[0]
			if (grid) {
				this.#mem.currentSteps.set([grid.index * STEPS_PER_GRID], layer)
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
			this.#mem.currentSteps.set([nextStep], layer)
		} else {
			let next = current + 1
			this.#mem.currentSteps.set([next], layer)
		}
	}

	/** @param {number} x */
	set drawingRegionStart(x) {
		this.#mem.drawingRegion.set([x], DrawingRegion.start)
	}

	get drawingRegionStart() {
		return this.#mem.drawingRegion.at(DrawingRegion.start)
	}

	/** @param {number} x */
	set drawingRegionX(x) {
		this.#mem.drawingRegion.set([x], DrawingRegion.x)
	}

	get drawingRegionX() {
		return this.#mem.drawingRegion.at(DrawingRegion.x)
	}

	/** @param {number} x */
	set drawingRegionEnd(x) {
		this.#mem.drawingRegion.set([x], DrawingRegion.end)
	}

	get drawingRegionEnd() {
		return this.#mem.drawingRegion.at(DrawingRegion.end)
	}

	/** @param {number} x */
	set drawingRegionXMultiplier(x) {
		this.#mem.drawingRegion.set([x], DrawingRegion.xMultiplier)
	}

	get drawingRegionXMultiplier() {
		return this.#mem.drawingRegion.at(DrawingRegion.xMultiplier)
	}

	get regionIsBeingDrawn() {
		return this.drawingRegionStart != -1 && this.drawingRegionEnd == -1
	}

	/** @param {number} x */
	startDrawingRegion(x) {
		this.drawingRegionStart = x
		this.drawingRegionX = x
		this.drawingRegionEnd = -1
	}

	/** @param {number} x */
	finishDrawingRegion(end) {
		let start = this.drawingRegionStart
		let m = this.drawingRegionXMultiplier
		;[start, end] = [start / m, end / m]
		let selectedStep = this.getSelectedStep()
		let selectedSound = this.getSound(this.selectedLayer)
		if (selectedStep.reversed) {
			;[start, end] = [
				selectedSound.length - end,
				selectedSound.length - start
			]
		}
		if ((start | 0) == (end | 0)) {
			;[start, end] = [0, 0]
		}
		this.setStepValue(selectedStep.index, "start", start)
		this.setStepValue(selectedStep.index, "end", end)
		this.drawingRegionEnd = -1
		this.drawingRegionStart = -1
		this.drawingRegionX = -1
	}

	getSelectedStep() {
		let selectedLayer = this.selectedLayer
		let selectedGrid = this.getLayer(selectedLayer).selectedGrid
		return this.getStep(
			gridStep2step(selectedLayer, selectedGrid, this.selectedUiStep)
		)
	}

	getSelectedLayer() {
		return this.getLayer(this.selectedLayer)
	}

	getSelectedLayerSelectedGrid() {
		return this.getGrid(this.getSelectedLayer().selectedGrid)
	}

	get selectedStep() {
		let selectedLayer = this.selectedLayer
		let selectedGrid = this.getLayer(selectedLayer).selectedGrid
		return this.getStep(
			gridStep2step(selectedLayer, selectedGrid, this.selectedUiStep)
		).index
	}

	/** @param {number} layer */
	clearRegions(layer) {
		this.#mem.stepStarts.set(Array(STEPS_PER_LAYER).fill(0), layer)
		this.#mem.stepEnds.set(Array(STEPS_PER_LAYER).fill(0), layer)
	}

	/**
	 * todo maybe only clear the regions if they are beyond the bounds?
	 * @param {number} layer
	 */
	fixRegions(layer) {
		this.clearRegions(layer)
	}
}

/**
 * copy one step's copyable details to another
 * @param {MemoryMap} memory
 * @param {number} from
 * @param {number} to
 */
// export function copyStepWithinSelectedLayer(memory, from, to) {
// 	let layer = selectedLayer(memory)
// 	let fromDetails = getStepDetails(memory, layer, from)

// 	stepRegion(memory, layer, to, fromDetails.region)
// 	stepQuiet(memory, layer, to, fromDetails.quiet)
// 	stepPan(memory, layer, to, fromDetails.pan)
// 	stepOn(memory, layer, to, fromDetails.on)
// 	stepReversed(memory, layer, to, fromDetails.reversed)
// 	stepPitch(memory, layer, to, fromDetails.pitch)
// 	// attack, relese, sound
// }

// /**
//  * copy one step's copyable details to another
//  * @param {MemoryMap} memory
//  * @param {number} from
//  * @param {number} to
//  */
// export function copyStepWithinSelectedLayerAndGrid(memory, from, to) {
// 	let layer = selectedLayer(memory)
// 	let grid = layerSelectedGrid(memory, layer)

// 	let absoluteFrom = grid * STEPS_PER_GRID + from
// 	let absoluteTo = grid * STEPS_PER_GRID + to
// 	copyStepWithinSelectedLayer(memory, absoluteFrom, absoluteTo)
// }

// /**
//  * copy one grid's steps details to another
//  * @param {MemoryMap} memory
//  * @param {number} from
//  * @param {number} to
//  */
// export function copyGridWithinSelectedLayer(memory, from, to) {
// 	for (let i = 0; i < STEPS_PER_GRID; i++) {
// 		copyStepWithinSelectedLayer(
// 			memory,
// 			from * STEPS_PER_GRID + i,
// 			to * STEPS_PER_GRID + i
// 		)
// 	}
// 	gridOn(
// 		memory,
// 		selectedLayer(memory),
// 		to,
// 		gridOn(memory, selectedLayer(memory), from)
// 	)
// }

// /**
//  * copy one grid's steps details to another
//  * @param {MemoryMap} memory
//  * @param {number} uiStep
//  */
// export function trimSelectedLayerSoundToStepRegion(memory, uiStep) {
// 	let layer = selectedLayer(memory)
// 	let grid = layerSelectedGrid(memory, layer)
// 	let absoluteStep = grid * STEPS_PER_GRID + uiStep
// 	let deets = getStepDetails(memory, layer, absoluteStep)
// 	let region = deets.region
// 	if (region.start || region.end) {
// 		sound(
// 			memory,
// 			layer,
// 			sound(memory, layer).subarray(region.start, region.end)
// 		)
// 		clearRegions(memory, layer)
// 	}
// }

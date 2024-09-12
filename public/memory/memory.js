import {DB_VERSION} from "../db/share.js"
import {
	GRIDS_PER_LAYER,
	LAYERS_PER_MACHINE,
	LAYER_NUMBER_OFFSET,
	LayerType,
	Master,
	SOUND_SIZE,
	STEPS_PER_GRID,
	STEPS_PER_LAYER
} from "./constants.js"
import migrations from "./migrations.js"
// ~4.75 seconds at 44.1khz
// todo stereo
export * from "./constants.js"
export * from "./convert.js"

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
		default: [96]
	},
	sampleRate: {
		type: Uint32Array,
		size: 1
	},
	soundLengths: {
		type: Uint32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	soundDetunes: {
		type: Int8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	soundVersions: {
		type: Float32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	soundSampleRates: {
		type: Uint32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	/*
	 * this is its own thing so that it remembers what grid you were on when you
	 * move between grids
	 */
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
			LayerType.sampler
		]
	},
	layerSpeeds: {
		type: Float32Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET,
		defaultFill: 1
	},
	layerSounds: {
		type: Float32Array,
		size: SOUND_SIZE * (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) // * 2? then
		// place the right channel at layer+lpm from the left channel
	},
	layerMuteds: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET
	},
	currentSteps: {
		type: Uint8Array,
		size: LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET,
		defaultFill: -1
	},
	gridOns: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		default: Array.from(
			{length: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER},
			// 1 at the start of every layer, 0 everywhere else
			(_, i) => {
				return Number(i % GRIDS_PER_LAYER == 0)
			}
		)
	},
	gridLengths: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: STEPS_PER_GRID
	},
	gridLoops: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER
	},
	gridJumps: {
		type: Int8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * GRIDS_PER_LAYER,
		defaultFill: 0
	},
	stepOns: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER,
		// let 4onthefloor = 0x8888
		//                    .toString(2)
		//                    .split("")
		//	                   .map(Number)
		// prettier-ignore
		default: [
			1,	0,	0,	0,
			1,	0,	0,	0,
			1,	0,	0,	1,
			1,	0,	1,	0
		]
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
	stepFilterFrequencies: {
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
	stepLoops: {
		type: Uint8Array,
		size: (LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET) * STEPS_PER_LAYER
	},
	drawingRegion: {
		type: Float32Array,
		size: 4
	},
	theme: {type: Uint8Array, size: 16},
	notify: {type: Int32Array, size: 1}
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

/**
 * @param {MemoryMap} memory
 * @param {ArrayBuffer} [buffer]
 * @returns {ArrayBuffer}
 */
export function unmap(memory, buffer = new ArrayBuffer(size)) {
	let offset = 0

	for (let [name, arrayInfo] of Object.entries(arrays)) {
		try {
			new arrayInfo.type(buffer, offset, arrayInfo.size).set(memory[name])
		} catch (error) {
			console.error(error)
			throw new Error(error)
		}
		offset += arrayInfo.size * arrayInfo.type.BYTES_PER_ELEMENT
	}

	return buffer
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
			if (name == "notify") continue
			if (name == "sampleRate") continue
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
				if (memory[name].length != safe[name].length) {
					console.debug(
						arrayInfo.type,
						name,
						memory[name].length,
						safe[name].length
					)
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
		// console.debug(name)
		if (fields.has(name)) {
			// todo field for this
			if (name == "currentSteps") continue
			if (name == "drawingRegion") continue
			if (name == "notify") continue
			if (name == "sampleRate") continue
			// maybe move play/paused out so master can be completely ignored
			if (name == "master") {
				safe.master.set([memory.master.at(Master.bpm)], Master.bpm)
				safe.master.set(
					[memory.master.at(Master.selectedLayer)],
					Master.selectedLayer
				)
				safe.master.set(
					[memory.master.at(Master.selectedUiStep)],
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
export function fresh(arraybuffer = new ArrayBuffer(size)) {
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

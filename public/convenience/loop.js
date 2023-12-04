import {
	LAYERS_PER_MACHINE,
	GRIDS_PER_LAYER,
	STEPS_PER_GRID,
	STEPS_PER_LAYER
} from "../memory/memory.js"

/**
 * Create a range from `start` to `end` by `step`.
 * `end` is non-inclusive (doesn't like trans people)
 * @param {number} start
 * @param {number} [end]
 * @param {number} [step]
 */
// prettier-ignore
export function range(start, end, step = 1) {
	if (end == null) {
		[start, end] = [0, start]
	} else if (start > end) {
		step = -step
	}
	let length = (end - start) / step
	return Array.from({length}, (_, i) => i * step + start)
}

/**
 * loop over the number of layers
 * @template {any} T
 * @param {(layerIdx: number) => T} fn
 * @returns {T[]}
 */
export function layers(fn) {
	return range(LAYERS_PER_MACHINE).map(index => fn(index))
}

/**
 * loop over the number of steps
 * @template {any} T
 * @param {(stepIdx: number) => T} fn
 * @returns {T[]}
 */
export function steps(fn) {
	return range(STEPS_PER_LAYER).map(index => fn(index))
}

/**
 * loop over the number of grids
 * @template {any} T
 * @param {(gridIdx: number) => T} fn
 * @returns {T[]}
 */
export function grids(fn) {
	return range(GRIDS_PER_LAYER * LAYERS_PER_MACHINE).map(index => fn(index))
}

/**
 * loop over the number of grids
 * @template {any} T
 * @param {(gridIdx: number) => T} fn
 * @returns {T[]}
 */
export function layerGrids(fn) {
	return range(GRIDS_PER_LAYER).map(index => fn(index))
}

/**
 * loop over the number of steps per grid
 * @template {any} T
 * @param {(stepIdx: number) => T} fn
 * @returns {T[]}
 */
export function gridSteps(fn) {
	return range(STEPS_PER_GRID).map(index => fn(index))
}

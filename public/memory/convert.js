import {GRIDS_PER_LAYER, STEPS_PER_GRID, STEPS_PER_LAYER} from "./constants.js"

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

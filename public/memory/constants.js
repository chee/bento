export const SOUND_SIZE = 2 ** 16 * 4

export const LAYERS_PER_MACHINE = 4
export const GRIDS_PER_LAYER = 8
export const STEPS_PER_GRID = 16
export const STEPS_PER_LAYER = GRIDS_PER_LAYER * STEPS_PER_GRID
export const QUANTUM = 128
export const DYNAMIC_RANGE = 12
export const NUMBER_OF_KEYS = 16
/* for a time when there are an odd number of layers */
export const LAYER_NUMBER_OFFSET = 4 - (LAYERS_PER_MACHINE % 4)

/** @enum {typeof LayerType[keyof typeof LayerType]} */
export const LayerType = /** @type const */ ({
	off: 0,
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

/** @typedef {typeof DrawingRegion[keyof typeof DrawingRegion]} DrawingRegion */
export const DrawingRegion = /** @type const */ ({
	start: 0,
	end: 1,
	x: 2,
	xMultiplier: 3
})

/** @enum {typeof StepState[keyof typeof StepState]} */
export const StepState = /** @type const */ ({
	off: 0,
	on: 1,
	ctrl: 2
})

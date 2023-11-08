import Layer from "./layer.js"
import Sound from "./sound.js"
import Grid from "./grid.js"
import Step from "./step.js"
import * as loop from "../../loop.js"

import {
	grid2layerGrid,
	gridStep2step,
	layerGrid2layer,
	layerStep2step,
	step2grid,
	step2gridStep
} from "../convert.js"

import {
	DrawingRegion,
	GRIDS_PER_LAYER,
	LAYERS_PER_MACHINE,
	LAYER_NUMBER_OFFSET,
	Master,
	STEPS_PER_GRID,
	STEPS_PER_LAYER
} from "../constants.js"
import {map} from "../memory.js"

/**
 * @typedef {Object} AlterSelectedMap
 * @prop {Step} step
 * @prop {Layer} layer
 * @prop {Grid} grid
 */

export default class MemoryTree {
	/** @type {import("../memory").MemoryMap} */
	#mem

	/** @type {Layer[]} */
	#layers

	/** @type {Sound[]} */
	#sounds

	/** @type {Grid[]} */
	#grids

	/** @type {Step[]} */
	#steps

	/** @param {import("../memory").MemoryMap} mem */
	constructor(mem) {
		this.#mem = mem
		this.#layers = loop.layers(index => new Layer(mem, index))
		this.#sounds = loop.layers(index => new Sound(mem, index))
		this.#grids = loop.grids(index => new Grid(mem, index))
		this.#steps = loop.steps(index => new Step(mem, index))
	}

	/** @param {ArrayBufferLike} buffer */
	static from(buffer) {
		return new MemoryTree(map(buffer))
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

	/** @param {() => void} fn */
	listen(fn) {
		this.#listeners.add(fn)
		return () => this.#listeners.delete(fn)
	}

	/** @param {number} index */
	getSound(index) {
		if (!this.#sounds[index]) {
			this.#sounds[index] = new Sound(this.#mem, index)
		}
		return this.#sounds[index].view
	}

	/** @returns boolean */
	karaoke() {
		return this.#mem.layerSounds.every(n => !n)
	}

	/**
	 * @param {number} index
	 */
	getLayer(index) {
		if (!this.#layers[index]) {
			this.#layers[index] = new Layer(this.#mem, index)
		}
		return this.#layers[index].view
	}

	/**
	 * @param {number} index
	 */
	getGrid(index) {
		if (!this.#grids[index]) {
			this.#grids[index] = new Grid(this.#mem, index)
		}
		return this.#grids[index].view
	}

	/**
	 * @param {number} layer
	 * @param {number} grid
	 */
	getLayerGrid(layer, grid) {
		return this.getGrid(layerGrid2layer(layer, grid))
	}

	/**
	 * @param {number} index
	 */
	getStep(index) {
		if (!this.#steps[index]) {
			this.#steps[index] = new Step(this.#mem, index)
		}
		return this.#steps[index].view
	}

	/**
	 * @param {number} layer
	 * @param {number} step
	 * @return {Step["view"]}
	 */
	getLayerStep(layer, step) {
		return this.getStep(layerStep2step(layer, step))
	}

	/**
	 * @param {number} layer
	 * @param {number} grid
	 * @param {number} step
	 * @return {Step["view"]}
	 */
	getGridStep(layer, grid, step) {
		return this.getStep(gridStep2step(layer, grid, step))
	}

	/**
	 * @param {number} layer
	 * @param {(layer: Layer) => void} fn
	 */
	alterLayer(layer, fn) {
		fn(this.#layers[layer])
		// delete this.#layers[layer]
		this.announce("layers", layer)
	}

	/**
	 * @param {number} sound
	 * @param {(step: Sound) => void} fn
	 */
	alterSound(sound, fn) {
		fn(this.#sounds[sound])
		// delete this.#sounds[sound]
		this.announce("sounds", sound)
	}

	/**
	 * @param {number} step
	 * @param {(step: Step) => void} fn
	 */
	alterStep(step, fn) {
		fn(this.#steps[step])
		// todo i don't need to do this if i delete the `view' in step instead
		// delete this.#steps[step]
		this.announce("steps", step)
	}

	/**
	 * @param {number} grid
	 * @param {(step: Grid) => void} fn
	 */
	alterGrid(grid, fn) {
		fn(this.#grids[grid])
		// delete this.#grids[grid]
		this.announce("grids", grid)
	}

	/**
	 * @param {number} grid
	 * @param {number} grid
	 * @param {(step: Grid) => void} fn
	 */
	alterLayerGrid(grid, fn) {
		this.alterGrid(grid2layerGrid(grid), fn)
	}

	/**
	 * @template {keyof AlterSelectedMap} Key
	 * @param {Key} type
	 * @param {(item: AlterSelectedMap[Key]) => void} fn
	 */
	alterSelected(type, fn) {
		switch (type) {
			case "layer":
				return this.alterLayer(this.selectedLayer, fn)
			case "grid":
				return this.alterGrid(this.getSelectedLayer().selectedGrid, fn)
			case "step":
				return this.alterStep(this.selectedStep, fn)
		}
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
		this.announce("master", Master.bpm)
	}

	get selectedUiStep() {
		return this.#mem.master.at(Master.selectedUiStep)
	}

	/**
	 * @param {number} val
	 */
	set selectedUiStep(val) {
		this.#mem.master.set([val], Master.selectedUiStep)
		this.announce("master", Master.selectedUiStep)
	}

	play() {
		this.#mem.master.set([1], Master.playing)
		this.#mem.master.set([0], Master.paused)
		this.announce("master", Master.playing)
	}

	pause() {
		this.#mem.master.set([1], Master.paused)
		this.announce("master", Master.paused)
	}

	stop() {
		this.#mem.master.set([0], Master.playing)
		this.#mem.master.set([0], Master.paused)
		this.#mem.currentSteps.set(
			Array(LAYERS_PER_MACHINE + LAYER_NUMBER_OFFSET).fill(-1)
		)
		this.announce("master", Master.playing)
	}

	get playing() {
		return Boolean(this.#mem.master.at(Master.playing))
	}

	get paused() {
		return Boolean(this.#mem.master.at(Master.paused))
	}

	/** @param {number} layer */
	getCurrentStepIndex(layer) {
		return this.#mem.currentSteps.at(layer)
	}

	get selectedLayerCurrentStep() {
		return this.getCurrentStepIndex(this.selectedLayer)
	}

	get selectedLayerCurrentGrid() {
		return grid2layerGrid(step2grid(this.selectedLayerCurrentStep))
	}

	get selectedLayerCurrentGridStep() {
		return step2gridStep(this.selectedLayerCurrentStep)
	}

	/** @param {number} layer */
	incrementStep(layer) {
		let current = this.getCurrentStepIndex(layer)

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
		// this.announce("steps", 0)
	}

	// todo drawingRegion should be its own class
	// also... it doesn't need to be part of `arrays'
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

	/** @param {number} end */
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
		this.alterSelected("step", step => {
			step.start = start
			step.end = end
		})
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

	getSelectedGrid() {
		return this.getGrid(this.selectedGrid)
	}

	get selectedGrid() {
		return this.getSelectedLayer().selectedGrid
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

	/**
	 * @param {number} tick
	 * @param {number} layerIndex
	 * @param {number} sampleRate
	 */
	tick(tick, layerIndex, sampleRate) {
		let bpm = this.bpm
		let samplesPerBeat = (60 / bpm) * sampleRate
		let currentStepIndex = this.getCurrentStepIndex(layerIndex)
		let currentStep = this.getStep(currentStepIndex)
		let currentGrid = this.getGrid(currentStep?.gridIndex || 0)
		let speed = currentGrid.speed
		let samplesPerStep = samplesPerBeat / (4 * speed)
		let nextStepIndex = (tick / samplesPerStep) | 0

		if (nextStepIndex != this.lastNextStep) {
			this.incrementStep(layerIndex)
			this.lastNextStep = nextStepIndex
			return true
		}

		return false
	}
}

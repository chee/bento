import Layer from "./layer.js"
import Sound from "./sound.js"
import Grid from "./grid.js"
import Step from "./step.js"
import * as loop from "../../convenience/loop.js"

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
import {map, unmap} from "../memory.js"

/**
 * @typedef {Object} AlterSelectedMap
 * @prop {Step} step
 * @prop {Layer} layer
 * @prop {Grid} grid
 */

export default class MemoryTree {
	/** @type {import("../memory").MemoryMap} */
	#mem

	/** @type {Int32Array} */
	#notify

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
		this.#notify = mem.notify
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
		if (item && index != null) {
			// something in here for the workers
			Atomics.store(this.#notify, 0, 0)
			Atomics.notify(this.#notify, 0, 1)
		}
	}

	/** @param {() => void} fn */
	listen(fn) {
		this.#listeners.add(fn)
		return () => this.#listeners.delete(fn)
	}

	async waitAsync() {
		return Atomics.waitAsync(this.#notify, 0, 1)
	}

	wait() {
		Atomics.wait(this.#notify, 0, 0)
		Atomics.store(this.#notify, 0, 1)
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
		this.announce("layers", layer)
	}

	/**
	 * @param {number} sound
	 * @param {(step: Sound) => void} fn
	 */
	alterSound(sound, fn) {
		fn(this.#sounds[sound])
		this.announce("sounds", sound)
	}

	/**
	 * @param {number} step
	 * @param {(step: Step) => void} fn
	 */
	alterStep(step, fn) {
		fn(this.#steps[step])
		// todo i don't need to do this if i delete the `view' in step instead

		this.announce("steps", step)
	}

	/**
	 * @param {number} grid
	 * @param {(step: Grid) => void} fn
	 */
	alterGrid(grid, fn) {
		fn(this.#grids[grid])
		this.announce("grids", grid)
	}

	/**
	 * @param {number} from
	 * @param {number} to
	 */
	pasteGrid(from, to) {
		let fromGrid = this.#grids[from]
		let toGrid = this.#grids[to]
		let fromStepStart =
			fromGrid.layerIndex * STEPS_PER_LAYER +
			fromGrid.indexInLayer * STEPS_PER_GRID
		let toStepStart =
			toGrid.layerIndex * STEPS_PER_LAYER +
			toGrid.indexInLayer * STEPS_PER_GRID
		let fromSteps = this.#steps.slice(
			fromStepStart,
			fromStepStart + STEPS_PER_GRID
		)
		toGrid.paste(fromGrid)
		this.announce("grids", to)
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

	/**
	 * @type number
	 */
	get bpm() {
		return this.#mem.master.at(Master.bpm) || 120
	}

	set bpm(val) {
		let bpm = Math.clamp(val || 120, 20, 240)
		this.#mem.master.set([bpm], Master.bpm)
		this.announce("master", Master.bpm)
	}

	/**
	 * @type {number}
	 */
	get sampleRate() {
		return this.#mem.sampleRate.at(0)
	}

	set sampleRate(val) {
		this.#mem.sampleRate.set([val])
		this.announce("master", -1)
	}

	get samplesPerBeat() {
		return (60 / this.bpm) * this.sampleRate
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
		this.#grids.forEach(grid => {
			grid.loops = 0
		})
		this.announce("master", Master.playing)
	}

	get playing() {
		return Boolean(this.#mem.master.at(Master.playing))
	}

	get paused() {
		return Boolean(this.#mem.master.at(Master.paused))
	}

	get active() {
		return this.playing && !this.paused
	}

	get stopped() {
		return !this.playing
	}

	get silent() {
		return !this.playing || this.paused
	}

	/** @param {number} layer */
	getCurrentStepIndexInLayer(layer) {
		return this.#mem.currentSteps.at(layer)
	}

	get selectedLayerCurrentStep() {
		return this.stopped
			? -1
			: this.getCurrentStepIndexInLayer(this.selectedLayer)
	}

	get selectedLayerCurrentGrid() {
		return grid2layerGrid(step2grid(this.selectedLayerCurrentStep))
	}

	get selectedLayerCurrentGridStep() {
		return step2gridStep(this.selectedLayerCurrentStep)
	}

	/**
	 * @param {number} layerIndex
	 * @param {number} currentStepIndex
	 */
	getNextStepIndex(layerIndex, currentStepIndex) {
		let activeGrids = this.getActiveGridIndices(layerIndex)
		if (currentStepIndex > STEPS_PER_LAYER) {
			let grid = activeGrids[0]
			if (grid) {
				return grid * STEPS_PER_GRID
			}
		} else if (currentStepIndex % STEPS_PER_GRID == STEPS_PER_GRID - 1) {
			let currentGridIndex = step2grid(
				layerStep2step(layerIndex, currentStepIndex)
			)
			let currentGrid = this.#grids[currentGridIndex]

			// todo move this logic to grid.js itself
			if (currentGrid.loop > 0) {
				if (currentGrid.loops < currentGrid.loop) {
					currentGrid.loops += 1
					return currentGrid.indexInLayer * STEPS_PER_GRID
				}
			}
			currentGrid.loops = 0
			let nextGrid =
				activeGrids.find(g => g > currentGrid.indexInLayer) ||
				activeGrids[0] ||
				0
			return activeGrids.length == 0 ? -1 : nextGrid * STEPS_PER_GRID
		}
		return currentStepIndex + 1
	}

	/** @param {number} layer */
	getActiveGridIndices(layer) {
		let ons = this.#mem.gridOns.subarray(
			layer * GRIDS_PER_LAYER,
			layer * GRIDS_PER_LAYER + GRIDS_PER_LAYER
		)
		return Array.from(ons)
			.map((on, index) => ({index, on}))
			.filter(n => n.on)
			.map(n => n.index)
	}

	/** @param {number} layer */
	incrementStep(layer) {
		let current = this.getCurrentStepIndexInLayer(layer)
		this.#mem.currentSteps.set([this.getNextStepIndex(layer, current)], layer)
		this.announce("steps", -1)
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
		let step = this.getSelectedStep()
		let sound = this.getSound(this.selectedLayer)

		;[start, end] = [start / m, end / m]
		if (start > end) {
			;[start, end] = [end, start]
		}
		if (step.reversed) {
			;[start, end] = [sound.length - end, sound.length - start]
		}
		if ((start | 0) == (end | 0)) {
			;[start, end] = [0, 0]
		}
		this.alterSelected("step", step => {
			step.start = start
			step.end = end
		})
		this.drawingRegionStart = 0
		this.drawingRegionEnd = 0
		this.drawingRegionX = 0
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
		let layer = this.getSelectedLayer()
		return layerGrid2layer(layer.index, layer.selectedGrid)
	}

	get selectedStep() {
		let selectedLayer = this.selectedLayer
		let selectedGrid = this.getLayer(selectedLayer).selectedGrid
		return this.getStep(
			gridStep2step(selectedLayer, selectedGrid, this.selectedUiStep)
		).index
	}

	/** @param {number} layer*/
	getLayerCurrentStepAbsoluteIndex(layer) {
		return layerStep2step(layer, this.#mem.currentSteps.at(layer))
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

	get memory() {
		return this.#mem
	}

	blob() {
		return new Blob([unmap(this.#mem)], {type: "application/x-o-x-o"})
	}

	async compressed() {
		return await new Response(
			this.blob().stream().pipeThrough(new CompressionStream("gzip"))
		).blob()
	}

	url() {
		return URL.createObjectURL(this.blob())
	}

	async compressedURL() {
		return URL.createObjectURL(await this.compressed())
	}
}

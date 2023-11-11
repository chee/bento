import MemoryTree from "../memory/tree/tree.js"
import {bentoElements, BentoElement} from "./base.js"
import * as loop from "../convenience/loop.js"
import {grid2layerGrid, step2gridStep} from "../memory/convert.js"
import icons from "../icons.js"

export default class BentoParty extends BentoElement {
	connectedCallback() {
		let root = document.documentElement
		root.removeAttribute("loading")
		let themeObserver = new MutationObserver(changes => {
			for (let change of changes) {
				if (change.type == "attributes") {
					if (change.attributeName == "theme") {
						this.announce("theme", root.getAttribute("theme"))
					}
				}
			}
		})

		themeObserver.observe(root, {
			attributes: true,
			attributeFilter: ["theme"]
		})

		// todo create these rather than find them
		this.nav = this.querySelector("bento-nav")
		this.machine = this.querySelector("bento-machine")
		customElements.whenDefined("bento-machine").then(() => {
			this.settings = this.machine.settings
			this.masterControls = this.machine.masterControls
			this.layerSelector = this.machine.layerSelector
			this.screen = this.machine.screen
			this.grid = this.machine.grid
			this.screen.when("select-screen", name => {
				this.screen.selectedScreen = name
			})
		})
		this.gridSelector = this.querySelector("bento-grid-selector")
		this.gridControls = this.querySelector("bento-grid-controls")
		this.tape = this.querySelector("bento-tape")
		this.poweroff = this.querySelector("bento-poweroff")
		this.poweroff.append(icons.get("power"))
	}

	/** @type boolean */
	get recording() {
		return this.get("recording")
	}

	set recording(val) {
		this.set("recording", val, () => {
			this.toggleAttribute("recording", val)
			this.tape.recording = val
		})
	}

	/** @param {{length: number}} info */
	startRecording(info) {
		this.recording = true
		this.tape.length = info.length
	}

	set fancy(val) {
		this.set("fancy", val == null ? true : val, () => {
			this.toggleAttribute("fancy", this.get("fancy"))
		})
	}

	get fancy() {
		return this.getAttribute("fancy") == "fancy"
	}

	/** @type boolean */
	get playing() {
		return this.get("playing")
	}

	set playing(val) {
		this.set("playing", val, () => {
			this.toggleAttribute("playing", val)
		})
	}

	/** @type boolean */
	get paused() {
		return this.get("paused")
	}

	set paused(val) {
		this.set("paused", val, () => {
			this.toggleAttribute("paused", val)
		})
	}

	/** @type boolean */
	get active() {
		return this.get("active")
	}

	set active(val) {
		this.set("active", val, () => {
			this.toggleAttribute("active", val)
		})
	}

	/** @param {MemoryTree} memtree */
	set tree(memtree) {
		this.masterControls.playing = memtree.playing
		this.masterControls.paused = memtree.paused
		this.masterControls.bpm = memtree.bpm
		console.log(this.masterControls.playing)
		this.playing = memtree.playing
		this.paused = memtree.paused
		this.active = memtree.active

		// this.grid.steps = val.steps
		this.set("selectedLayerIndex", memtree.selectedLayer, () => {
			this.grid.steps = getSelectedGridSteps(memtree)
			this.layerSelector.selectedLayerIndex = memtree.selectedLayer
			this.screen.layer = memtree.getSelectedLayer()
		})

		this.set("selectedGridIndex", memtree.selectedGrid, () => {
			this.gridSelector.selectedGridIndex = grid2layerGrid(
				memtree.selectedGrid
			)
			this.grid.steps = getSelectedGridSteps(memtree)
		})

		this.set("selectedUiStepIndex", memtree.selectedUiStep, () => {
			this.grid.selectedStepIndex = memtree.selectedUiStep
		})

		// get your wallet out
		this.grid.steps = getSelectedGridSteps(memtree)
		this.gridSelector.grids = getSelectedLayerGrids(memtree)
		this.gridSelector.steps = getSelectedLayerSteps(memtree)
		this.screen.selectedStep = memtree.getSelectedStep()
		this.gridControls.layer = memtree.getSelectedLayer()
		this.gridControls.grid = memtree.getSelectedGrid()

		this.updateCurrentStep(memtree)
	}

	/** @param {MemoryTree} memtree */
	updateCurrentStep(memtree) {
		this.selectedLayerCurrentGridIndex = memtree.selectedLayerCurrentGrid
		this.selectedLayerCurrentStepIndex = memtree.selectedLayerCurrentStep
		this.selectedLayerCurrentGridStepIndex =
			memtree.selectedLayerCurrentGridStep
	}

	/** @type number */
	get selectedLayerCurrentStepIndex() {
		return this.get("selectedLayerCurrentStepIndex")
	}

	set selectedLayerCurrentStepIndex(val) {
		this.set("selectedLayerCurrentStepIndex", val, () => {
			// this.gridSelector.currentGridStepIndex = val
		})
	}

	/** @type number */
	get selectedLayerCurrentGridIndex() {
		return this.get("selectedLayerCurrentGridIndex")
	}

	set selectedLayerCurrentGridIndex(val) {
		this.set("selectedLayerCurrentGridIndex", val, () => {
			this.gridSelector.currentGridIndex = val
		})
	}

	/** @type number */
	get selectedLayerCurrentGridStepIndex() {
		return this.get("selectedLayerCurrentGridStepIndex")
	}

	set selectedLayerCurrentGridStepIndex(val) {
		this.set("selectedLayerCurrentGridStepIndex", val, () => {
			if (
				grid2layerGrid(this.selectedGridIndex) ==
				this.gridSelector.currentGridIndex
			) {
				this.grid.currentStepIndex = val
			} else {
				this.grid.currentStepIndex = -1
			}

			this.gridSelector.currentGridStepIndex = val
		})
	}

	/** @type number */
	get selectedLayerIndex() {
		return this.get("selectedLayerIndex")
	}

	/** @type number */
	get selectedGridIndex() {
		return this.get("selectedGridIndex")
	}

	/** @type number */
	get selectedUiStepIndex() {
		return this.get("selectedUiStepIndex")
	}

	set slug(val) {
		this.nav.slug = val
	}

	get slug() {
		return this.nav.slug
	}
}

/** @param {MemoryTree} memtree */
function getSelectedGridSteps(memtree) {
	return loop.gridSteps(index =>
		memtree.getGridStep(
			memtree.selectedLayer,
			grid2layerGrid(memtree.selectedGrid),
			index
		)
	)
}

/** @param {MemoryTree} memtree */
function getSelectedLayerSteps(memtree) {
	return loop.steps(index =>
		memtree.getLayerStep(memtree.selectedLayer, index)
	)
}

/** @param {MemoryTree} memtree */
function getSelectedLayerGrids(memtree) {
	return loop.layerGrids(index =>
		memtree.getLayerGrid(memtree.selectedLayer, index)
	)
}

bentoElements.define("bento-party", BentoParty)

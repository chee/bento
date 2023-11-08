import MemoryTree from "../memory/tree/tree.js"
import {bentoElements, BentoElement} from "./base.js"
import * as loop from "../loop.js"

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
			this.screen.when("select-screen", message => {
				this.screen.selectedScreen = message.name
			})
		})
		this.gridSelector = this.querySelector("bento-grid-selector")
		this.gridControls = this.querySelector("bento-grid-controls")
		this.tape = this.querySelector("bento-tape")
	}

	set fancy(val) {
		this.set("fancy", val == null ? true : val, () => {
			this.toggleAttribute("fancy", this.get("fancy"))
		})
	}

	get fancy() {
		return this.getAttribute("fancy") == "fancy"
	}

	/** @param {MemoryTree} memtree */
	set tree(memtree) {
		// this.grid.steps = val.steps
		this.set("selectedLayerIndex", memtree.selectedLayer, () => {
			this.grid.steps = getSelectedGridSteps(memtree)
			this.layerSelector.selectedLayerIndex = memtree.selectedLayer
			this.gridSelector.grids = getSelectedLayerGrids(memtree)
			this.screen.layer = memtree.getSelectedLayer()
		})

		this.set("selectedGridIndex", memtree.selectedGrid, () => {
			this.gridSelector.selectedGridIndex = memtree.selectedGrid
		})

		this.set("selectedUiStepIndex", memtree.selectedUiStep, () => {
			this.grid.selectedStepIndex = memtree.selectedUiStep
		})

		this.set(
			"selectedLayerCurrentStepIndex",
			memtree.selectedLayerCurrentStep,
			() => {
				this.grid.currentStepIndex = memtree.selectedLayerCurrentGridStep
				this.gridSelector.currentGridIndex = memtree.selectedLayerCurrentGrid
				this.gridSelector.currentGridStepIndex =
					memtree.selectedLayerCurrentGridStep
			}
		)

		this.grid.steps = getSelectedGridSteps(memtree)
		// todo this is expensive to do every loop
		this.gridSelector.steps = getSelectedLayerSteps(memtree)
	}

	get selectedLayerCurrentStepIndex() {
		return this.get("selectedLayerCurrentStepIndex")
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
		memtree.getGridStep(memtree.selectedLayer, memtree.selectedGrid, index)
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
	return loop.grids(index =>
		memtree.getLayerGrid(memtree.selectedLayer, index)
	)
}

bentoElements.define("bento-party", BentoParty)

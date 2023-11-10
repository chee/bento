import {bentoElements, BentoElement} from "./base.js"
import BentoMiniGrid from "./minigrid.js"
import * as loop from "../convenience/loop.js"
import Grid from "../memory/tree/grid.js"
import Step from "../memory/tree/step.js"
import {STEPS_PER_GRID} from "../memory/constants.js"

export default class BentoGridSelector extends BentoElement {
	/** @type {BentoMiniGrid[]} */
	minigrids = []

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		loop.grids(index => {
			let minigrid = /** @type BentoMiniGrid */ (
				document.createElement("bento-minigrid")
			)
			minigrid.id = index.toString()
			this.shadow.firstElementChild.append(minigrid)
			this.minigrids.push(minigrid)
		})
		this.attachStylesheet("grid-selector")
	}

	set selectedGridIndex(val) {
		this.set("selectedGridIndex", val, () => {
			for (let minigrid of this.minigrids) {
				minigrid.selected = minigrid.grid?.indexInLayer == val
			}
		})
	}

	/** @type {number} */
	get selectedGridIndex() {
		return this.get("selectedGridIndex")
	}

	/** @type {Grid["view"][]} */
	get grids() {
		return this.get("grids")
	}

	set grids(val) {
		this.set("grids", val, () => {
			for (let grid of val) {
				if (!grid) continue
				this.minigrids[grid.indexInLayer].grid = grid
			}
		})
	}

	/** @type number */
	get currentGridIndex() {
		return this.get("currentGridIndex")
	}

	set currentGridIndex(val) {
		this.set("currentGridIndex", val, () => {
			for (let minigrid of this.minigrids) {
				minigrid.playing = minigrid.grid?.index == val
			}
		})
	}

	/** @type number */
	get currentGridStepIndex() {
		return this.get("currentGridStepIndex")
	}

	set currentGridStepIndex(val) {
		this.set("currentGridStepIndex", val, () => {
			for (let minigrid of this.minigrids) {
				if (minigrid.grid.index == this.currentGridIndex) {
					minigrid.currentStepIndex = val
				} else {
					minigrid.currentStepIndex = -1
				}
			}
		})
	}

	/** @type {Step["view"][]} */
	get steps() {
		return this.get("steps")
	}

	set steps(val) {
		this.set("steps", val, () => {
			let perGrid = val.chunk(STEPS_PER_GRID)
			for (let minigrid of this.minigrids) {
				minigrid.steps = perGrid[minigrid.grid?.indexInLayer]
			}
		})
	}
}

bentoElements.define("bento-grid-selector", BentoGridSelector)

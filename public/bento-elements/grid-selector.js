import {BentoElement} from "./base.js"
import BentoMiniGrid from "./mini-grid.js"
import * as loop from "../loop.js"
import {STEPS_PER_GRID} from "../memory.js"

export default class BentoGridSelector extends BentoElement {
	/** @type {BentoMiniGrid[]} */
	#minigrids = []

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		loop.grids(() => {
			let minigrid = /** @type BentoMiniGrid */ (
				document.createElement("bento-mini-grid")
			)
			// minigrid.on = true
			this.shadow.firstElementChild.append(minigrid)
			this.#minigrids.push(minigrid)
		})
		this.shadow.addEventListener(
			"click",
			/** @param {MouseEvent} event */
			event => {
				if (this.#minigrids.includes(event.target)) {
					if (event.target.selected) {
						this.announce("toggle", {
							toggle: "grid",
							value: this.#minigrids.indexOf(event.target)
						})
					} else {
						this.announce("change", {
							change: "grid",
							value: this.#minigrids.indexOf(event.target)
						})
					}
				}
			}
		)
		this.attachStylesheet("grid-selector")
	}

	/** @param {number} val */
	set selected(val) {
		this.#minigrids.forEach((mg, i) => {
			mg.selected = val == i
		})
	}

	/**
	 * @param {number} index
	 * @param {boolean} val
	 */
	toggle(index, val) {
		if (index >= this.#minigrids.length) {
			return
		}
		this.#minigrids[index].on = val
	}

	/** @param {number} val */
	set playing(val) {
		let targetGrid = Math.floor(val / STEPS_PER_GRID)
		let targetStep = val % STEPS_PER_GRID
		this.#minigrids.forEach((mg, i) => {
			if (i == targetGrid) {
				mg.playing = targetStep
			} else {
				mg.playing = -1
			}
		})
	}

	get grids() {
		return this.#minigrids.map(mg => mg.grid)
	}

	/** @param {boolean[][]} val */
	set grids(val) {
		this.#minigrids.forEach((mg, i) => {
			mg.grid = val[i]
		})
	}
}

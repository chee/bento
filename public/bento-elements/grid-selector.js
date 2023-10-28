import {BentoElement} from "./base.js"
import BentoMiniGrid from "./mini-grid.js"
import * as loop from "../loop.js"
import {STEPS_PER_GRID} from "../memory.js"

export default class BentoGridSelector extends BentoElement {
	/** @type {boolean[][]} */
	#grids = []
	/** @type {BentoMiniGrid[]} */
	#minigrids = []
	/** @type {HTMLButtonElement[]} */
	#news = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		this.shadow.addEventListener("click", event => {
			if (this.#minigrids.includes(event.target)) {
				this.announce("change", {
					change: "grid",
					value: this.#minigrids.indexOf(event.target)
				})
			} else if (this.#news.includes(event.target)) {
				this.announce("new", {
					type: "grid",
					value: this.#news.indexOf(event.target) + 1
				})
			}
		})
		this.attachStylesheet("grid-selector")
	}

	updateElements() {
		let numberOfMinigrids = this.#grids.length
		if (numberOfMinigrids != this.#minigrids.length) {
			this.shadow.firstElementChild.textContent = ""
			this.#minigrids = []
			this.#news = []
			loop.grids(index => {
				if (index < this.#grids.length) {
					let minigrid = /** @type BentoMiniGrid */ (
						document.createElement("bento-mini-grid")
					)
					// minigrid.on = true
					this.shadow.firstElementChild.append(minigrid)
					this.#minigrids.push(minigrid)
					minigrid.grid = this.#grids[index]
				} else {
					let button = document.createElement("button")
					this.#news.push(button)
					button.ariaLabel = "add grid to layer"
					this.shadow.firstElementChild.append(button)
				}
			})
		}
		this.#minigrids.forEach((mg, i) => {
			mg.grid = this.#grids?.[i]
		})
	}

	/** @param {number} val */
	set selected(val) {
		this.#minigrids.forEach((mg, i) => {
			mg.selected = val == i
		})
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
		return this.#grids
	}

	/** @param {boolean[][]} val */
	set grids(val) {
		this.#grids = val
		this.updateElements()
	}
}

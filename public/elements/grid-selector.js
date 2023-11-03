import {BentoElement} from "./base.js"
import BentoMiniGrid from "./mini-grid.js"
import * as loop from "../convenience/loop.js"
import {STEPS_PER_GRID} from "../memory/memory.js"

export default class BentoGridSelector extends BentoElement {
	/** @type {BentoMiniGrid[]} */
	#minigrids = []

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		loop.grids(index => {
			let minigrid = /** @type BentoMiniGrid */ (
				document.createElement("bento-mini-grid")
			)
			// minigrid.on = true
			minigrid.id = index.toString()
			this.shadow.firstElementChild.append(minigrid)
			this.#minigrids.push(minigrid)
		})
		this.shadow.addEventListener(
			"click",
			/** @param {MouseEvent} event */
			event => {
				let target = /** @type {BentoMiniGrid}*/ (event.target)
				if (this.#minigrids.includes(target)) {
					if (target.selected) {
						this.announce("toggle", {
							toggle: "grid",
							value: +target.id
						})
					} else {
						this.announce("change", {
							change: "grid",
							value: +target.id
						})
					}
				}
			}
		)
		// todo this code is SO exactly the same as the grid stuff
		// it can probably be one thing once it has settled
		// but: repeat yourself, repeat yourself, repeat yourself
		// until you hear what you are saying
		this.shadow.addEventListener("change", event => {
			let target = /** @type {BentoMiniGrid}*/ (event.target)
			let index = this.#minigrids.indexOf(target)
			if (index != -1) {
				this.announce("change", {
					...event.detail,
					minigrid: index
				})
			}
		})
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

import {bentoElements, BentoElement} from "./base.js"
import * as loop from "../convenience/loop.js"
import * as dt from "../io/data-transfer.js"
import Grid from "../memory/tree/grid.js"
import Step from "../memory/tree/step.js"

export default class BentoMiniGrid extends BentoElement {
	/** @type HTMLElement[] */
	dots = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.attachStylesheet("minigrid")
		this.on = true
		this.setAttribute("draggable", "true")
		this.tabIndex = 0

		loop.gridSteps(i => {
			let dot = document.createElement("bento-dot")
			this.dots.push(dot)
			this.shadow.append(dot)
		})

		// todo some kind of withCopyable mixin
		this.addEventListener("dragenter", this.#dragenter)
		this.addEventListener("dragover", this.#dragover)
		this.addEventListener("dragleave", this.#dragleave)
		this.addEventListener("drop", this.#drop)
		this.addEventListener("dragstart", this.#dragstart)
		this.addEventListener("click", this.#click)
	}

	#click() {
		if (this.selected) {
			this.announce("toggle-grid", this.grid.index)
		} else {
			this.announce("select-grid", this.grid.index)
		}
	}

	get #droptarget() {
		return this.hasAttribute("drop-target")
	}

	set #droptarget(val) {
		this.toggleAttribute("drop-target", val)
	}

	/** @param {DragEvent} event */
	async #dragenter(event) {
		event.preventDefault()
		if (await dt.isGrid(event.dataTransfer)) {
			this.#droptarget = true
		}
	}

	/** @param {DragEvent} event */
	async #dragover(event) {
		event.preventDefault()
		if (await dt.isGrid(event.dataTransfer)) {
			this.#droptarget = true
		}
	}

	/** @param {DragEvent} event */
	#dragleave(event) {
		event.preventDefault()
		this.#droptarget = false
	}

	/** @param {DragEvent} event */
	#dragstart(event) {
		dt.setGrid(event.dataTransfer, this.grid.index)
	}

	/** @param {DragEvent} event */
	async #drop(event) {
		event.preventDefault()
		let grid = await dt.getGrid(event.dataTransfer)
		this.announce("copy-grid", {
			from: grid,
			to: this.grid.index
		})
		this.announce("select-grid", this.grid.index)
		this.#droptarget = false
	}

	/** @type Grid["view"] */
	get grid() {
		return this.get("grid")
	}

	set grid(val) {
		this.set("grid", val, () => {
			this.toggleAttribute("on", val.on)
		})
	}

	/** @type {Step["view"][]} */
	get steps() {
		return this.get("steps")
	}

	set steps(val) {
		let toggleAttribute = BentoElement.prototype.toggleAttribute
		this.set("steps", val, () => {
			this.dots.forEach((dot, index) => {
				// todo if the individial dots were a component this would be
				// cheaper
				toggleAttribute.call(dot, "on", this.steps?.[index].on)
			})
		})
	}

	/** @type boolean */
	get selected() {
		return this.get("selected")
	}

	set selected(val) {
		this.set("selected", val, () => {
			this.toggleAttribute("selected", val)
		})
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

	/** @type number */
	get currentStepIndex() {
		return this.get("currentStepIndex")
	}

	set currentStepIndex(val) {
		this.set("currentStepIndex", val, () => {
			this.dots.forEach((d, i) => {
				if (i == val) {
					d.setAttribute("playing", "playing")
				} else {
					d.removeAttribute("playing")
				}
			})
		})
	}
}

bentoElements.define("bento-minigrid", BentoMiniGrid)

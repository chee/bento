import {BentoElement} from "./base.js"
import * as loop from "../convenience/loop.js"
import * as dt from "../io/data-transfer.js"

export default class BentoMiniGrid extends BentoElement {
	/** @type HTMLElement[] */
	#dots = []
	/** @type boolean[] */
	#grid = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.attachStylesheet("mini-grid")
		this.on = true
		this.setAttribute("draggable", "true")
		this.tabIndex = 0

		loop.gridSteps(i => {
			let dot = document.createElement("bento-dot")
			dot.toggleAttribute("on", this.grid?.[i])
			this.#dots.push(dot)
			this.shadow.append(dot)
		})
		// todo some kind of withCopyable mixin
		this.addEventListener("dragenter", this.#dragenter)
		this.addEventListener("dragover", this.#dragover)
		this.addEventListener("dragleave", this.#dragleave)
		this.addEventListener("drop", this.#drop)
		this.addEventListener("dragstart", this.#dragstart)
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
		dt.setGrid(event.dataTransfer, +this.id)
	}

	/** @param {DragEvent} event */
	async #drop(event) {
		event.preventDefault()
		let grid = await dt.getGrid(event.dataTransfer)
		this.announce("change", {
			change: "copy",
			from: grid
		})
		this.#droptarget = false
	}

	get grid() {
		return this.#grid
	}

	set grid(val) {
		this.#grid = val
		this.#dots.forEach((d, i) => {
			BentoElement.prototype.toggleAttribute.call(d, "on", val?.[i])
		})
	}

	get selected() {
		return this.hasAttribute("selected")
	}
	set selected(val) {
		this.toggleAttribute("selected", val)
	}

	get on() {
		return this.hasAttribute("on")
	}

	set on(val) {
		this.toggleAttribute("on", val)
	}

	set playing(/** @type {number} */ val) {
		this.toggleAttribute("playing", val != -1)

		this.#dots.forEach((d, i) => {
			if (i == val) {
				d.setAttribute("playing", "playing")
			} else {
				d.removeAttribute("playing")
			}
		})
	}
}

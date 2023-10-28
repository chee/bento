import {BentoElement} from "./base.js"
import * as loop from "../loop.js"

export default class BentoMiniGrid extends BentoElement {
	/** @type HTMLElement[] */
	#dots = []
	/** @type boolean[] */
	#grid = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.attachStylesheet("mini-grid")
		let button = this.shadow.appendChild(document.createElement("button"))

		loop.gridSteps(i => {
			let dot = document.createElement("bento-dot")
			dot.toggleAttribute("on", this.grid?.[i])
			this.#dots.push(dot)
			button.append(dot)
		})
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

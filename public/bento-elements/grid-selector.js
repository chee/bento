import * as loop from "../loop.js"
import {BentoElement} from "./base.js"

export default class BentoGridSelector extends BentoElement {
	/** @type {HTMLButtonElement[]} */
	#buttons = []
	createButton(/**@type {number}*/ val) {
		let button = document.createElement("button")
		this.#buttons.push(button)
		button.textContent = "" + val
		this.shadow.append(button)
	}
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = ``
		this.createButton(0)
		this.createButton(1)
		this.createButton(2)
		this.createButton(3)
		this.attachStylesheet("grid-selector")
		this.shadow.addEventListener(
			"click",
			/** @param {InputEvent} event */
			event => {
				event.stopImmediatePropagation()
				let index = this.#buttons.indexOf(
					/** @type {HTMLButtonElement} */ (event.target)
				)
				if (index != null) {
					this.announce("change", {
						change: "grid",
						value: index
					})
				}
			}
		)
	}

	/** @param {number} val */
	set selected(val) {
		// for (let button of this.#buttons) {
		// button.classList.toggle("selected", val == +button.textContent)
		// }
	}
}

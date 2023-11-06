import {bentoElements, BentoElement} from "./base.js"

export default class BentoControlButton extends BentoElement {
	/** @type HTMLButtonElement */
	#button
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		let button = document.createElement("button")
		button.addEventListener("click", () => {
			this.announce("press", this.id)
		})
		this.shadow.appendChild(button)
		this.#button = button
		this.attachStylesheet("bento-control-button")
	}

	/** @type {SVGElement} */
	#icon

	set icon(val) {
		this.#icon = val
		this.#button.textContent = ""
		this.#button.appendChild(val)
	}

	get icon() {
		return this.#icon
	}

	/** @type {string} the id of the button and the value it will announce */
	set name(val) {
		this.id = val
	}

	get name() {
		return this.id
	}

	set label(val) {
		this.setAttribute("aria-label", val)
	}

	get label() {
		return this.getAttribute("aria-label")
	}
}

bentoElements.define("bento-control-button", BentoControlButton)

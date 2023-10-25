import {BentoElement} from "./base.js"

export default class BentoScreenSelector extends BentoElement {
	static observedAttributes = ["screens"]
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<nav></nav>`
		this.attachStylesheet("screen-selector")
		this.shadow.addEventListener(
			"click",
			/** @param {MouseEvent} event */
			event => {
				let button = /** @type {HTMLButtonElement} */ (event.target)
				this.announce("screen", {
					screen: button.name
				})
			}
		)
	}

	attributeChangedCallback(attr, _old, value) {
		if (attr == "screens") {
			let nav = this.shadow.firstElementChild
			nav.textContent = ""
			for (let name of value.split(/\s+/)) {
				let button = document.createElement("button")
				button.textContent = name
				button.name = name
				nav.appendChild(button)
			}
		}
	}
}

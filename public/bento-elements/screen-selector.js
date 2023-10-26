import {BentoElement} from "./base.js"

export default class BentoScreenSelector extends BentoElement {
	static observedAttributes = ["screens", "selected"]
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<nav></nav>`
		this.attachStylesheet("screen-selector")
		this.shadow.addEventListener(
			"click",
			/** @param {MouseEvent} event */
			event => {
				if (event.target instanceof HTMLButtonElement) {
					this.announce("screen", {
						screen: event.target.name
					})
				} else {
					this.announce("open")
				}
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
			nav.children[0].setAttribute("aria-checked", "true")
		} else if (attr == "selected") {
			Array.from(this.shadow.querySelectorAll("button")).forEach(button => {
				button.toggleAttribute("aria-checked", button.name == value)
			})
		}
	}
}

import {BentoElement} from "./base.js"
import {Screen} from "../graphics/constants.js"

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
				event.stopImmediatePropagation()
				if (event.target instanceof HTMLButtonElement) {
					this.announce("screen", {
						screen: /** @type Screen */ (event.target.name)
					})
				} else {
					this.announce("open")
				}
			}
		)
		this.addEventListener("mousedown", event => {
			event.stopImmediatePropagation()
		})
		this.addEventListener("touchstart", event => {
			event.stopImmediatePropagation()
		})
	}

	#selectedIndex() {
		let sel = Array.from(this.shadow.firstElementChild.children).findIndex(n =>
			n.hasAttribute("aria-checked")
		)
		return sel == -1 ? 0 : sel
	}

	attributeChangedCallback(attr, old, value) {
		if (attr == "screens") {
			if (old == value) {
				return
			}
			let nav = this.shadow.firstElementChild
			let sel = this.#selectedIndex()
			nav.textContent = ""
			// todo the joining and splitting of this is wasteful. use a prop instead
			let names = value.split(/\s+/)

			for (let name of names) {
				let button = document.createElement("button")
				button.textContent = name
				button.name = name
				nav.appendChild(button)
			}
			nav.children[sel].setAttribute("aria-checked", "true")
			this.announce("screen", {
				screen: names[sel]
			})
		} else if (attr == "selected") {
			Array.from(this.shadow.querySelectorAll("button")).forEach(button => {
				button.toggleAttribute("aria-checked", button.name == value)
			})
		}
	}
}

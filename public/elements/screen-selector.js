import {bentoElements, BentoElement} from "./base.js"

export default class BentoScreenSelector extends BentoElement {
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<nav></nav>`
		this.attachStylesheet("screen-selector")

		this.addEventListener("mousedown", event => {
			event.stopImmediatePropagation()
		})
		this.addEventListener("touchstart", event => {
			event.stopImmediatePropagation()
		})
	}

	/** @type {Screen} */
	get selectedScreen() {
		return this.get("selectedScreen")
	}

	set selectedScreen(name) {
		this.set("selectedScreen", name, () => {
			this.selector.selectedScreen = name
		})
	}
}
bentoElements.define("bento-screen-selector", BentoScreenSelector)

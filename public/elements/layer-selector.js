import * as loop from "../convenience/loop.js"
import {bentoElements, BentoElement} from "./base.js"

export default class BentoLayerSelector extends BentoElement {
	/** @type {HTMLInputElement[]} */
	#radios = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend>layer</legend>
			</fieldset>`
		this.attachStylesheet("layer-selector")
		let fieldset = this.shadow.firstElementChild
		loop.layers(lidx => {
			let id = lidx.toString()
			let label = document.createElement("label")
			label.htmlFor = id
			label.draggable = true
			label.textContent = ["a", "b", "c", "d", "s"][lidx] || lidx.toString()
			fieldset.appendChild(label)
			let radio = document.createElement("input")
			radio.type = "radio"
			radio.id = id
			radio.name = "selected-layer"
			radio.autocomplete = "off"
			radio.checked = lidx == 0
			radio.value = id
			label.appendChild(radio)
			this.#radios.push(radio)
		})

		this.shadow.addEventListener(
			"change",
			/** @param {InputEvent} event */
			event => {
				let index = this.#radios.indexOf(
					/** @type {HTMLInputElement} */ (event.target)
				)
				if (index != null) {
					this.announce("change", {
						change: "layer",
						value: index
					})
				}
			}
		)
	}

	/** @param {number} val */
	set selected(val) {
		this.#radios.forEach((radio, index) => {
			radio.toggleAttribute("checked", index == val)
			radio.checked = index == val
			radio.parentElement.classList.toggle("checked", index == val)
		})
	}
}
bentoElements.define("bento-layer-selector", BentoLayerSelector)

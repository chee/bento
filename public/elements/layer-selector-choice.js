import {LayerType} from "../memory/constants.js"
import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"

export default class BentoLayerSelectorChoice extends BentoElement {
	button = document.createElement("button")
	connectedCallback() {
		if (!this.shadow) {
			this.shadow = this.attachShadow({mode: "closed"})
			this.shadow.append(this.button)
			this.attachStylesheet("layer-selector-choice")
			this.button.addEventListener("click", () => {
				this.announce("select-layer", this.layer.index)
			})
		}
	}

	/** @type {Layer["view"]} */
	get layer() {
		return this.get("layer")
	}

	set layer(layer) {
		this.set("layer", layer, () => {
			this.name = String.fromCharCode(layer.index + 97)
			this.muted = !layer.muted
			this.on = layer.type != "off"
			this.type = layer.type
		})
	}

	/** @type string */
	get name() {
		return this.get("name")
	}

	set name(val) {
		this.set("name", val, () => {
			this.button.textContent = val
		})
	}

	/** @type boolean */
	get muted() {
		return this.get("muted")
	}

	set muted(val) {
		this.set("muted", val, () => {
			this.toggleAttribute("muted", val)
		})
	}

	/** @type boolean */
	get on() {
		return this.get("on")
	}

	set on(val) {
		this.set("on", val, () => {
			this.toggleAttribute("on", val)
		})
	}

	/** @type {keyof typeof LayerType} */
	get type() {
		return this.get("type")
	}

	set type(val) {
		this.set("type", val, () => {
			this.setAttribute("type", val)
		})
	}

	/** @type boolean */
	get selected() {
		return this.get("selected")
	}

	set selected(val) {
		this.set("selected", val, () => {
			this.ariaSelected = val.toString()
		})
	}
}

bentoElements.define("bento-layer-selector-choice", BentoLayerSelectorChoice)

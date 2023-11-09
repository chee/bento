import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"
import {Screen} from "../graphics/constants.js"
import {LayerType} from "../memory/constants.js"

export default class BentoScreenSelector extends BentoElement {
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<nav></nav>`
		this.attachStylesheet("screen-selector")
		this.nav = this.shadow.firstElementChild

		this.addEventListener("mousedown", event => {
			event.stopImmediatePropagation()
		})
		this.addEventListener("touchstart", event => {
			event.stopImmediatePropagation()
		})

		this.nav.addEventListener("click", event => {
			let target = /** @type HTMLElement */ (event.target)
			let button = target.closest("button")
			if (button) {
				let name = /** @type Screen */ (button.name)
				if (name in Screen) {
					this.announce("select-screen", name)
				}
			}
		})
	}

	/** @type {Layer["view"]} */
	get selectedLayer() {
		return this.get("selectedLayer")
	}

	set selectedLayer(val) {
		this.set("selectedLayer", val, () => {
			this.enable()
		})
	}

	/** @type {Screen} */
	get selectedScreen() {
		return this.get("selectedScreen")
	}

	set selectedScreen(name) {
		this.set("selectedScreen", name, () => {
			this.enable()
		})
	}

	enable() {
		this.nav.textContent = ``
		// let selectedScreen = this.selectedScreen || Screen.wav
		let selectedLayerType = this.selectedLayer?.type || LayerType.sampler
		if (
			// selectedScreen == Screen.wav &&
			selectedLayerType == LayerType.sampler
		) {
			for (let screen of [Screen.wav, Screen.mix, Screen.key]) {
				let button = document.createElement("button")
				button.name = screen
				button.textContent = screen
				this.nav.append(button)
			}
		}
	}
}
bentoElements.define("bento-screen-selector", BentoScreenSelector)

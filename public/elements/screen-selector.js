import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"
import {Screen} from "../graphics/constants.js"

export default class BentoScreenSelector extends BentoElement {
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<nav role="radiogroup"></nav>`
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
		let selectedScreen = this.selectedScreen
		let selectedLayerType = this.selectedLayer?.type
		/** @type {Screen[]} */
		let screens = {
			sampler: [Screen.wav, Screen.mix],
			synth: [Screen.snd, Screen.mix, Screen.key],
			off: [Screen.snd]
		}[selectedLayerType]
		for (let screen of screens) {
			let button = document.createElement("button")
			button.name = screen
			button.textContent = screen
			button.role = "radio"
			this.nav.append(button)
			if (screen == selectedScreen) {
				button.ariaChecked = "true"
			}
		}
		if (!screens.includes(selectedScreen)) {
			if (screens[0]) {
				this.announce("select-screen", screens[0])
				this.nav.children[0].ariaChecked = "true"
			}
		}
	}
}
bentoElements.define("bento-screen-selector", BentoScreenSelector)

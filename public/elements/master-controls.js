import {BentoElement, bentoElements} from "./base.js"
import icons from "../icons.js"

/**
 * @typedef {Object} ControlSpec
 * @prop {string} name
 * @prop {string} type
 * @prop {string} icon
 * @prop {string} label
 */

export default class BentoMasterControls extends BentoElement {
	/** @type {HTMLInputElement} */
	#bpmElement

	/** @param {ControlSpec} control */
	createButton(control) {
		let element = document.createElement("button")
		element.innerHTML = control.icon
		if (control.type == "button") {
			element.addEventListener("click", () => {
				this.announce(control.name)
			})
		}
		element.id = control.name
		element.ariaLabel = control.label
		return element
	}

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend>master</legend>
			</fieldset>
		`
		this.attachStylesheet("master-controls")
		let fieldset = /** @type HTMLElement */ (this.shadow.firstElementChild)

		fieldset.appendChild(
			this.createButton({
				name: "play",
				type: "button",
				icon: icons.get("play").outerHTML,
				label: "Start or restart the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "pause",
				type: "button",
				icon: icons.get("pause").outerHTML,
				label: "Pause the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "stop",
				type: "button",
				icon: icons.get("stop").outerHTML,
				label: "Stop the music"
			})
		)
		let bpm = document.createElement("input")
		bpm.autocomplete = "off"
		bpm.type = "number"
		bpm.inputMode = "decimal"
		bpm.min = "20"
		bpm.max = "240"
		bpm.value = "120"
		bpm.addEventListener("change", () => {
			let value = Math.clamp(+bpm.value, +bpm.min, +bpm.max)
			this.announce("set-bpm", value)
			this.value = value
		})

		this.#bpmElement = bpm
		bpm.id = "bpm"
		bpm.ariaLabel = "Set the tempo in beats per minute"
		fieldset.appendChild(bpm)

		let settingsButton = this.createButton({
			name: "settings",
			type: "toggle",
			icon: "•••",
			label: "Open the settings"
		})

		settingsButton.addEventListener("click", () => {
			this.announce("toggle-settings")
		})

		fieldset.appendChild(settingsButton)
		this.setDefault("bpm", 120)
	}

	/** @type number */
	get bpm() {
		return this.get("bpm")
	}

	set bpm(val) {
		this.set("bpm", val, () => {
			let el = this.#bpmElement
			el.value = val.toString()
		})
	}

	/** @type boolean */
	get playing() {
		return this.get("playing")
	}

	set playing(val) {
		this.set("playing", val, () => {
			this.toggleAttribute("playing", val)
		})
	}

	/** @type boolean */
	get paused() {
		return this.get("paused")
	}

	set paused(val) {
		this.set("paused", val, () => {
			this.toggleAttribute("paused", val)
		})
	}
}

bentoElements.define("bento-master-controls", BentoMasterControls)

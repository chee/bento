import {BentoElement} from "./base.js"

/** @typedef {Object} ControlSpec
 * @param {string} name
 * @param {string} type
 * @param {string} icon
 * @param {string} label
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
		let fieldset = this.shadow.firstElementChild

		fieldset.appendChild(
			this.createButton({
				name: "play",
				type: "button",
				icon: "▶&#xfe0e;",
				label: "Start or restart the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "pause",
				type: "button",
				icon: "⏸&#xfe0e;",
				label: "Pause the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "stop",
				type: "button",
				icon: "⏹&#xfe0e;",
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
			this.announce("change", {
				change: "bpm",
				value: Math.clamp(+bpm.min, +bpm.value, +bpm.max)
			})
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
			this.announce("settings")
		})
		fieldset.appendChild(settingsButton)
	}

	get bpm() {
		if (this.#bpmElement) {
			let el = this.#bpmElement
			return Math.clamp(+el.min, +el.value, +el.max)
		} else {
			return 120
		}
	}

	set bpm(val) {
		let el = this.#bpmElement
		if (el && this.shadow.activeElement != el) {
			el.value = val.toString()
		}
	}
}

import {BentoElement, bentoElements} from "./base.js"

/** @typedef {Object} ControlSpec
 * @param {string} name
 * @param {string} type
 * @param {string} icon
 * @param {string} label
 */

export default class BentoMasterControls extends BentoElement {
	static icons = {
		play: `<svg viewBox="-5 -5 522 522" xmlns="http://www.w3.org/2000/svg">
				<polygon points="12,16 8,512 512,264"/>
			</svg>`,
		stop: `<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
				<rect width="1" height="1"/>
			</svg>`,
		sqop: `<svg viewBox="-10 -10 522 522" xmlns="http://www.w3.org/2000/svg">
				<path d="M 0 256C 0 10, 10 0, 256 0S 512 10, 512 256, 502 512 256 512, 0 502, 0 256"/>
			</svg>`,
		paus: `<svg viewBox="-5 -5 522 522" xmlns="http://www.w3.org/2000/svg">
				<rect width="176" height="480" x="48" y="16"/>
				<rect width="176" height="480" x="288" y="16"/>
			</svg>`
	}

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
				icon: BentoMasterControls.icons.play,
				label: "Start or restart the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "pause",
				type: "button",
				icon: BentoMasterControls.icons.paus,
				label: "Pause the music"
			})
		)
		fieldset.appendChild(
			this.createButton({
				name: "stop",
				type: "button",
				icon: BentoMasterControls.icons.sqop,
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
				value: Math.clamp(+bpm.value, +bpm.min, +bpm.max)
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
			this.announce("toggle-settings")
		})
		fieldset.appendChild(settingsButton)
	}

	get bpm() {
		if (this.#bpmElement) {
			let el = this.#bpmElement
			return Math.clamp(+el.value, +el.min, +el.max) || 120
		} else {
			return 120
		}
	}

	set bpm(val) {
		let el = this.#bpmElement
		if (el && this.shadow.activeElement != el) {
			el.value = val ? Math.clamp(val, +el.min, +el.max).toString() : ""
		}
	}
}

bentoElements.define("bento-master-controls", BentoMasterControls)

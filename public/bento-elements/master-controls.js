import {BentoElement} from "./base.js"

export default class BentoMasterControls extends BentoElement {
	static controls = [
		{
			name: "play",
			type: "button",
			icon: "▶&#xfe0e;",
			label: "Start or restart the music"
		},
		{
			name: "pause",
			type: "button",
			icon: "⏸&#xfe0e;",
			label: "Pause the music"
		},
		{
			name: "stop",
			type: "button",
			icon: "⏹&#xfe0e;",
			label: "Stop the music"
		},
		{
			name: "bpm",
			type: "bpm",
			label: "Beats per minute"
		}
		// {
		// 	name: "options",
		// 	type: "button",
		// 	icon: "•••",
		// 	label: "Open the master options"
		// }
	]

	/** @type {HTMLInputElement} */
	#bpmElement

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend>master</legend>
			</fieldset>`
		this.attachStylesheet("master-controls")
		let fieldset = this.shadow.firstElementChild
		for (let control of BentoMasterControls.controls) {
			let element
			if (control.name == "bpm") {
				element = document.createElement("input")
				element.autocomplete = "off"
				element.type = "number"
				element.inputMode = "decimal"
				element.min = "20"
				element.max = "240"
				element.value = "120"
				element.addEventListener("change", () => {
					this.announce("change", {
						change: "bpm",
						value: Math.clamp(+element.min, +element.value, +element.max)
					})
				})
				this.#bpmElement = element
			} else if (control.type == "button") {
				element = document.createElement("button")
				element.innerHTML = control.icon
				element.addEventListener("click", () => {
					this.announce(control.name)
				})
			} else {
				continue
			}
			element.id = control.name
			element.ariaLabel = control.label
			fieldset.appendChild(element)
		}
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

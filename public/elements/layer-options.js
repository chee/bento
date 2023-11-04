import {BentoElement} from "./base.js"

export default class BentoLayerOptions extends BentoElement {
	static speeds = [
		{
			value: 0.25,
			label: "×¼"
		},
		{
			value: 0.5,
			label: "×½"
		},
		{
			value: 1,
			label: "×1"
		},
		{
			value: 2,
			label: "×2"
		},
		{
			value: 4,
			label: "×4"
		}
	]
	static polyamorousSpeeds = [
		{
			value: 0.75,
			label: "x¾"
		},
		{
			value: 3,
			label: "×3"
		}
	]
	/** @type {HTMLSelectElement} */
	#speedSelector
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend screenreader>layer options</legend>
			</fieldset>`
		this.attachStylesheet("layer-options")
		let fieldset = this.shadow.firstElementChild
		let speedSelector = document.createElement("select")
		for (let speed of BentoLayerOptions.speeds) {
			let option = document.createElement("option")
			option.textContent = speed.label
			option.value = speed.value.toString()
			speedSelector.appendChild(option)
		}
		fieldset.appendChild(speedSelector)
		this.#speedSelector = speedSelector
		speedSelector.addEventListener("change", () => {
			this.announce("change", {
				change: "speed",
				value: Number(this.#speedSelector.value)
			})
		})

		let record = document.createElement("button")
		record.ariaLabel = "Record a sound"
		record.textContent = "●"
		record.id = "record"
		fieldset.appendChild(record)
		record.addEventListener("click", () => {
			record.blur()
			this.announce("record")
		})

		// not fully convinced i should include these
		// they make it easier to make bad music
		// let optgroup = document.createElement("optgroup")
		// this.#speedSelector.appendChild(optgroup)
		// optgroup.label = "ethically non-monogamous"
		// for (let speed of BentoLayerOptions.polyamorousSpeeds) {
		// 	let option = document.createElement("option")
		// 	option.textContent = speed.label
		// 	option.value = speed.value.toString()
		// 	optgroup.appendChild(option)
		// }
		// let lengthSelector = document.createElement("select")
		// for (let i = NUMBER_OF_STEPS; i > 2; i--) {
		// 	let option = document.createElement("option")
		// 	option.value = i.toString()
		// 	option.textContent = i.toString()
		// 	lengthSelector.append()
		// }
	}

	/** @param {number} val */
	set speed(val) {
		if (val != +this.#speedSelector.value) {
			this.#speedSelector.value = val.toString()
		}
	}
}

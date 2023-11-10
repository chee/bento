import Grid from "../memory/tree/grid.js"
import {bentoElements, BentoElement} from "./base.js"

export default class BentoGridControls extends BentoElement {
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
				<legend screenreader>grid controls</legend>
			</fieldset>`
		this.attachStylesheet("grid-controls")
		let fieldset = this.shadow.firstElementChild
		let speedSelector = document.createElement("select")
		for (let speed of BentoGridControls.speeds) {
			let option = document.createElement("option")
			option.textContent = speed.label
			option.value = speed.value.toString()
			speedSelector.appendChild(option)
		}
		fieldset.appendChild(speedSelector)
		this.#speedSelector = speedSelector

		speedSelector.addEventListener("change", () => {
			this.announce("set-grid-speed", {
				index: this.grid.index,
				value: Number(this.#speedSelector.value)
			})
		})

		// let optgroup = document.createElement("optgroup")
		// this.#speedSelector.appendChild(optgroup)
		// optgroup.label = "ethically non-monogamous"
		// for (let speed of BentoGridControls.polyamorousSpeeds) {
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

	/** @type {number} */
	get speed() {
		return this.get("speed")
	}

	set speed(val) {
		this.set("speed", val, () => {
			this.#speedSelector.value = val.toString()
		})
	}

	/** @type {Grid["view"]} */
	get grid() {
		return this.get("grid")
	}

	set grid(val) {
		this.set("grid", val, () => {
			this.speed = val.speed
			this.jump = val.jump
			this.loop = val.loop
			this.on = val.on
		})
	}

	/** @type {number} */
	get jump() {
		return this.get("jump")
	}

	set jump(val) {
		this.set("jump", val, () => {})
	}

	/** @type {number} */
	get loop() {
		return this.get("loop")
	}

	set loop(val) {
		this.set("loop", val, () => {})
	}

	/** @type {boolean} */
	get on() {
		return this.get("on")
	}

	set on(val) {
		this.set("on", val, () => {})
	}
}

bentoElements.define("bento-grid-controls", BentoGridControls)

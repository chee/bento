import Grid from "../memory/tree/grid.js"
import {bentoElements, BentoElement} from "./base.js"

export default class BentoGridControls extends BentoElement {
	/** @type {import("./control-popout.js").PopoutChoiceSpec<number>[]} */
	static speeds = [
		{
			value: 0.25,
			description: "×¼",
			label: "quarter speed"
		},
		{
			value: 0.5,
			description: "×½",
			label: "half speed"
		},
		{
			value: 1,
			description: "×1",
			label: "normal speed"
		},
		{
			value: 2,
			description: "×2",
			label: "double speed"
		},
		{
			value: 4,
			description: "×4",
			label: "quadruple speed"
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

	#speedSelector = document.createElement("bento-control-popout")
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend screenreader>grid controls</legend>
			</fieldset>`
		this.attachStylesheet("grid-controls")
		let fieldset = this.shadow.firstElementChild

		this.#speedSelector.spec =
			/** @type {import("./control-popout.js").PopoutControlSpec<number>} */ ({
				content: ["speed", "×1"],
				label: "Set the speed of this grid on this layer",
				name: "speed",
				choices: BentoGridControls.speeds,
				value: this.speed || 1
			})
		fieldset.append(this.#speedSelector)

		customElements.whenDefined("bento-control-popout").then(() => {
			this.#speedSelector.when("choose", ({choice}) => {
				this.announce("set-grid-speed", {
					index: this.grid.index,
					value: choice
				})
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
			this.#speedSelector.value = val
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

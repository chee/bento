import Grid from "../memory/tree/grid.js"
import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"
import * as controls from "./controls.js"

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

	controlElements = {
		speed: controls.popout({
			label: "Set the speed of this layer",
			name: "speed",
			choices: BentoGridControls.speeds,
			value: this.speed || 1
		}),
		loop: controls.popout({
			label: "Set the number of times this grid repeats",
			name: "repeat",
			value: this.loop || 0,
			choices: [
				{
					label: "no repeats",
					value: 0,
					description: "no"
				},
				{
					label: "1 repeat",
					value: 1
				},
				{
					label: "2 repeat",
					value: 2
				},
				{
					label: "3 repeat",
					value: 3
				},
				{
					label: "4 repeat",
					value: 4
				},
				{
					label: "infinite repeats",
					value: 0xff,
					description: "yes"
				}
			]
		})
	}

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset id="layer-controls">
				<legend>layer</legend>
			</fieldset>
			<fieldset id="grid-controls">
				<legend>grid</legend>
			</fieldset>`
		this.attachStylesheet("grid-controls")
		let layerControls = this.shadow.getElementById("layer-controls")
		let gridControls = this.shadow.getElementById("grid-controls")

		layerControls.append(this.controlElements.speed)
		gridControls.append(this.controlElements.loop)

		customElements.whenDefined("bento-control-popout").then(() => {
			this.controlElements.speed.when("choose", ({choice}) => {
				// if (closest("bento-party").playing)
				// await this.waitForZero()
				this.announce("set-layer-speed", {
					index: this.layer.index,
					value: choice
				})
			})
			this.controlElements.loop.when("choose", ({choice}) => {
				this.announce("set-grid-loop", {
					index: this.grid.index,
					value: choice
				})
			})
		})
	}

	/** @type {number} */
	get speed() {
		return this.get("speed")
	}

	set speed(val) {
		this.set("speed", val, () => {
			this.controlElements.speed.value = val
		})
	}

	/** @type {Grid["view"]} */
	get grid() {
		return this.get("grid")
	}

	set grid(val) {
		this.set("grid", val, () => {
			this.jump = val.jump
			this.loop = val.loop
			this.on = val.on
		})
	}

	/** @type {Layer["view"]} */
	get layer() {
		return this.get("layer")
	}

	set layer(val) {
		this.set("layer", val, () => {
			this.speed = val.speed
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
		this.set("loop", val, () => {
			console.log({val})
			this.controlElements.loop.value = val
		})
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

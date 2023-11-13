import Grid from "../memory/tree/grid.js"
import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"

export default class BentoGridControls extends BentoElement {
	controlElements = {
		speed: document.createElement("bento-speed-selector"),
		loop: document.createElement("bento-loop-selector"),
		jump: document.createElement("bento-jump-selector")
	}

	connectedCallback() {
		if (!this.shadow) {
			this.shadow = this.attachShadow({mode: "closed"})
			this.shadow.innerHTML = `
			<fieldset id="layer-controls">
				<legend>layer</legend>
			</fieldset>
			<fieldset id="grid-controls">
				<legend>grid</legend>
			</fieldset>`
			this.addStylesheet("control-strip")
			this.addStylesheet("grid-controls")
		}
		let layerControls = this.shadow.getElementById("layer-controls")
		let gridControls = this.shadow.getElementById("grid-controls")

		layerControls.append(this.controlElements.speed)
		// gridControls.append(this.controlElements.jump)
		gridControls.append(this.controlElements.loop)

		customElements.whenDefined("bento-control-popout").then(() => {
			this.controlElements.speed.when("speed", value => {
				// if (closest("bento-party").playing)
				// await this.waitForZero()
				this.announce("set-layer-speed", {
					index: this.layer.index,
					value
				})
			})
			this.controlElements.loop.when("loop", value => {
				this.announce("set-grid-loop", {
					index: this.grid.index,
					value
				})
			})
			this.controlElements.jump.when("jump", value => {
				this.announce("set-grid-jump", {
					index: this.grid.index,
					value
				})
			})
		})
		this.shadow.addEventListener("open", event => {
			;[...layerControls.children, ...gridControls.children].forEach(chile => {
				if (chile != event.target) {
					chile.open = false
				}
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

import {BentoElement, bentoElements} from "./base.js"
import {Screen} from "../graphics/constants.js"
import Layer from "../memory/tree/layer.js"
import {LayerType} from "../memory/constants.js"
import Step from "../memory/tree/step.js"
import icons from "../icons.js"
import BentoControlButton from "./control-button.js"

/** @typedef {typeof ScreenControl[keyof typeof ScreenControl]} ScreenControl */
export const ScreenControl = /** @type const */ ({
	edit: "edit",
	snip: "snip",
	flip: "flip",
	lift: "lift",
	drop: "drop",
	tune: "tune",
	spread: "spread",
	record: "record",
	loop: "loop"
})

const ScreenControlSet = /** @type const */ ({
	[LayerType.sampler]: {
		[Screen.wav]: [ScreenControl.flip, ScreenControl.record]
	}
})

/**
 * @typedef {import("./control-button.js").ControlSpec & {
		stepProperty?: keyof Step["view"]
	}} ScreenControlSpec
 */

/** @type Map<ScreenControl, ScreenControlSpec> */
let controls = new Map()

controls.set("record", {
	label: "Record a new sound for this layer",
	name: "record",
	content: icons.get("record")
})

controls.set("flip", {
	label: "Flip the sound on this step",
	name: "flip",
	content: ["flip", icons.get("flip")],
	stepProperty: "reversed"
})

controls.set("loop", {
	label: "Loop the sound on this step",
	name: "loop",
	content: ["loop", icons.get("loop")],
	stepProperty: "loop"
})

export default class BentoScreenControls extends BentoElement {
	/** @type Map<keyof Step["view"], BentoControlButton> */
	stepPropertyElements = new Map()
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.container = this.shadow.appendChild(document.createElement("div"))
		this.attachStylesheet("screen-controls")
		this.addEventListener("mousedown", event => {
			event.stopImmediatePropagation()
		})
		this.addEventListener("touchstart", event => {
			event.stopImmediatePropagation()
		})
	}

	/** @param {ScreenControl} control */
	add(control) {
		let c = controls.get(control)
		let b = document.createElement("bento-control-button")
		this.shadow.append(b)
		for (let [key, value] of Object.entries(c)) {
			b[key] = value
		}
	}

	/** @type {Screen} */
	get selectedScreen() {
		return this.get("selectedScreen")
	}

	set selectedScreen(val) {
		this.set("selectedScreen", val, () => {
			this.enable()
		})
	}

	/** @param {Layer["view"]} val */
	set selectedLayer(val) {
		this.selectedLayerType = val.type
	}

	/** @type {LayerType} */
	get selectedLayerType() {
		return this.get("selectedLayerType")
	}

	set selectedLayerType(val) {
		this.set("selectedLayerType", val, () => {
			this.enable()
		})
	}

	/** @type {Step["view"]} */
	get selectedStep() {
		return this.get("selectedStep")
	}

	set selectedStep(val) {
		this.set("selectedStep", val, () => {
			for (let key in val) {
				let value = val[key]
				if (typeof value == "boolean") {
					let el = this.stepPropertyElements.get(
						/** @type {keyof Step["view"]} */ (key)
					)
					if (el) {
						el.on = value
					}
					this.toggleAttribute(key, value)
				} else {
					this.setAttribute(key, value)
				}
			}
		})
	}

	/** @type {ScreenControl[]?} */
	get controls() {
		return this.get("controls")
	}

	set controls(val) {
		this.set("controls", val, () => {
			this.container.textContent = ``
			if (!val) {
				return
			}
			for (let screen of val) {
				let button = document.createElement("bento-control-button")
				let spec = controls.get(screen)
				button.spec = spec
				if (spec.stepProperty) {
					this.stepPropertyElements.set(spec.stepProperty, button)
				}
				this.container.append(button)
			}
		})
	}

	enable() {
		let selectedLayerType = this.selectedLayerType || LayerType.sampler
		let selectedScreen = this.selectedScreen || Screen.wav
		this.controls = ScreenControlSet[selectedLayerType]?.[selectedScreen]
	}
}

bentoElements.define("bento-screen-controls", BentoScreenControls)

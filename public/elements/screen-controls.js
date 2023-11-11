import {BentoElement, bentoElements} from "./base.js"
import {Screen} from "../graphics/constants.js"
import Layer from "../memory/tree/layer.js"
import {LayerType} from "../memory/constants.js"
import Step from "../memory/tree/step.js"
import icons from "../icons.js"
import * as controls from "./controls.js"

/** @typedef {typeof ScreenControl[keyof typeof ScreenControl]} ScreenControl */
export const ScreenControl = /** @type const */ ({
	// wav
	// edit: "edit",
	// snip: "snip",
	flip: "flip",
	// lift: "lift",
	// drop: "drop",
	// tune: "tune",
	// spread: "spread",
	record: "record",
	loop: "loop",

	// key
	hear: "hear"
})

const ScreenControlSet = /** @type const */ ({
	[LayerType.sampler]: {
		[Screen.wav]: [ScreenControl.flip, ScreenControl.record],
		[Screen.key]: [ScreenControl.hear]
	}
})

/**
 * @typedef {import("./control-button.js").ButtonControlSpec & {
		stepProperty?: keyof Step["view"]
	}} ScreenControlSpec
 */

export default class BentoScreenControls extends BentoElement {
	controlElements = /** @type const */ ({
		record: controls.button({
			label: "Record a new sound for this layer",
			name: "record",
			content: icons.get("record")
		}),
		hear: controls.button({
			name: "hear",
			content: ["hear", "🔈"],
			label: "Hear the note when you play it"
		}),
		flip: controls.button({
			label: "Flip the sound on this step",
			name: "flip",
			content: ["flip", icons.get("flip")]
		}),
		loop: controls.button({
			label: "Loop the sound on this step",
			name: "loop",
			content: ["loop", icons.get("loop")]
		})
	})

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
			this.flip = val.reversed
		})
	}

	/** @type {boolean} */
	get flip() {
		return this.get("flip")
	}

	set flip(val) {
		this.set("flip", val, () => {
			this.toggleAttribute("flip", val)
			this.controlElements.flip.on = val
		})
	}

	/** @type {boolean} */
	get hear() {
		return this.get("hear")
	}

	set hear(val) {
		this.set("hear", val, () => {
			this.toggleAttribute("hear", val)
			this.controlElements.hear.on = val
		})
	}

	/** @type {ScreenControl[]?} */
	get controls() {
		return this.get("controls")
	}

	enable() {
		let selectedLayerType = this.selectedLayerType || LayerType.sampler
		let selectedScreen = this.selectedScreen || Screen.wav
		let ctrl = ScreenControlSet[selectedLayerType]?.[selectedScreen]
		this.set("controls", ctrl, () => {
			this.container.textContent = ``
			if (!ctrl) {
				return
			}
			for (let screen of ctrl) {
				this.container.append(this.controlElements[screen])
			}
		})
	}
}

bentoElements.define("bento-screen-controls", BentoScreenControls)

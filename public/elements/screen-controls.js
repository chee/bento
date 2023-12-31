import {BentoElement, bentoElements} from "./base.js"
import {Screen} from "../graphics/constants.js"
import Layer from "../memory/tree/layer.js"
import {LayerType, StepState} from "../memory/constants.js"
import Step from "../memory/tree/step.js"

/** @typedef {typeof ScreenControl[keyof typeof ScreenControl]} ScreenControl */
export const ScreenControl = /** @type const */ ({
	// sound:
	type: "type",
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
	hear: "hear",
	ctrl: "ctrl"
})

const ScreenControlSet = /** @type const */ ({
	sampler: {
		[Screen.wav]: {
			sound: [ScreenControl.record],
			step: [ScreenControl.loop, ScreenControl.flip, ScreenControl.ctrl]
		},
		[Screen.mix]: {
			sound: [ScreenControl.record],
			step: [ScreenControl.loop, ScreenControl.flip, ScreenControl.ctrl]
		},
		[Screen.flt]: {
			sound: [ScreenControl.record],
			step: [ScreenControl.loop, ScreenControl.flip, ScreenControl.ctrl]
		},
		[Screen.key]: {
			sound: [ScreenControl.record],
			step: [ScreenControl.loop, ScreenControl.flip, ScreenControl.ctrl]
		}
	}
})

export default class BentoScreenControls extends BentoElement {
	controlElements = /** @type const */ ({
		record: document.createElement("bento-record-button"),
		hear: document.createElement("bento-hear-button"),
		flip: document.createElement("bento-flip-button"),
		loop: document.createElement("bento-loop-selector"),
		type: document.createElement("bento-layer-type-selector"),
		ctrl: document.createElement("bento-control-button")
	})

	connectedCallback() {
		if (!this.shadow) {
			this.shadow = this.attachShadow({mode: "closed"})
			this.shadow.innerHTML = `
			<fieldset id="sound-controls">
				<legend>sound</legend>
			</fieldset>
			<fieldset id="step-controls">
				<legend>step</legend>
			</fieldset>`
			this.addStylesheet("control-strip")
			this.addStylesheet("screen-controls")
		}
		this.soundControlsContainer = this.shadow.getElementById("sound-controls")
		this.stepControlsContainer = this.shadow.getElementById("step-controls")
		this.addEventListener("mousedown", event => {
			event.stopImmediatePropagation()
		})
		this.addEventListener("touchstart", event => {
			event.stopImmediatePropagation()
		})
		this.controlElements.ctrl.name = "ctrl"
		this.controlElements.ctrl.button.textContent = "ctrl"
		this.controlElements.loop.displayName = "trig"
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

	/** @type {keyof typeof LayerType} */
	get selectedLayerType() {
		return this.get("selectedLayerType")
	}

	set selectedLayerType(val) {
		this.set("selectedLayerType", val, () => {
			this.enable()
			this.controlElements.type.value = val
		})
	}

	/** @type {Step["view"]} */
	get selectedStep() {
		return this.get("selectedStep")
	}

	set selectedStep(val) {
		this.set("selectedStep", val, () => {
			this.flip = val.reversed
			this.loop = val.loop
			this.ctrl = val.state == "ctrl"
		})
	}

	/** @type {number} */
	get loop() {
		return this.get("loop")
	}

	set loop(val) {
		this.set("loop", val, () => {
			this.setAttribute("loop", val.toString())
			this.controlElements.loop.value = val
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
	get ctrl() {
		return this.get("ctrl")
	}

	set ctrl(val) {
		this.set("ctrl", val, () => {
			this.toggleAttribute("ctrl", val)
			this.controlElements.ctrl.on = val
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
	get soundControls() {
		return this.get("soundControls")
	}

	get stepControls() {
		return this.get("stepControls")
	}

	enable() {
		let selectedLayerType = this.selectedLayerType
		let selectedScreen = this.selectedScreen
		let ctrl = ScreenControlSet[selectedLayerType]?.[selectedScreen]
		this.set("soundControls", ctrl?.sound, () => {
			this.soundControlsContainer.textContent = ``
			if (!ctrl?.sound) {
				return
			}
			this.soundControlsContainer.innerHTML = `<legend>sound</legend>`
			for (let screen of ctrl?.sound) {
				this.soundControlsContainer.append(this.controlElements[screen])
			}
		})
		this.set("stepControls", ctrl?.step, () => {
			this.stepControlsContainer.textContent = ``
			if (!ctrl?.step) {
				return
			}
			this.stepControlsContainer.innerHTML = `<legend>step</legend>`
			for (let screen of ctrl?.step) {
				this.stepControlsContainer.append(this.controlElements[screen])
			}
		})
	}
}

bentoElements.define("bento-screen-controls", BentoScreenControls)

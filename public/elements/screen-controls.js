import {BentoElement, bentoElements} from "./base.js"
import BentoControlButton from "./control-button.js"
import {Screen} from "../graphics/constants.js"
import Layer from "../memory/tree/layer.js"
import {LayerType} from "../memory/constants.js"
import Step from "../memory/tree/step.js"

/** @typedef {typeof ScreenControl[keyof typeof ScreenControl]} ScreenControl */
export const ScreenControl = /** @type const */ ({
	edit: "edit",
	snip: "snip",
	flip: "flip",
	lift: "lift",
	drop: "drop",
	tune: "tune",
	spread: "spread",
	record: "record"
})

/** @param {string} content */
function q(content) {
	let el = document.createElement("div")
	el.innerHTML = content
	return el.querySelector("svg")
}

/** @type Map<ScreenControl, Pick<BentoControlButton, "label" | "name" | "icon">> */
let controls = new Map()
controls.set("record", {
	label: "Record a new sound for this layer",
	name: "record",
	// todo obviously
	icon: q(`<svg
   width="512"
   height="512"
   viewBox="0 0 135.46666 135.46667">
  <defs
     id="defs1">
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipmask">
      <ellipse
         style="display:inline;fill:#000000;stroke:#000000;stroke-width:2.69088;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
         id="ellipse7"
         cx="67.428116"
         cy="68.70816"
         rx="66.612587"
         ry="66.598152" />
    </clipPath>
  </defs>
    <g
		id="icon"
		transform="matrix(1.0073843,0,0,1.0111098,0.00202608,-1.5095976)"
		clip-path="url(#clipmask)">
	  <ellipse
		  style="fill:none;stroke-width:8;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
		  id="circle"
		  cx="67.442467"
		  cy="68.664207"
		  rx="64.853844"
		  ry="64.518684" />
	  <path
		  style="stroke-width:4;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
		  d="M -5.5535696,61.589137 116.97691,-8.8955645"
		  id="line1" />
	  <path
		  style="stroke-width:4;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
		  d="M -3.9635625,95.249683 130.96204,17.350348"
		  id="line2" />
	  <path
		  style="stroke-width:4;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
		  d="M 2.281087,125.4797 136.25027,48.132526"
		  id="line3" />
	  <path
		  style="stroke-width:4;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
		  d="M 30.414897,139.26381 136.3314,78.112848"
		  id="line4" />
	</g>
</svg>`)
})
controls.set("flip", {
	label: "Flip the sound on this step",
	name: "flip",
	icon: q(`<svg
   width="512"
   height="512"
   viewBox="0 0 135.46666 135.46667">
    <path
       style="stroke-width:1.946;stroke-linejoin:round;paint-order:markers stroke fill"
       d="M 37.938567,3.4008544 C 19.491324,20.848623 18.312686,21.445441 1.6627848,34.008546 21.077196,45.867157 20.959923,45.651534 37.95772,61.251664 Z"
       id="path1" />
    <path
       style="stroke-width:1.946;stroke-linejoin:round;paint-order:markers stroke fill"
       d="M 97.677839,133.73448 C 116.12508,116.28671 117.30372,115.6899 133.95362,103.12679 114.53921,91.268184 114.65648,91.483807 97.658686,75.883676 Z"
       id="path1-8" />
    <path
       style="fill:none;stroke-width:11.146;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
       d="M 27.545615,33.592307 78.66955,35.181621 81.392482,88.00598"
       id="path2" />
    <path
       style="fill:none;stroke-width:11.046;stroke-linejoin:round;stroke-dasharray:none;paint-order:markers stroke fill"
       d="M 105.31357,104.14232 55.586267,100.85257 53.733938,51.99587"
       id="path3" />
</svg>`)
})

export default class BentoScreenControls extends BentoElement {
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

		this.container.addEventListener("click", event => {
			let target = /** @type HTMLElement */ (event.target)
			let button = target.closest("button")
			if (button) {
				let name = /** @type ScreenControl */ (button.name)
				if (name in ScreenControl) {
					this.announce(name)
				}
			}
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

	/** @type {Layer["view"]} */
	get selectedLayer() {
		return this.get("selectedLayer")
	}

	set selectedLayer(val) {
		this.set("selectedLayer", val, () => {
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
					this.toggleAttribute(key, value)
				} else {
					this.setAttribute(key, value)
				}
			}
		})
	}

	enable() {
		this.container.textContent = ``
		let selectedScreen = this.selectedScreen || Screen.wav
		let selectedLayerType = this.selectedLayer?.type || LayerType.sampler
		if (
			selectedScreen == Screen.wav &&
			selectedLayerType == LayerType.sampler
		) {
			for (let screen of [ScreenControl.flip, ScreenControl.record]) {
				let spec = controls.get(screen)
				let button = document.createElement("button")
				button.name = spec.name
				button.ariaLabel = spec.label
				button.title = spec.label
				button.append(spec.icon)
				this.container.append(button)
			}
		}
	}
}

bentoElements.define("bento-screen-controls", BentoScreenControls)

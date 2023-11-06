import {BentoElement, bentoElements} from "./base.js"
import BentoControlButton from "./control-button.js"

/** @typedef {typeof ScreenControl[keyof typeof ScreenControl]} ScreenControl */
export const ScreenControl = /** @type const */ ({
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
	icon: q(`<svg viewBox="0 0 100"><circle cx="50" cy="50" r="50" /></svg>`)
})

export default class BentoScreenControls extends BentoElement {
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
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

	/** @param {ScreenControl[]} controls */
	choose(...controls) {
		this.shadow
			.querySelectorAll("bento-control-button")
			.forEach(n => n.remove())
		for (let control of controls) {
			this.add(control)
		}
	}
	/** @param {ScreenControl[]} val */
	set controls(val) {
		this.choose(...val)
	}
}

bentoElements.define("bento-screen-controls", BentoScreenControls)

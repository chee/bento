import {BentoElement} from "./base.js"
import * as loop from "../loop.js"
import BentoBox from "./box.js"

export default class BentoGrid extends BentoElement {
	/** @type {BentoBox[]} */
	boxes = []

	static defaultLayer = `
     ◼︎ ◻︎ ◻︎ ◻︎
     ◼︎ ◻︎ ◻︎ ◻︎
     ◼︎ ◻︎ ◼︎ ◻︎
     ◼︎ ◻︎ ◻︎ ◼︎
`
	parseLayer(layer = "") {
		return layer
			.trim()
			.split(/\n+/)
			.flatMap(line =>
				line
					.trim()
					.replace(/\s+/g, " ")
					.split(" ")
					.map(char => char.trim() == "◼︎")
			)
	}

	connectedCallback() {
		let initialLayer = this.parseLayer(
			this.getAttribute("initial-layer") || BentoGrid.defaultLayer
		)
		customElements.whenDefined("bento-box").then(() => {
			loop.steps(stepIdx => {
				let box = /** @type {BentoBox} */ (document.createElement("bento-box"))
				this.boxes.push(box)
				box.selected = stepIdx == 0
				box.playing = stepIdx == 0
				box.on = initialLayer[stepIdx]
				box.ariaLabel = `step ${stepIdx}`
				box.step = stepIdx
				BentoGrid.defaultLayer[stepIdx]
				this.appendChild(box)
			})
		})
	}
}

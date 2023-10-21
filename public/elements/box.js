import {BentoElement} from "./base.js"
import * as loop from "../loop.js"
import BentoCompartment from "./compartment.js"

export default class BentoBox extends BentoElement {
	/** @type {BentoCompartment[]} */
	compartments = []

	static defaultPattern = `
     ◼︎ ◻︎ ◻︎ ◻︎
     ◼︎ ◻︎ ◻︎ ◻︎
     ◼︎ ◻︎ ◼︎ ◻︎
     ◼︎ ◻︎ ◻︎ ◼︎
`
	parsePattern(pattern = "") {
		return pattern
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
		let initialPattern = this.parsePattern(
			this.getAttribute("initial-pattern") || BentoBox.defaultPattern
		)
		customElements.whenDefined("bento-compartment").then(() => {
			loop.steps(stepIdx => {
				let compartment = /** @type {BentoCompartment} */ (
					document.createElement("bento-compartment")
				)
				this.compartments.push(compartment)
				compartment.selected = stepIdx == 0
				compartment.playing = stepIdx == 0
				compartment.on = initialPattern[stepIdx]
				compartment.ariaLabel = `step ${stepIdx}`
				compartment.step = stepIdx
				BentoBox.defaultPattern[stepIdx]
				this.appendChild(compartment)
			})
		})
	}
}

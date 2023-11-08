import {BentoElement, BentoEvent, bentoElements} from "./base.js"
import * as loop from "../convenience/loop.js"
import BentoBox from "./box.js"
import Modmask from "../io/modmask.js"
import Step from "../memory/tree/step.js"

export default class BentoGrid extends BentoElement {
	/** @type {BentoBox[]} */
	boxes = []

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed", delegatesFocus: true})
		this.attachStylesheet("grid")
		this.on = true

		customElements.whenDefined("bento-box").then(() => {
			loop.gridSteps(stepIdx => {
				let box = document.createElement("bento-box")
				this.boxes.push(box)
				box.selected = stepIdx == 0
				box.playing = stepIdx == 0
				box.ariaLabel = `step ${stepIdx}`
				box.id = stepIdx.toString()
				this.shadow.appendChild(box)
			})
			this.boxes[0].autofocus = true
			this.boxes[0].focus()
		})

		this.shadow.addEventListener(
			"change",
			/** @param {BentoEvent} event */
			event => {
				let index = this.boxes.indexOf(/** @type {BentoBox}*/ (event.target))
				if (index != -1) {
					this.announce("change", {
						...event.detail,
						box: index
					})
				} else {
					this.announce("change", event.detail)
				}
			}
		)

		this.shadow.addEventListener(
			"keydown",
			/** @param {KeyboardEvent} event */
			event => {
				let mods = new Modmask(event)
				let index = this.boxes.indexOf(/** @type {BentoBox}*/ (event.target))
				let stepsPerRow = 4
				let inLeftColumn = !(index % stepsPerRow)
				let onTopRow = index < stepsPerRow
				let onBottomRow = index > this.boxes.length - stepsPerRow
				let inRightColumn = !((index + 1) % stepsPerRow)

				let directions = {
					left: inLeftColumn ? +3 : -1,
					right: inRightColumn ? -3 : +1,
					up: onTopRow ? this.boxes.length - stepsPerRow + 1 : -stepsPerRow,
					down: onBottomRow
						? -(this.boxes.length - stepsPerRow + 1)
						: stepsPerRow
				}

				if (mods.none) {
					let arrow = event.key.toLowerCase().match(/arrow(\w+)/)?.[1]
					if (arrow) {
						let nextIndex = index + directions[arrow]
						this.announce("change", {
							change: "selected",
							box: nextIndex
						})
						this.boxes[nextIndex].focus()
					}
				}
			}
		)

		this.addEventListener("keydown", this.#keydown)
	}

	set on(val) {
		this.set("on", val, () => {
			this.toggleAttribute("on", val)
		})
	}

	/** @type Boolean */
	get on() {
		return this.get("on")
	}

	/** @param {Step["view"][]} steps */
	set steps(steps) {
		for (let step of steps) {
			this.boxes[step.indexInGrid].step = step
		}
	}

	/** @type number */
	get selectedStepIndex() {
		return this.get("selectedStepIndex")
	}

	set selectedStepIndex(val) {
		this.set("selectedStepIndex", val, () => {
			for (let box of this.boxes) {
				box.selected = val == box.step.indexInGrid
			}
		})
	}

	/** @type number */
	get currentStepIndex() {
		return this.get("currentStepIndex")
	}

	set currentStepIndex(val) {
		this.set("currentStepIndex", val, () => {
			for (let box of this.boxes) {
				box.playing = box.step.indexInGrid == val
			}
		})
	}

	/** @param {KeyboardEvent} event */
	#keydown(event) {}
}

bentoElements.define("bento-grid", BentoGrid)

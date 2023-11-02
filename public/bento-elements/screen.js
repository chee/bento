import {BentoElement, BentoEvent} from "./base.js"
import BentoScreenSelector from "./screen-selector.js"
import * as dt from "../data-transfer.js"
/**
 * @typedef {Object} StyleMap
 * @prop {string} fill
 * @prop {string} line
 * @prop {string} [text]
 * @prop {string} [font]
 */

export default class BentoScreen extends BentoElement {
	static screens = {
		wav: "wav",
		mix: "mix"
	}
	canvas = document.createElement("canvas")
	screen = BentoScreen.screens.wav
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<figure></figure>`
		this.shadow.firstElementChild.appendChild(this.canvas)
		this.attachStylesheet("screen")
		this.setAttribute("screen", this.screen)
		customElements.whenDefined("bento-screen-selector").then(() => {
			let screens = Object.values(BentoScreen.screens)
			let screenSelector = document.createElement("bento-screen-selector")
			this.shadow.appendChild(screenSelector)
			screenSelector.setAttribute("screens", screens.join(" "))
			screenSelector.setAttribute("selected", this.screen)
		})
		this.shadow.addEventListener(
			"screen",
			/** @param {BentoEvent} event */
			event => {
				if (this.screen == event.detail.screen) {
					this.announce("change", {
						change: "reverse"
					})
				}
				this.announce("screen", {
					screen: event.detail.screen
				})

				this.screen = event.detail.screen
				this.setAttribute("screen", this.screen)
				if (event.target instanceof BentoScreenSelector) {
					event.target.setAttribute("selected", event.detail.screen)
				}
			}
		)
		this.shadow.addEventListener("open", () => {
			this.announce("open")
		})

		/* this runs once when drag enters the target's zone */
		this.addEventListener("dragenter", async event => {
			event.preventDefault()
			let {items} = event.dataTransfer

			// todo allow dragging a clip to the screen to trim the sound to the
			// length of its region
			// todo move this to dt.getAudio
			for (let item of Array.from(items)) {
				// TODO restrict to supported formats by trying to decode a silent
				// audio item of all the formats anyone supports?
				if (item.kind == "file") {
					if (item.type.startsWith("audio/")) {
						this.setAttribute("drop-target", "drop-target")
					} else {
						console.debug(`unsupported type: ${item.kind}, ${event.type}`)
					}
				}
			}
			if (await dt.isStep(event.dataTransfer)) {
				this.setAttribute("drop-target", "drop-target")
			}
			event.preventDefault()
		})

		/* this runs a billion times a second while a drag is being held on top of the
		target */
		this.addEventListener("dragover", async event => {
			event.preventDefault()

			let {items} = event.dataTransfer

			// todo allow dragging a clip to the screen to trim the sound to the length
			// of its region
			// todo move this to dt.getAudio
			for (let item of Array.from(items)) {
				// TODO restrict to supported formats by trying to decode a silent audio
				// item of all the formats anyone supports?
				if (item.kind == "file") {
					if (item.type.startsWith("audio/")) {
						this.setAttribute("drop-target", "")
					} else {
						console.debug(`unsupported type: ${item.kind}, ${event.type}`)
					}
				}
			}
			if (await dt.isStep(event.dataTransfer)) {
				this.setAttribute("drop-target", "drop-target")
			}
		})

		/* this runs once when drag exits the target's zone */
		this.addEventListener("dragleave", event => {
			event.preventDefault()
			this.removeAttribute("drop-target")
		})

		/* i don't know when this runs. seems never */
		this.addEventListener("dragend", () => {})

		this.addEventListener("drop", async event => {
			event.preventDefault()

			this.removeAttribute("drop-target")
			// todo move this to dt.getAudio, also maybe have a getItems("step",
			// "audio") or somethingn
			if (event.dataTransfer.items) {
				for (let item of Array.from(event.dataTransfer.items)) {
					if (item.kind == "file") {
						let file = item.getAsFile()
						this.announce("change", {
							change: "sound",
							file
						})
					}
				}
			}
			let step = await dt.getStep(event.dataTransfer)
			if (step != null) {
				this.announce("commit-sound", {
					step
				})
			}
		})
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	/**
	 * @typedef {Record<string, StyleMap>} StyleMaps
	 * @returns {StyleMaps}
	 */
	getStyles() {
		let fill = this.getStyle("screen-fill")
		let line = this.getStyle("screen-line")
		let boxWavLine = this.getStyle("box-wav-line")
		let boxOffLine = this.getStyle("box-off-line")
		let fontFamily = this.getStyle("font-family")
		let regionFill = this.getStyle("region-fill")
		let drawingRegionFill = this.getStyle("drawing-region-fill")
		let regionLine = this.getStyle("region-line")
		let drawingRegionLine = this.getStyle("drawing-region-line")
		let fontSize = 69
		let font = `${fontSize}px ${fontFamily}`

		return {
			normal: {
				fill,
				line,
				text: line,
				font
			},
			boxOn: {
				fill: "transparent",
				line: boxWavLine
			},
			boxOff: {
				fill: "transparent",
				line: boxOffLine
			},
			region: {
				fill: regionFill,
				line: regionLine
			},
			drawingRegion: {
				fill: drawingRegionFill,
				line: drawingRegionLine
			}
		}
	}

	get open() {
		return this.hasAttribute("open")
	}

	set open(val) {
		this.toggleAttribute("open", val)
	}

	get empx() {
		let box = document.createElement("div")
		box.style.width = "1em"
		box.style.visibility = "hidden"
		this.shadow.appendChild(box)
		let empx = box.clientWidth
		this.shadow.removeChild(box)
		return empx
	}

	get width() {
		return this.shadow.querySelector("figure").clientWidth
	}

	get height() {
		return this.empx * 4
	}
}

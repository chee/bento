import {BentoElement, BentoEvent} from "./base.js"

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
		customElements.whenDefined("bento-screen-selector").then(() => {
			let screens = Object.values(BentoScreen.screens)
			let screenSelector = document.createElement("bento-screen-selector")
			this.shadow.appendChild(screenSelector)
			screenSelector.setAttribute("screens", screens.join(" "))
		})
		this.shadow.addEventListener(
			"screen",
			/** @param {BentoEvent} event */
			event => {
				this.screen = event.detail.screen
			}
		)
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
		let boxOnLine = this.getStyle("box-on-line")
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
				line: boxOnLine
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
}

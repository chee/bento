import {BentoElement} from "./base.js"

/**
 * @typedef {Object} StyleMap
 * @prop {string} fill
 * @prop {string} line
 * @prop {string} [text]
 * @prop {string} [font]
 */

export default class BentoTape extends BentoElement {
	static defaultMessage = "placing the cassette into the sanyo"
	/** @type {number} */
	interval
	connectedCallback() {
		let svg = document.querySelector("svg#tape")
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<p id="message">${BentoTape.defaultMessage}</p>
			<figure>${svg.outerHTML}</figure>
			<p id="counter">•</p>
		`
		this.attachStylesheet("tape")
		document.body.removeChild(svg)
	}

	get recording() {
		return !!document.querySelector("bento-party[recording]")
	}

	/** @param {number} ms*/
	set length(ms) {
		let seconds = ms / 1000
		this.shadow.getElementById("message").textContent = this.recording
			? `recording ${seconds | 0} seconds of sound`
			: BentoTape.defaultMessage
		let counter = this.shadow.getElementById("counter")
		if (this.recording) {
			counter.innerHTML = "<span>•</span>".repeat(seconds)
			this.interval = setInterval(function () {
				counter.removeChild(counter.lastElementChild)
			}, 1000)
		} else {
			clearInterval(this.interval)
		}
	}
}

import {BentoElement, bentoElements} from "./base.js"
import icons from "../icons.js"

export default class BentoTape extends BentoElement {
	static defaultMessage = "placing the cassette into the sanyo"
	/** @type {number} */
	interval = 0
	connectedCallback() {
		let svg = icons.get("tape")
		document.body.removeChild(svg)
		svg.style.display = "block"
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<p id="message">${BentoTape.defaultMessage}</p>
			<figure>${svg.outerHTML}</figure>
			<p id="counter">•</p>
		`
		this.attachStylesheet("tape")
	}

	set recording(val) {
		this.set("recording", val, () => {})
	}

	/** @type boolean */
	get recording() {
		return this.get("recording")
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
				if (counter.lastElementChild) {
					counter.removeChild(counter.lastElementChild)
				}
			}, 1000)
		} else {
			clearInterval(this.interval)
		}
	}
}

bentoElements.define("bento-tape", BentoTape)

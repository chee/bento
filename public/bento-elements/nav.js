import {BentoElement} from "./base.js"

/** @typedef {Object} ControlSpec
 * @param {string} name
 * @param {string} type
 * @param {string} icon
 * @param {string} label
 */
export default class BentoNav extends BentoElement {
	static icons = {
		arrow: `<svg viewbox="-5 -5 522 522" xmlns="http://www.w3.org/2000/svg">
			<polygon
				points="256,96
					268,192 32,196
					32,192 40,256
					28,320 268,320
					248,416 496,256"
			/>
		</svg>`
	}
	#negativeHistory = 0
	#futureHistory = 0
	#slug = document.createElement("h1")
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.append(this.#slug)
		this.#slug.innerHTML = "&nbsp;"
		this.attachStylesheet("nav")
	}

	back() {
		if (this.#negativeHistory) {
			history.back()
		}
		this.toggleAttribute("negative-history", !!this.#negativeHistory)
	}

	forward() {
		if (this.#futureHistory) {
			history.forward()
		}
		this.toggleAttribute("future-history", !!this.#futureHistory)
	}

	/** @type {string} */
	get slug() {
		return (this.#slug.textContent || "bento").replaceAll("-", " ")
	}

	set slug(slug) {
		this.#slug.textContent = (slug || "bento").replaceAll("-", " ")
	}
}

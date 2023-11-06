import {BentoElement, bentoElements} from "./base.js"

export default class BentoNav extends BentoElement {
	#slug = document.createElement("h1")
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.append(this.#slug)
		this.#slug.innerHTML = "&nbsp;"
		this.attachStylesheet("nav")
	}

	/** @type {string} */
	get slug() {
		return this.#slug.textContent || "bento"
	}

	set slug(slug) {
		let pretty = (slug || "bento").replaceAll("-", " ")
		this.set("slug", pretty, () => {
			this.#slug.textContent = slug
		})
	}
}

bentoElements.define("bento-nav", BentoNav)

// static icons = {
// 	arrow: `<svg viewbox="-5 -5 522 522" xmlns="http://www.w3.org/2000/svg">
// 		<polygon
// 			points="256,96
// 				268,192 32,196
// 				32,192 40,256
// 				28,320 268,320
// 				248,416 496,256"
// 		/>
// 	</svg>`
// }

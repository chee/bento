import {bentoElements, BentoElement} from "./base.js"

/**
 * @typedef {Object} ControlSpec
 * @prop {SVGElement|HTMLElement|string|(SVGElement|HTMLElement|string)[]} content
 * @prop {string} name
 * @prop {string} label
 * @prop {boolean} [showName]
 */
export default class BentoControlButton extends BentoElement {
	/** @type {HTMLButtonElement} */
	button = document.createElement("button")

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.appendChild(this.button)
		this.attachStylesheet("control-button")
		this.button.addEventListener("click", event => {
			this.announce(this.name)
		})
	}

	/** @type {boolean} */
	get on() {
		return this.get("on")
	}

	set on(on) {
		this.set("on", on, () => {
			this.button.ariaChecked = on.toString()
		})
	}

	/** @type {ControlSpec} */
	get spec() {
		return this.get("spec")
	}

	set spec(spec) {
		this.set("spec", spec, () => {
			this.name = spec.name
			this.label = spec.label
			this.content = spec.content
		})
	}

	/** @type string */
	get name() {
		return this.get("name")
	}

	set name(val) {
		this.set("name", val, () => {
			this.button.name = val
		})
	}

	/** @type string */
	get label() {
		return this.get("label")
	}

	set label(val) {
		this.set("label", val, () => {
			this.button.ariaLabel = val
			this.button.title = val
		})
	}

	/** @type {ControlSpec["content"]} */
	get content() {
		return this.get("content")
	}

	set content(val) {
		this.set("content", val, () => {
			this.button.textContent = ""
			let elements = createContent(val)
			for (let element of elements) {
				this.button.appendChild(element)
			}
		})
	}
}

/** @param {ControlSpec["content"]} content */
function createContent(content, className = "only") {
	if (Array.isArray(content)) {
		let [top, bottom] = content
		let topElement = createContent(top, "top")
		let bottomElement = createContent(bottom, "bottom")
		return topElement.concat(bottomElement)
	}
	if (typeof content == "string") {
		let span = document.createElement("span")
		span.textContent = content
		span.classList.add(className)
		return [span]
	}
	content.classList.add(className)
	return [content]
}

bentoElements.define("bento-control-button", BentoControlButton)

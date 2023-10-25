export class BentoEvent extends CustomEvent {
	/**
	 * @param {string} name
	 * @param {any} [detail]
	 * @param {EventInit} [options]
	 */
	constructor(name, detail, options) {
		super(name, {...options, detail})
	}

	get message() {
		return this.detail
	}
}

export class BentoElement extends HTMLElement {
	#stylesheet = document.createElement("link")
	/** @type {ShadowRoot} [shadow] */
	shadow
	/** @param {string} name */
	attachStylesheet(name) {
		this.#stylesheet.rel = "stylesheet"
		this.#stylesheet.href = `/bento-elements/${name}.css`
		if (this.shadow != null) {
			this.shadow.appendChild(this.#stylesheet)
		}
	}

	/**
	 * @param {string} name
	 * @param {any} [detail]
	 * @param {EventInit} [options]
	 */
	announce(name, detail, options = {bubbles: true}) {
		this.dispatchEvent(new BentoEvent(name, detail, options))
	}

	/**
	 * @param {string} name
	 * @param {boolean} state
	 */
	toggleAttribute(name, state) {
		if (state) {
			this.setAttribute(name, name)
		} else {
			this.removeAttribute(name)
		}
		return state
	}
}

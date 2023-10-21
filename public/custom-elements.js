import * as loop from "./loop.js"
// the components don't touch memory, they are outputs
// they may however know how to serialize themselves?
//
// the event handlers can never set this.something, they must announce an
// event. the setting is done in the main event loop when memory changes.
// ui state is strictly a representation of memory, and user interactions are
// events handled in ui.js

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
	/**
	 * @param {string} name
	 * @param {any} [detail]
	 * @param {EventInit} [options]
	 */
	announce(name, detail, options = {bubbles: true}) {
		this.dispatchEvent(new BentoEvent(name, detail, options))
	}
}

export class BentoBox extends BentoElement {
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

class Modmask {
	static bitshift = {
		shift: 1,
		control: 2,
		alt: 3,
		meta: 4
	}
	static shift = 1 << this.bitshift.shift
	static control = 1 << this.bitshift.control
	static ctrl = 1 << this.bitshift.control
	static alt = 1 << this.bitshift.alt
	static meta = 1 << this.bitshift.meta

	/** @param {KeyboardEvent} event */
	constructor(event) {
		this.bits = 0
		this.bits |= +event.shiftKey << Modmask.bitshift.shift
		this.bits |= +event.ctrlKey << Modmask.bitshift.control
		this.bits |= +event.altKey << Modmask.bitshift.alt
		this.bits |= +event.metaKey << Modmask.bitshift.alt
	}

	get shift() {
		return Boolean(this.bits & Modmask.shift)
	}
	get control() {
		return Boolean(this.bits & Modmask.control)
	}
	get ctrl() {
		return Boolean(this.bits & Modmask.control)
	}
	get alt() {
		return Boolean(this.bits & Modmask.alt)
	}
	get meta() {
		return Boolean(this.bits & Modmask.meta)
	}
	get only() {
		let bits = this.bits
		return {
			get shift() {
				return Boolean(bits == Modmask.shift)
			},
			get control() {
				return Boolean(bits == Modmask.control)
			},
			get ctrl() {
				return Boolean(bits == Modmask.control)
			},
			get alt() {
				return Boolean(bits == Modmask.alt)
			},
			get meta() {
				return Boolean(bits == Modmask.meta)
			}
		}
	}
	get none() {
		return !this.bits
	}

	get symbol() {
		return String.fromCodePoint(parseInt("1fbaa", 16) + this.bits)
	}
}

// BentoShikiri fufufu
export class BentoCompartment extends BentoElement {
	#playing = false
	step = 0
	#quiet = 0
	#pan = 0
	wavimg = document.createElement("img")

	connectedCallback() {
		this.setAttribute("draggable", "true")

		this.tabIndex = 0

		this.addEventListener("click", this.#click)
		this.addEventListener("keyup", this.#keyup)
		this.wavimg.className = "wav"
		this.appendChild(this.wavimg)

		// this.addEventListener("drag", this.#drag)
		// this.addEventListener("dragenter", this.#dragenter)
		// this.addEventListener("dragover", this.#dragover)
		// this.addEventListener("dragleave", this.#dragleave)
		// this.addEventListener("dragend", this.#dragend)
		// this.addEventListener("drop", this.#drop)
	}

	attributeChangedCallback(name, _old, value) {
		if (BentoCompartment.observedAttributes[name]) {
			this[name] = value
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	#keyup(event) {
		let mods = new Modmask(event)
		if (event.code == "Space" && mods.none) {
			this.#click()
		}
	}

	#click() {
		let {step, selected, on} = this
		if (selected) {
			this.announce(on ? "off" : "on", {step})
		} else {
			this.announce("selected", {step: this.step})
		}
	}

	get on() {
		return this.ariaChecked == "true"
	}

	/**
	 * @param {boolean} val
	 */
	set on(val) {
		this.setAttribute("aria-checked", val.toString())
		this.ariaChecked = val.toString()
		this.toggleAttribute("on", val)
	}

	get selected() {
		return this.getAttribute("aria-selected") == "true"
	}

	/**
	 * @param {boolean} val
	 */
	set selected(val) {
		this.setAttribute("aria-selected", val.toString())
		this.ariaSelected = val.toString()
		this.toggleAttribute("selected", this.selected)
	}

	get playing() {
		return this.#playing
	}

	/**
	 * @param {boolean} val
	 */
	set playing(val) {
		this.#playing = val
		this.toggleAttribute("playing", this.#playing)
	}

	get quiet() {
		return this.#quiet
	}

	/**
	 * @param {number} val
	 */
	set quiet(val) {
		this.#quiet = val
		this.setAttribute("quiet", this.#quiet.toString())
	}

	get pan() {
		return this.#pan
	}

	/**
	 * @param {number} val
	 */
	set pan(val) {
		this.#pan = val
		this.setAttribute("pan", this.#pan.toString())
	}

	/**
	 * @param {string?} [val]
	 */
	set wav(val) {
		this.toggleAttribute("with-wav", val != null)
		this.wavimg.src = val
	}

	get wav() {
		return this.wavimg.src
	}
}

export function init() {
	customElements.define("bento-box", BentoBox)
	customElements.define("bento-compartment", BentoCompartment)
}

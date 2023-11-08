import {Screen} from "../graphics/constants.js"

// todo probably have another map just for change events haha

/** todo these should be per-element
 * @typedef {{
	change:
		| {change: "reverse"}
		| {change: "grid" | "speed" | "step" | "layer" | "bpm", value: number}
		| {change: "screen", value: Screen}
		| {change: "sound", value: File}
		| {change: "copy", from: number, box: number}
		| {change: "copy", from: number, minigrid: number}
		| {change: "on" | "selected" | "off" | "quieter" | "louder" | "pan-left" | "pan-right" | "reverse", box: number}
	press: string
	play: undefined
	pause: undefined
	stop: undefined
	record: undefined
	open: undefined
	theme: string
	toggle: {toggle: "grid", value: number}
	"commit-sound": {step: number}
	mouse: {
		type: "start" | "move" | "end",
		mouse: import("../memory/memory").MousePoint
	} | {
		type: "start" | "move" | "end",
		mouse: import("../memory/memory").MousePoint
		screen: Screen
	}
	screen: {screen: import("../graphics/constants").Screen} | undefined
}} BentoEvents
 */

/**
 * @template {keyof BentoEvents} Name
 * @template {BentoEvents[Name]} Detail
 * @template {Omit<EventInit, "detail">} Options
 */
export class BentoEvent extends CustomEvent {
	/**
	 * @param {Name} name
	 * @param {Detail} detail
	 * @param {Options} options
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
		this.#stylesheet.href = `/elements/${name}.css`
		if (this.shadow != null) {
			this.shadow.appendChild(this.#stylesheet)
		}
	}

	/**
	 * @template {keyof BentoEvents} Name
	 * @param {Name} name
	 * @param {(message: BentoEvents[Name], event: (BentoEvent<Name> & {target: BentoElement})) => void} fn
	 * @param {boolean | AddEventListenerOptions} [options]
	 */
	when(name, fn, options) {
		let el = this
		let cb = (/** @type BentoEvent & {target: BentoElement} */ event) => {
			fn.call(el, event.detail, event)
		}
		this.addEventListener(name, cb, options)
		return () => {
			this.removeEventListener(name, cb)
		}
	}

	/**
	 * @template {keyof BentoEvents} Name
	 * @param {Name} name
	 * @param {BentoEvents[Name]} [detail]
	 * @param {EventInit} [options]
	 */
	announce(
		name,
		detail,
		options = {bubbles: true, composed: true, cancelable: true}
	) {
		this.dispatchEvent(new BentoEvent(name, detail, options))
	}

	/**
	 * @param {string} name
	 * @param {boolean} state
	 */
	toggleAttribute(name, state) {
		if (state && !this.hasAttribute(name)) {
			this.setAttribute(name, name)
		} else if (!state && this.hasAttribute(name)) {
			this.removeAttribute(name)
		}
		return state
	}

	#props = new Map()

	/**
	 * @template {keyof this} P
	 * @param {P} prop
	 * @param {this[P]} val
	 * @param {() => void} cb
	 */
	set(prop, val, cb) {
		if (this.#props.has(prop) && this.#props.get(prop) == val) {
			return
		} else {
			this.#props.set(prop, val)
			cb()
		}
	}

	/**
	 * @template {keyof this} P
	 * @param {P} prop
	 * @returns {this[P]}
	 */
	get(prop) {
		return this.#props.get(prop)
	}
}

class BentoElements {
	/** @type Map<string, typeof BentoElement> */
	#elements = new Map()

	/**
	 * @template {typeof BentoElement} El
	 * Define an element to be registered with the registry
	 * @param {string} name html name of element
	 * @param {El} element bento element to register
	 * @returns {El}
	 */
	define(name, element) {
		this.#elements.set(name, element)
		return element
	}
	/**
	 * Register the defined elements with the customElements registry
	 */
	register() {
		for (let [name, element] of this.#elements) {
			// console.debug(`defining ${name} as ${element.name}`)
			customElements.define(name, element)
		}
	}
}

export const bentoElements = new BentoElements()

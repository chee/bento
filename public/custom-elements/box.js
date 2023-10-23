import {BentoElement} from "./base.js"
import Modmask from "../modmask.js"

// fufufu
export default class BentoBox extends BentoElement {
	// public api
	step = 0

	// private
	#playing = false
	#quiet = 0
	#pan = 0

	// children
	#wavimg = document.createElement("img")

	connectedCallback() {
		this.setAttribute("draggable", "true")

		this.tabIndex = 0

		this.addEventListener("click", this.#click)
		this.addEventListener("keyup", this.#keyup)
		this.#wavimg.className = "wav"
		this.appendChild(this.#wavimg)

		this.addEventListener("dragenter", this.#dragenter)
		this.addEventListener("dragover", this.#dragover)
		this.addEventListener("dragleave", this.#dragleave)

		this.addEventListener("drop", this.#drop)
		this.addEventListener("dragstart", this.#dragstart)

		// this.addEventListener("drag", this.#drag)
		// this.addEventListener("dragend", this.#dragend)
	}

	get #droptarget() {
		return this.hasAttribute("drop-target")
	}

	set #droptarget(val) {
		this.toggleAttribute("drop-target", val)
	}

	/** @param {DragEvent} event */
	#dragenter(event) {
		for (let file of Array.from(event.dataTransfer.files)) {
			// TODO restrict to supported formats by trying to decode a silent audio
			// file of all the formats anyone supports?
			if (file.type == "application/bento.step") {
				this.#droptarget = true
				event.preventDefault()
			}
		}
	}

	/** @param {DragEvent} event */
	#dragover(event) {
		event.preventDefault()
	}

	/** @param {DragEvent} event */
	#dragleave(event) {
		event.preventDefault()
		this.#droptarget = false
	}

	/** @param {DragEvent} event */
	#dragstart(event) {
		// TODO make this a special file format containing all the step info
		// (maybe a .wav with cue points + instrument info)
		event.dataTransfer.setData("application/bento.step", this.step.toString())
	}

	/** @param {DragEvent} event */
	#drop(event) {
		event.preventDefault()

		if (event.dataTransfer.items) {
			for (let item of Array.from(event.dataTransfer.items)) {
				if (item.type == "application/bento.step") {
					let from = Number(
						event.dataTransfer.getData("application/bento.step")
					)
					this.announce("copy", {
						from,
						to: this.step
					})
				}
			}
		}

		this.#droptarget = false
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
		this.#wavimg.src = val
	}

	get wav() {
		return this.#wavimg.src
	}
}

import {BentoElement} from "./base.js"
import Modmask from "../modmask.js"

// fufufu
export default class BentoBox extends BentoElement {
	#playing = false
	#quiet = 0
	#pan = 0

	connectedCallback() {
		this.tabIndex = 0
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<img id="wavimg">`
		this.attachStylesheet("box")
		this.setAttribute("draggable", "true")
		this.addEventListener("click", this.#click)
		this.addEventListener("keyup", this.#keyup)
		this.addEventListener("keydown", this.#keydown)
		this.addEventListener("dragenter", this.#dragenter)
		this.addEventListener("dragover", this.#dragover)
		this.addEventListener("dragleave", this.#dragleave)
		this.addEventListener("drop", this.#drop)
		this.addEventListener("dragstart", this.#dragstart)
	}

	/** @param {KeyboardEvent} event */
	#keydown(event) {
		// todo accept keymap as property
		let mods = new Modmask(event)
		// todo also have a thing that provides keyname and keyplace
		// actual key name (for mnemonics) vs locational
		// for people like kara and the french
		/*
		 * modifiers:
		 * control
		 * command - mod4/command
		 * meta  - control on linux and windows, super on mac
		 * unmeta - super on linux and windows, control on mac
		 * option - alt on linux/windows, option on mac
		 */
		// let keymap = {
		// 	"unmeta-arrowdown": "quieter",
		// 	"unmeta-arrowup": "quieter",
		// }
		if (mods.ctrl && event.key == "ArrowDown") {
			this.announce("change", {change: "quieter"})
		} else if (mods.ctrl && event.key == "ArrowUp") {
			this.announce("change", {change: "louder"})
		} else if (mods.ctrl && event.key == "ArrowLeft") {
			this.announce("change", {change: "pan-left"})
		} else if (mods.ctrl && event.key == "ArrowRight") {
			this.announce("change", {change: "pan-right"})
		} else if (mods.none && event.key == "r") {
			this.announce("change", {change: "reverse"})
		}
	}

	get #droptarget() {
		return this.hasAttribute("drop-target")
	}

	set #droptarget(val) {
		this.toggleAttribute("drop-target", val)
	}

	/** @param {DragEvent} event */
	#dragenter(event) {
		event.preventDefault()
		for (let item of Array.from(event.dataTransfer.items)) {
			// TODO restrict to supported formats by trying to decode a silent audio
			// file of the format?
			if (item.type == "application/bento.step") {
				this.#droptarget = true
			}
		}
	}

	/** @param {DragEvent} event */
	#dragover(event) {
		event.preventDefault()

		for (let file of Array.from(event.dataTransfer.files)) {
			// TODO restrict to supported formats by trying to decode a silent audio
			// file of the format?
			if (file.type == "application/bento.step") {
				this.#droptarget = true
			}
		}
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
		event.dataTransfer.setData("application/bento.step", this.id)
	}

	/** @param {DragEvent} event */
	#drop(event) {
		event.preventDefault()
		if (event.dataTransfer.items) {
			for (let item of Array.from(event.dataTransfer.items)) {
				if (item.type == "application/bento.step") {
					this.announce("change", {
						change: "copy",
						from: event.dataTransfer.getData("application/bento.step")
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
		let {selected, on} = this
		if (selected) {
			this.announce("change", {change: on ? "off" : "on"})
		} else {
			this.announce("change", {change: "selected"})
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

	/** @returns {HTMLImageElement} */
	get #wavimg() {
		return /** @type {HTMLImageElement} */ (
			this.shadow.getElementById("wavimg")
		)
	}
}

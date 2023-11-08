import {bentoElements, BentoElement} from "./base.js"
import Modmask from "../io/modmask.js"
import * as dt from "../io/data-transfer.js"
import Step from "../memory/tree/step.js"

let squircle = `
	<svg id="squircle" viewBox="-64 -64 608 608" xmlns="http://www.w3.org/2000/svg">
		<path d="M 0 256C 0 10, 10 0, 256 0S 512 10, 512 256, 502 512 256 512, 0 502, 0 256"/>
	</svg>`

// fufufu
export default class BentoBox extends BentoElement {
	connectedCallback() {
		this.tabIndex = 0
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `${squircle}<img id="wavimg">`
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
			this.announce("step-softly", this.step)
		} else if (mods.ctrl && event.key == "ArrowUp") {
			this.announce("step-loudly", this.step)
		} else if (mods.ctrl && event.key == "ArrowLeft") {
			this.announce("pan-step-left", this.step)
		} else if (mods.ctrl && event.key == "ArrowRight") {
			this.announce("pan-step-right", this.right)
		} else if (mods.none && event.key == "r") {
			this.announce("flip-step", this.step)
		}
	}

	get #droptarget() {
		return this.hasAttribute("drop-target")
	}

	set #droptarget(val) {
		this.toggleAttribute("drop-target", val)
	}

	/** @param {DragEvent} event */
	async #dragenter(event) {
		event.preventDefault()
		if (await dt.isStep(event.dataTransfer)) {
			this.#droptarget = true
		}
	}

	/** @param {DragEvent} event */
	async #dragover(event) {
		event.preventDefault()
		if (await dt.isStep(event.dataTransfer)) {
			this.#droptarget = true
		}
	}

	/** @param {DragEvent} event */
	#dragleave(event) {
		event.preventDefault()
		this.#droptarget = false
	}

	/** @param {DragEvent} event */
	#dragstart(event) {
		dt.setStep(event.dataTransfer, +this.id)
	}

	/** @param {DragEvent} event */
	async #drop(event) {
		event.preventDefault()
		let step = await dt.getStep(event.dataTransfer)
		this.announce("copy-step", {
			from: step,
			to: this.step
		})
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
			this.announce("toggle-step", this.step.index)
		} else {
			this.announce("select-step", this.step.indexInGrid)
		}
	}

	/** @type boolean */
	get on() {
		return this.get("on")
	}

	/** @type boolean */
	get selected() {
		return this.get("selected")
	}

	set selected(val) {
		this.set("selected", val, () => {
			this.toggleAttribute("selected", val)
			this.ariaSelected = val.toString()
		})
	}

	/** @type boolean */
	get playing() {
		return this.get("playing")
	}

	set playing(val) {
		this.set("playing", val, () => {
			this.toggleAttribute("playing", val)
		})
	}

	/** @type number */
	get quiet() {
		return +this.getAttribute("quiet")
	}

	/** @type number */
	get pan() {
		return this.get("pan")
	}

	/**
	 * @param {string?} [val]
	 */
	set wav(val) {
		this.set("wav", val, () => {
			this.toggleAttribute("with-wav", val != null)
			this.#wavimg.src = val
		})
	}

	get wav() {
		return this.get("wav")
	}

	/** @returns {HTMLImageElement} */
	get #wavimg() {
		return /** @type {HTMLImageElement} */ (
			this.shadow.getElementById("wavimg")
		)
	}

	/** @param {Step["view"]} step */
	set step(step) {
		this.set("step", step, () => {})

		this.set("quiet", step.quiet, () => {
			this.setAttribute("quiet", step.quiet.toString())
		})

		this.set("pan", step.pan, () => {
			this.setAttribute("pan", step.pan.toString())
		})

		this.set("on", step.on, () => {
			this.setAttribute("aria-checked", step.on.toString())
			this.ariaChecked = step.on.toString()
			this.toggleAttribute("on", step.on)
		})
	}

	get step() {
		return this.get("step")
	}
}
bentoElements.define("bento-box", BentoBox)

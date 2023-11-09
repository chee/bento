import {bentoElements, BentoElement} from "./base.js"
import BentoScreenSelector from "./screen-selector.js"
import * as dt from "../io/data-transfer.js"
import {LayerType, NUMBER_OF_KEYS} from "../memory/memory.js"
import {DPI, Screen} from "../graphics/constants.js"
import BentoScreenControls from "./screen-controls.js"
import Layer from "../memory/tree/layer.js"
import Step from "../memory/tree/step.js"

/**
 * @typedef {Object} StyleMap
 * @prop {string} fill
 * @prop {string} line
 * @prop {string} [text]
 * @prop {string} [font]
 */

/**
 * @typedef {import("./base").BentoEvents["mouse"]} BentoMouseDetail
 */

export default class BentoScreen extends BentoElement {
	/** @type {BentoScreenSelector} */
	selector
	/** @type {BentoScreenControls} */
	controls

	canvas = document.createElement("canvas")

	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<figure></figure>`
		this.shadow.firstElementChild.appendChild(this.canvas)
		this.attachStylesheet("screen")

		this.set("selectedScreen", "wav", () => {})

		customElements.whenDefined("bento-screen-controls").then(() => {
			this.controls = document.createElement("bento-screen-controls")
			this.shadow.insertBefore(this.controls, this.shadow.firstElementChild)
			this.controls.selectedScreen = this.selectedScreen
		})

		customElements.whenDefined("bento-screen-selector").then(() => {
			this.selector = document.createElement("bento-screen-selector")
			this.shadow.appendChild(this.selector)
		})

		/* this runs once when drag enters the target's zone */
		this.addEventListener("dragenter", async event => {
			event.preventDefault()
			let {items} = event.dataTransfer

			// todo move this to dt.getAudio
			for (let item of Array.from(items)) {
				// TODO restrict to supported formats by trying to decode a silent
				// audio item of all the formats anyone supports?
				if (item.kind == "file") {
					if (item.type.startsWith("audio/")) {
						this.setAttribute("drop-target", "drop-target")
					} else {
						console.debug(`unsupported type: ${item.kind}, ${event.type}`)
					}
				}
			}
			if (await dt.isStep(event.dataTransfer)) {
				this.setAttribute("drop-target", "drop-target")
			}
			event.preventDefault()
		})

		// todo move these to #handlers
		/* this runs a billion times a second while a drag is being held on top of the
		target */
		this.addEventListener("dragover", async event => {
			event.preventDefault()

			let {items} = event.dataTransfer

			// todo move this to dt.getAudio
			for (let item of Array.from(items)) {
				// TODO restrict to supported formats by trying to decode a silent audio
				// item of all the formats anyone supports?
				if (item.kind == "file") {
					if (item.type.startsWith("audio/")) {
						this.setAttribute("drop-target", "")
					} else {
						console.debug(`unsupported type: ${item.kind}, ${event.type}`)
					}
				}
			}
			if (await dt.isStep(event.dataTransfer)) {
				this.setAttribute("drop-target", "drop-target")
			}
		})

		/* this runs once when drag exits the target's zone */
		this.addEventListener("dragleave", event => {
			event.preventDefault()
			this.removeAttribute("drop-target")
		})

		/* i don't know when this runs. seems never */
		this.addEventListener("dragend", () => {})

		this.addEventListener("drop", async event => {
			event.preventDefault()

			this.removeAttribute("drop-target")
			// todo move this to dt.getAudio, also maybe have a getItems("step",
			// "audio") or somethingn
			if (event.dataTransfer.items) {
				for (let item of Array.from(event.dataTransfer.items)) {
					if (item.kind == "file") {
						let file = item.getAsFile()
						this.announce("set-sound", {
							audio: file
						})
					}
				}
			}
			let step = await dt.getStep(event.dataTransfer)
			if (step != null) {
				this.announce("clip-sound", {
					from: step
				})
			}
		})
		if (IS_BASICALLY_A_PHONE) {
			this.addEventListener("touchstart", this.#touchstart)
		} else {
			this.addEventListener("mousedown", this.#mousedown)
		}
	}

	/** @param {MouseEvent} event */
	#mousedown(event) {
		// assumes nothing ever changes size while you're trying to trim a sample
		let bounds = this.canvas.getBoundingClientRect()
		let mouse = resolveMouseFromEvent(event, bounds)
		this.#mouse({type: "start", mouse})
		/** @param {MouseEvent} event */
		let mousemove = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.#mouse({type: "move", mouse})
		}
		window.addEventListener("mousemove", mousemove)

		/** @param {MouseEvent} event */
		let mouseend = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.#mouse({type: "end", mouse})
			window.removeEventListener("mousemove", mousemove)
		}

		window.addEventListener("mouseup", mouseend, {once: true})
	}

	// this is super naïve
	/** @param {TouchEvent} event */
	#touchstart(event) {
		// assumes nothing ever changes size while you're fingering
		let bounds = this.canvas.getBoundingClientRect()
		let finger = event.touches.item(0)
		let mouse = resolveMouseFromEvent(finger, bounds)
		this.#mouse({type: "start", mouse})

		/** @param {TouchEvent} event */
		let move = event => {
			let moved = findFinger(finger, event.changedTouches)

			if (moved) {
				let mouse = resolveMouseFromEvent(moved, bounds)
				this.#mouse({type: "move", mouse})
			}
		}
		window.addEventListener("touchmove", move)
		window.addEventListener(
			"touchend",
			/** @param {TouchEvent} event */
			event => {
				let lost = findFinger(finger, event.changedTouches)
				let missing = !findFinger(finger, event.targetTouches)
				if (lost && missing) {
					let mouse = resolveMouseFromEvent(lost, bounds)
					this.#mouse({type: "end", mouse})
					window.removeEventListener("touchmove", move)
				}
			},
			{once: true}
		)
	}

	/** @param {BentoMouseDetail} message */
	#mouse(message) {
		let {type, mouse} = message

		if (this.selectedScreen == "wav") {
			let suffix = type == "move" ? "x" : type
			let announcement = `drawing-region-${suffix}`
			this.announce(announcement, mouse.x)
		} else if (this.selectedScreen == "mix") {
			let pan = Math.round((mouse.x / this.canvas.width) * 12 - 6)
			let quiet = Math.round((mouse.y / this.canvas.height) * 12)
			this.announce("set-pan", pan)
			this.announce("set-quiet", quiet)
		} else if (this.selectedScreen == "key") {
			let width = this.canvas.width
			let x = mouse.x
			let pitch = Math.round((x / width) * NUMBER_OF_KEYS) - NUMBER_OF_KEYS / 2
			this.announce("set-pitch", pitch)
		}
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	/**
	 * @typedef {Record<string, StyleMap>} StyleMaps
	 * @returns {StyleMaps}
	 */
	getStyles() {
		let fill = this.getStyle("screen-fill")
		let line = this.getStyle("screen-line")
		let boxWavLine = this.getStyle("box-wav-line")
		let boxOffLine = this.getStyle("box-off-line")
		let fontFamily = this.getStyle("font-family")
		let regionFill = this.getStyle("region-fill")
		let drawingRegionFill = this.getStyle("drawing-region-fill")
		let regionLine = this.getStyle("region-line")
		let drawingRegionLine = this.getStyle("drawing-region-line")
		let fontSize = 69
		let font = `${fontSize}px ${fontFamily}`

		return {
			normal: {
				fill,
				line,
				text: line,
				font
			},
			boxOn: {
				fill: "transparent",
				line: boxWavLine
			},
			boxOff: {
				fill: "transparent",
				line: boxOffLine
			},
			region: {
				fill: regionFill,
				line: regionLine
			},
			drawingRegion: {
				fill: drawingRegionFill,
				line: drawingRegionLine
			}
		}
	}

	/** @type boolean */
	get open() {
		return this.get("open")
	}

	set open(val) {
		this.set("open", val, () => {
			this.toggleAttribute("open", val)
		})
	}

	get empx() {
		let box = document.createElement("div")
		box.style.width = "1em"
		box.style.visibility = "hidden"
		this.shadow.appendChild(box)
		let empx = box.clientWidth
		this.shadow.removeChild(box)
		return empx
	}

	get width() {
		return this.shadow.querySelector("figure").clientWidth
	}

	get height() {
		return this.empx * 4
	}

	/** @type {Layer["view"]} */
	get layer() {
		return this.get("layer")
	}

	set layer(val) {
		this.set("layer", val, () => {
			this.selector.selectedLayer = val
			this.controls.selectedLayer = val
		})
	}

	/** @type {Screen} */
	get selectedScreen() {
		return this.get("selectedScreen")
	}

	set selectedScreen(name) {
		this.set("selectedScreen", name, () => {
			this.selector.selectedScreen = name
			this.controls.selectedScreen = name
		})
	}

	/** @type {Step["view"]} */
	get selectedStep() {
		return this.get("selectedStep")
	}

	set selectedStep(step) {
		this.set("selectedStep", step, () => {
			this.controls.selectedStep = step
		})
	}
}

const IS_BASICALLY_A_PHONE =
	typeof window != "undefined" &&
	window.matchMedia("(pointer: coarse)").matches

/**
 * @param {import("../memory/memory.js").MousePoint} clientXY
 * @param {DOMRect} bounds
 * @returns {import("../memory/memory.js").MousePoint} corrected
 */
function resolveMouse(clientXY, bounds) {
	return {
		x:
			clientXY.x < bounds.left
				? 0
				: // the bounds are the effective size
				clientXY.x > bounds.right
				? bounds.width * DPI
				: // multiplied for the REAL canvas size
				  (clientXY.x - bounds.left) * DPI,
		y:
			clientXY.y < bounds.top
				? 0
				: clientXY.y > bounds.bottom
				? bounds.height * DPI
				: (clientXY.y - bounds.top) * DPI
	}
}

/**
 * @param {MouseEvent | Touch} event
 * @param {DOMRect} bounds
 */
function resolveMouseFromEvent(event, bounds) {
	return resolveMouse(
		{
			x: event.clientX,
			y: event.clientY
		},
		bounds
	)
}

/**
 * @param {Touch} finger
 * @param {TouchList} touches
 * @returns {Touch?}
 */
function findFinger(finger, touches) {
	return [].find.call(
		touches,
		/** @param {Touch} touch */
		touch => touch.identifier == finger.identifier
	)
}

bentoElements.define("bento-screen", BentoScreen)

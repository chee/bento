import {BentoElement} from "./base.js"

/** @typedef {Object} ControlSpec
 * @param {string} name
 * @param {string} type
 * @param {string} [icon]
 * @param {string} label
 */
export default class BentoMasterControls extends BentoElement {
	/** @param {ControlSpec} control */
	createButton(control) {
		let element = document.createElement("button")
		element.innerHTML = control.icon || control.name
		if (control.type == "button") {
			element.addEventListener("click", () => {
				this.announce(control.name)
			})
		}
		element.id = control.name
		element.ariaLabel = control.label
		return element
	}
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		this.attachStylesheet("settings")
		// let save = this.createButton({
		// 	name: "save",
		// 	type: "button",
		// 	label: "save the project"
		// })
		let reset = this.createButton({
			name: "reset",
			type: "button",
			label: "reset the project",
			icon: "start fresh"
		})
		this.shadow.firstElementChild.append(reset)
	}

	get open() {
		return this.hasAttribute("open")
	}

	set open(val) {
		this.toggleAttribute("open", val)
	}
}

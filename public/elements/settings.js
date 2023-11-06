import {bentoElements, BentoElement} from "./base.js"

/** @typedef {Object} ControlSpec
 * @prop {string} name
 * @prop {string} type
 * @prop {string} [label]
 * @prop {string} [ariaLabel]
 */
export default class BentoSettings extends BentoElement {
	/** @type {HTMLButtonElement[]} */
	#buttons = []
	/**
	 * @param {ControlSpec} control
	 * @param {Element} [appendTo]
	 */
	createButton(control, appendTo) {
		let button = document.createElement("button")
		if (control.type == "button") {
			button.addEventListener("click", () => {
				this.announce(control.name)
			})
		}
		button.id = control.name
		// stay frosty until we're open
		button.tabIndex = this.open ? 0 : -1
		let label = control.label || control.name
		let ariaLabel = control.ariaLabel || label
		button.innerHTML = label
		button.ariaLabel = ariaLabel
		this.shadow.firstElementChild.appendChild(button)
		this.#buttons.push(button)
		return button
	}
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `<div></div>`
		this.attachStylesheet("settings")

		this.createButton({
			name: "save-as",
			type: "button",
			label: "duplicate pattern"
		})
		this.createButton({
			name: "load-pattern",
			type: "button",
			label: "load pattern"
		})
		this.createButton({
			name: "new-pattern",
			type: "button",
			label: "new pattern"
		})
		this.createButton({
			name: "rename-pattern",
			type: "button",
			label: "rename pattern"
		})
		// this.createButton({
		// 	name: "choose-theme",
		// 	type: "button",
		// 	label: "choose theme"
		// })
		this.createButton(
			{
				name: "reset",
				type: "button",
				label: "reset pattern"
			},
			this.shadow.firstElementChild
		)
	}

	get open() {
		return this.hasAttribute("open")
	}

	set open(open) {
		this.toggleAttribute("open", open)
		for (let button of this.#buttons) {
			button.tabIndex = open ? 0 : -1
		}
	}
}

bentoElements.define("bento-settings", BentoSettings)

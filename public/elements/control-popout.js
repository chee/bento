import {bentoElements, BentoElement} from "./base.js"

/**
 * @typedef {import("./control-button.js").ControlSpec} ControlSpec
 */

/**
 * @typedef {HTMLElement|string} ContentType
 */

/**
 * @template {boolean|number|string} Value
 * @typedef {Object} PopoutChoiceSpec
 * @prop {string} label
 * @prop {string} [title]
 * @prop {string} description
 * @prop {Value} value
 */

/**
 * @template {boolean|number|string} Value
 * @typedef {Object} PopoutControlSpec<Value>
 * @prop {PopoutChoiceSpec<Value>[]} choices
 * @prop {string} name
 * @prop {string} label
 * @prop {Value} value
 */

/***/
export default class BentoControlPopout extends BentoElement {
	button = document.createElement("bento-control-button")
	popout = document.createElement("div")
	#windowListener = () => {
		this.open = false
	}
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.appendChild(this.button)
		this.ariaHasPopup = "menu"
		this.attachStylesheet("control-popout")
		this.popout.id = "popout"
		this.shadow.appendChild(this.popout)
		this.open = false
		this.button.addEventListener("click", event => {
			this.open = !this.open
			event.stopImmediatePropagation()
		})
	}

	/** @type boolean */
	get open() {
		return this.get("open")
	}

	set open(open) {
		this.set("open", open, () => {
			this.toggleAttribute("open", open)
			let current = this.choices.find(c => c.value == this.value)
			// todo clearly written by a sleepy rabbit :: fix
			let currentChoice = Array.from(
				this.shadow.querySelectorAll("bento-control-button")
			).find(b => {
				return b.getAttribute("name") == current?.description
			})

			if (currentChoice) {
				currentChoice.button.focus()
			}

			if (open) {
				window.addEventListener("click", this.#windowListener)
			} else {
				window.removeEventListener("click", this.#windowListener)
			}
		})
	}

	/**
	 * @template {boolean|number|string} Value
	 * @type {PopoutControlSpec<Value>}
	 */
	get spec() {
		return this.get("spec")
	}

	set spec(spec) {
		this.set("spec", spec, () => {
			let choice = spec.choices.find(c => c.value == spec.value)
			this.name = spec.name
			this.value = spec.value
			this.button.spec = {
				...spec,
				content: [choice.title || spec.name, choice.description]
			}
			this.choices = spec.choices
		})
	}

	/** @type {string} */
	get name() {
		return this.get("name")
	}

	set name(val) {
		this.set("name", val, () => {
			this.setAttribute("name", val)
		})
	}

	/** @type {PopoutControlSpec<any>["choices"]} */
	get choices() {
		return this.get("choices")
	}

	/** @type {any} */
	get value() {
		return this.get("value")
	}

	set value(val) {
		if (!this.choices) {
			return
		}
		this.set("value", val, () => {
			let choice = this.choices.find(c => c.value == val)
			this.button.content = [
				choice.title || this.button.name,
				choice.description
			]
		})
	}

	set choices(val) {
		this.set("choices", val, () => {
			this.popout.textContent = ""

			for (let choice of val) {
				let choiceButton = document.createElement("bento-control-button")

				choiceButton.spec = {
					...choice,
					name: choice.description,
					content: choice.title
						? [choice.title, choice.description]
						: choice.description
				}

				this.popout.append(choiceButton)
				choiceButton.addEventListener("click", event => {
					event.stopImmediatePropagation()
					this.open = false
					this.announce("choose", {
						name: this.button.name,
						choice: choice.value
					})
					this.button.button.focus()
				})
			}
		})
	}
}

bentoElements.define("bento-control-popout", BentoControlPopout)

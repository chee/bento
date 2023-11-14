import icons from "../../icons.js"
import {bentoElements, BentoElement} from "../base.js"

export default class BentoControlButton extends BentoElement {
	/** @type {HTMLButtonElement} */
	button = document.createElement("button")
	#announcer = event => {
		this.announce(this.name, this.value)
	}

	connectedCallback() {
		if (!this.shadow) {
			this.shadow = this.attachShadow({mode: "closed"})
			this.shadow.appendChild(this.button)
			this.attachStylesheet("controls/button")
		}
		this.button.addEventListener("click", this.#announcer)
	}

	disconnectedCallback() {
		this.button.removeEventListener("click", this.#announcer)
	}

	/** @type {boolean} */
	get on() {
		return this.get("on")
	}

	set on(on) {
		this.set("on", on, () => {
			this.button.ariaChecked = on.toString()
		})
	}

	/** @type string */
	get name() {
		return this.get("name")
	}

	set name(val) {
		this.set("name", val, () => {
			this.button.name = val
			this.setAttribute("name", val)
		})
	}

	/** @type string */
	get label() {
		return this.get("label")
	}

	set label(val) {
		this.set("label", val, () => {
			this.button.ariaLabel = val
			this.button.title = val
		})
	}

	/** @type {any} */
	get value() {
		return this.get("value")
	}
	set value(val) {
		this.set("value", val, () => {
			this.setAttribute("value", val)
		})
	}
}

bentoElements.define("bento-control-button", BentoControlButton)

export class BentoFlipButton extends BentoControlButton {
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "flip"
			this.label = "flip"
			this.addStylesheet("controls/flip")
			let title = document.createElement("div")
			title.append("flip")
			title.id = "title"
			this.button.append(title)
			this.button.append(icons.get("flip"))
		}
	}
}
bentoElements.define("bento-flip-button", BentoFlipButton)

export class BentoLoopButton extends BentoControlButton {
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "loop"
			this.label = "loop"
			this.addStylesheet("controls/loop")
			let title = document.createElement("div")
			title.append("loop")
			title.id = "title"
			this.button.append(title)
			this.button.append(icons.get("loop"))
		}
	}
}
bentoElements.define("bento-loop-button", BentoLoopButton)

export class BentoRecordButton extends BentoControlButton {
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "record"
			this.addStylesheet("controls/record")
			this.button.append(icons.get("record"))
			this.label = "Record new sound"
		}
	}
}
bentoElements.define("bento-record-button", BentoRecordButton)

export class BentoHearButton extends BentoControlButton {
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "hear"
			this.addStylesheet("controls/hear")
			let title = document.createElement("div")
			title.append("hear")
			title.id = "title"
			this.button.append(title)
			this.button.append("🔊")
		}
	}
}
bentoElements.define("bento-hear-button", BentoHearButton)

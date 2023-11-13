import {LayerType} from "../../memory/constants.js"
import {bentoElements, BentoElement} from "../base.js"
import BentoControlButton from "./button.js"

/***/
export default class BentoControlPopout extends BentoElement {
	button = document.createElement("bento-control-button")
	popout = document.createElement("div")
	#windowListener = () => {
		this.open = false
	}
	connectedCallback() {
		if (!this.shadow) {
			this.shadow = this.attachShadow({mode: "closed"})
			this.shadow.appendChild(this.button)
			this.ariaHasPopup = "menu"
			this.attachStylesheet("controls/popout")
			this.popout.id = "popout"
			this.popout.role = "dialog"
			this.shadow.appendChild(this.popout)
			this.open = false
			this.button.addEventListener("click", event => {
				event.stopPropagation()
				this.open = !this.open
				this.announce("open")
			})
			this.popout.addEventListener("choose", value => {
				this.announce(this.name, value)
			})
		}
	}

	/** @type boolean */
	get open() {
		return this.get("open")
	}

	set open(open) {
		this.set("open", open, () => {
			this.toggleAttribute("open", open)
			if (open) {
				window.addEventListener("click", this.#windowListener)
			} else {
				window.removeEventListener("click", this.#windowListener)
			}
		})
	}

	/** @type {string} */
	get name() {
		return this.get("name")
	}

	set name(val) {
		this.set("name", val, () => {
			this.button.name = val
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

	/** @type {HTMLElement|SVGElement} */
	get description() {
		return this.get("description")
	}

	set description(val) {
		this.set("description", val, () => {
			this.button.description = val
		})
	}
}

bentoElements.define("bento-control-popout", BentoControlPopout)

export class BentoSpeedSelector extends BentoControlPopout {
	static speeds = [
		{
			value: 0.25,
			description: "×¼",
			label: "quarter speed"
		},
		{
			value: 0.5,
			description: "×½",
			label: "half speed"
		},
		{
			value: 1,
			description: "×1",
			label: "normal speed"
		},
		{
			value: 2,
			description: "×2",
			label: "double speed"
		},
		{
			value: 4,
			description: "×4",
			label: "quadruple speed"
		}
	]
	/** @type BentoControlButton[] */
	choiceElements = []

	top = document.createElement("div")
	bottom = document.createElement("div")
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "speed"
			this.addStylesheet("controls/popout-grid")
			this.addStylesheet("controls/speed-selector")
			this.label = "Select relative speed of this layer"
			this.top.id = "title"
			this.bottom.id = "bottom"
			this.top.append(this.name)
			this.button.button.append(this.top, this.bottom)
			for (let speed of BentoSpeedSelector.speeds) {
				let button = document.createElement("bento-control-button")
				button.name = "speed"
				// todo slots?
				button.button.append(speed.description)
				button.value = speed.value
				button.label = speed.label
				this.popout.append(button)
				this.choiceElements.push(button)
			}
			this.button.when(this.name, (_, event) => {
				event.stopImmediatePropagation()
			})
		}
	}

	/** @type {any} */
	get value() {
		return this.get("value")
	}

	set value(val) {
		super.value = val

		let choice = this.choiceElements.find(n => {
			return n.value === val
		})
		if (!choice) {
			console.warn("chose a speed that is not an option")
		}
		this.bottom.textContent =
			choice?.button.textContent || (choice?.value || this.value)?.toString()
	}
}
bentoElements.define("bento-speed-selector", BentoSpeedSelector)

export class BentoLoopSelector extends BentoControlPopout {
	static loops = [
		{
			value: 0,
			description: "no",
			label: "do not loop"
		},
		{
			value: 1,
			label: "repeat once"
		},
		{
			value: 2,
			label: "repeat twice"
		},
		{
			value: 3,
			label: "repeat thrice"
		},
		{
			value: 0xff,
			description: "yes",
			label: "repeat max"
		}
	]
	/** @type BentoControlButton[] */
	choiceElements = []

	top = document.createElement("div")
	bottom = document.createElement("div")
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "loop"
			this.addStylesheet("controls/popout-grid")
			this.addStylesheet("controls/loop-selector")
			this.label = "The number of repeats"
			this.top.id = "title"
			this.bottom.id = "bottom"
			this.top.append(this.name)
			this.button.button.append(this.top, this.bottom)
			for (let loop of BentoLoopSelector.loops) {
				let button = document.createElement("bento-control-button")
				button.name = "loop"
				button.button.append(loop.description || loop.value.toString())
				button.value = loop.value
				button.label = loop.label
				this.popout.append(button)
				this.choiceElements.push(button)
			}
			this.button.when(this.name, (_, event) => {
				event.stopImmediatePropagation()
			})
		}
	}

	/** @type {any} */
	get value() {
		return this.get("value")
	}

	set value(val) {
		super.value = val

		let choice = this.choiceElements.find(n => {
			return n.value === val
		})
		if (!choice) {
			console.warn("chose a speed that is not an option")
		}
		this.bottom.textContent =
			choice?.button.textContent || choice?.value || this.value
	}
}
bentoElements.define("bento-loop-selector", BentoLoopSelector)

export class BentoJumpSelector extends BentoControlPopout {
	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "jump"
		}
	}
}
bentoElements.define("bento-jump-selector", BentoJumpSelector)

export class BentoLayerTypeSelector extends BentoControlPopout {
	/** @type BentoControlButton[] */
	choiceElements = []

	connectedCallback() {
		super.connectedCallback()
		if (!this.name) {
			this.name = "kind"
			this.addStylesheet("controls/popout-grid")
			this.addStylesheet("controls/layer-type-selector")
			this.label = "The kind of this layer"
			this.button.button.style.fontSize = "9px"
			// this.top.append(this.name)
			for (let layerType of ["off", "sampler", "synth"]) {
				let button = document.createElement("bento-control-button")
				button.name = "layer-type"
				button.button.append(layerType)
				button.button.style.fontSize = "10px"
				button.value = layerType
				button.label = layerType
				this.popout.append(button)
				this.choiceElements.push(button)
			}
			this.button.when(this.name, (_, event) => {
				event.stopImmediatePropagation()
			})
		}
	}

	/** @type {any} */
	get value() {
		return this.get("value")
	}

	set value(val) {
		super.value = val

		let choice = this.choiceElements.find(n => {
			return n.value === val
		})
		if (!choice) {
			console.warn("chose a speed that is not an option")
		}
		this.button.button.textContent =
			choice?.button.textContent || choice?.value || this.value
	}
}
bentoElements.define("bento-layer-type-selector", BentoLayerTypeSelector)

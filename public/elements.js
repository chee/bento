class PocketElement extends HTMLElement {
	connectedCallback() {
		let observed = this.constructor.observedAttributes
		if (observed) {
			for (let attribute of observed) {
				let val = this.getAttribute(attribute)

				if (val === "" || val == attribute || val === true) {
					this.values[attribute] = true
				} else if (val) {
					this.values[attribute] = val
				} else {
					this.values[attribute] = false
				}

				Object.defineProperty(this, attribute, {
					get() {
						return this.values[attribute]
					},
					set(val) {
						this.values[attribute] = val
						this.toggleAttribute(attribute, val)
					},
				})
			}
		}
	}
	log() {
		console.log(this.values)
	}
}

export class Control extends PocketElement {
	static observedAttributes = [
		"name",
		"value",
		"value-map",
		"value-type",
		"value-values",
		"control-type",
	]
	values = {}
}

export class Channel extends PocketElement {
	static observedAttributes = ["selected"]
	values = {}
	connectedCallback() {
		super.connectedCallback()
		this.addEventListener("click", () => {
			this.dispatchEvent(new CustomEvent("selected"))
		})
	}
}

export class Step extends PocketElement {
	static observedAttributes = ["on", "selected", "playing"]
	values = {}

	connectedCallback() {
		super.connectedCallback()
		this.addEventListener("click", () => {
			if (this.selected) {
				let event = this.on ? "off" : "on"
				this.dispatchEvent(new CustomEvent(event))
			} else {
				this.dispatchEvent(new CustomEvent("selected"))
			}
		})
	}
}

export function register() {
	customElements.define("po-control", Control)
	customElements.define("po-channel", Channel)
	customElements.define("po-step", Step)
}

import * as loop from "../convenience/loop.js"
import Layer from "../memory/tree/layer.js"
import {bentoElements, BentoElement} from "./base.js"
import BentoLayerSelectorChoice from "./layer-selector-choice.js"

export default class BentoLayerSelector extends BentoElement {
	/** @type {BentoLayerSelectorChoice[]} */
	selectors = []
	connectedCallback() {
		this.shadow = this.attachShadow({mode: "closed"})
		this.shadow.innerHTML = `
			<fieldset>
				<legend>selected layer</legend>
			</fieldset>`
		this.attachStylesheet("layer-selector")
		loop.layers(lidx => {
			let element = document.createElement("bento-layer-selector-choice")
			this.shadow.firstElementChild.append(element)
			this.selectors.push(element)
		})
	}

	/** @type {Layer["view"][]} */
	get layers() {
		return this.get("layers")
	}

	set layers(layers) {
		this.set("layers", layers, () => {
			for (let layer of layers) {
				this.selectors[layer.index].layer = layer
			}
		})
	}

	/** @type number */
	get selectedLayerIndex() {
		return this.get("selectedLayerIndex")
	}

	set selectedLayerIndex(val) {
		this.set("selectedLayerIndex", val, () => {
			this.selectors.forEach((selector, index) => {
				selector.selected = val == index
			})
		})
	}
}

bentoElements.define("bento-layer-selector", BentoLayerSelector)

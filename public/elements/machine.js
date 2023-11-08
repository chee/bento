import {bentoElements, BentoElement} from "./base.js"

export default class BentoMachine extends BentoElement {
	// todo make not find
	settings = this.querySelector("bento-settings")
	masterControls = this.querySelector("bento-master-controls")
	layerSelector = this.querySelector("bento-layer-selector")
	screen = this.querySelector("bento-screen")
	grid = this.querySelector("bento-grid")
}

bentoElements.define("bento-machine", BentoMachine)

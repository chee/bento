/* todo obviously */
export class BentoParty extends BentoElement {
	static observedAttributes = ["theme"]
	attributeChangedCallback(attr, _old, value) {
		if (attr == "theme") {
			this.announce("theme", value)
		}
	}
}

// the components don't touch memory, they are outputs
// they may however know how to serialize themselves?
//
// the event handlers can never set `this.something', they must announce an
// event. the setting is done in the main event loop when memory changes.  ui
// state is strictly a representation of memory, and user interactions are
// events handled by the machine (the machine connects memory to components)
import {BentoElement, BentoEvent} from "./base.js"
import BentoMasterControls from "./master-controls.js"
import BentoLayerSelector from "./layer-selector.js"
import BentoLayerOptions from "./layer-options.js"
import BentoScreen from "./screen.js"
import BentoScreenSelector from "./screen-selector.js"
import BentoGrid from "./grid.js"
import BentoBox from "./box.js"
import BentoTape from "./tape.js"

export {
	BentoGrid,
	BentoBox,
	BentoElement,
	BentoEvent,
	BentoMasterControls,
	BentoLayerSelector,
	BentoLayerOptions,
	BentoScreen,
	BentoScreenSelector,
	BentoTape
}

export function init() {
	// todo maybe if i defined the element name as, say,
	//    `static elementName = "bento-*"`
	// on the component, then i could iterate through instead of
	// naming them all here
	customElements.define("bento-grid", BentoGrid)
	customElements.define("bento-box", BentoBox)
	customElements.define("bento-party", BentoParty)
	customElements.define("bento-master-controls", BentoMasterControls)
	customElements.define("bento-layer-selector", BentoLayerSelector)
	customElements.define("bento-layer-options", BentoLayerOptions)
	customElements.define("bento-screen", BentoScreen)
	customElements.define("bento-screen-selector", BentoScreenSelector)
	customElements.define("bento-tape", BentoTape)
}

// the components don't touch memory, they are outputs
// they may however know how to serialize themselves?
//
// the event handlers can never set this.something, they must announce an
// event. the setting is done in the main event loop when memory changes.
// ui state is strictly a representation of memory, and user interactions are
// events handled in machine.js

import BentoGrid from "./grid.js"
import BentoBox from "./box.js"
import {BentoElement, BentoEvent} from "./base.js"

export {BentoGrid, BentoBox, BentoElement, BentoEvent}

export class BentoParty extends BentoElement {
	static observedAttributes = ["theme"]
	attributeChangedCallback(attr, _old, value) {
		if (attr == "theme") {
			this.announce("theme", value)
		}
	}
}

export function init() {
	customElements.define("bento-grid", BentoGrid)
	customElements.define("bento-box", BentoBox)
	customElements.define("bento-party", BentoParty)
}

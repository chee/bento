// the components don't touch memory, they are outputs
// they may however know how to serialize themselves?
//
// the event handlers can never set this.something, they must announce an
// event. the setting is done in the main event loop when memory changes.
// ui state is strictly a representation of memory, and user interactions are
// events handled in ui.js

import BentoBox from "./elements/box.js"
import BentoCompartment from "./elements/compartment.js"
import {BentoElement, BentoEvent} from "./elements/base.js"

export {BentoBox, BentoCompartment, BentoElement, BentoEvent}

export function init() {
	customElements.define("bento-box", BentoBox)
	customElements.define("bento-compartment", BentoCompartment)
}

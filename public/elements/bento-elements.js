// the components don't touch memory, they are outputs
// they may however know how to serialize themselves?
//
// the event handlers can never set `this.something', they must announce an
// event. the setting is done in the main event loop when memory changes.  ui
// state is strictly a representation of memory, and user interactions are
// events handled by the machine (the machine connects memory to components)
import {bentoElements} from "./base.js"

import "./party.js"
import "./machine.js"
import "./master-controls.js"
import "./settings.js"
import "./layer-selector.js"
import "./screen-controls.js"
import "./control-button.js"
import "./control-popout.js"
import "./screen.js"
import "./screen-selector.js"
import "./grid.js"
import "./box.js"
import "./grid-controls.js"
import "./grid-selector.js"
import "./minigrid.js"
import "./tape.js"
import "./nav.js"

export function init() {
	bentoElements.register()
}

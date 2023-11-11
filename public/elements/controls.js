import ButtonControl from "./control-button.js"
import PopoutControl from "./control-popout.js"

/**
 * @typedef {ButtonControl|PopoutControl} BentoControl
 */

/**
 * @typedef {import("./control-button.js").ButtonControlSpec} ButtonControlSpec
 */

/**
 * @typedef {import("./control-popout.js").PopoutControlSpec<any>} PopoutControlSpec
 */

/**
 * @param {ButtonControlSpec} spec
 */
export function button(spec) {
	let element = document.createElement("bento-control-button")
	element.spec = spec
	return element
}

/**
 * @param {PopoutControlSpec} spec
 */
export function popout(spec) {
	let element = document.createElement("bento-control-popout")
	element.spec = spec
	return element
}

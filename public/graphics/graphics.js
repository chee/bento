import {DPI} from "./constants.js"
import BentoScreen from "../elements/screen.js"

let partyElement = document.querySelector("bento-party")
partyElement.addEventListener("theme", event => theme(event.detail))
/** @type {BentoScreen} */
let screenElement

/** @type {Worker} */
let screenWorker

export let alreadyFancy = false

export function fancy() {
	return alreadyFancy
}

export function theme(/**@type string*/ name) {
	// todo load theme
	screenWorker.postMessage({
		type: "styles",
		theme: name,
		styles: screenElement.getStyles()
	})
}

let alreadyInit = false

export async function init() {
	if (alreadyInit) return
	alreadyInit = true
	screenWorker = new Worker("/graphics/graphics.worker.js", {type: "module"})
	await customElements.whenDefined("bento-screen")
	screenElement = document.querySelector("bento-screen")
	screenElement.canvas.height = screenElement.height * DPI
	screenElement.canvas.width = screenElement.width * DPI

	let offscreen = screenElement.canvas.transferControlToOffscreen()

	screenWorker.postMessage(
		{
			type: "init",
			canvas: offscreen,
			styles: screenElement.getStyles(),
			screen: screenElement.selectedScreen
		},
		[offscreen]
	)

	screenElement.when("select-screen", screen => {
		screenWorker.postMessage({
			type: "screen",
			screen
		})
	})

	screenElement.when("select-screen", screen => {
		screenWorker.postMessage({
			type: "screen",
			screen
		})
	})
}

/**
 * @param {SharedArrayBuffer} buffer
 */
export function start(buffer) {
	screenWorker.postMessage({type: "start", buffer})
	screenWorker.onmessage = onWorkerMessage
	alreadyFancy = true
}

/**
 * Handle messages from the waveform worker
 * @param {MessageEvent} event
 */

function onWorkerMessage(event) {
	let {type, ...message} = event.data
	if (type == "waveform") {
		document.dispatchEvent(
			new CustomEvent("waveform", {
				detail: message
			})
		)
	}
}

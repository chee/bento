// ==============================
// PLEASE DONT LOOK AT THIS FILE
// ==============================
// todo remove above when it's legal to look at this file
import * as Memory from "./memory.js"
import {DPI} from "./graphics.const.js"
import BentoScreen from "./bento-elements/screen.js"
import * as db from "./db.js"

let partyElement = document.querySelector("bento-party")
partyElement.addEventListener("theme", event => theme(event.detail))

/** @type {Memory.MemoryMap} */
let memory

/** @type {BentoScreen} */
let screenElement

/** @type {Worker} */
let screenWorker

function getMixFromMouse(mouse) {
	let pan = Math.round((mouse.x / screenElement.canvas.width) * 12 - 6)
	let quiet = Math.round((mouse.y / screenElement.canvas.height) * 12)
	return {pan, quiet}
}

function startMousing(event) {
	if (screenElement.screen == "wav") {
		startSelectingRegion(event)
	} else if (screenElement.screen == "mix") {
		startSelectingMix(event)
	}
}

function startFingering(event) {
	if (screenElement.screen == "wav") {
		startSelectingRegionWithFinger(event)
	} else if (screenElement.screen == "mix") {
		startSelectingMixWithFinger(event)
	}
}
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
	screenWorker = new Worker("/screen.work.js", {type: "module"})
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
			screen: screenElement.screen
		},
		[offscreen]
	)

	screenElement.addEventListener("screen", event => {
		screenWorker.postMessage({
			type: "screen",
			screen: event.detail.screen
		})
	})
}

/**
 * @param {SharedArrayBuffer} buffer
 */
export function start(buffer) {
	screenWorker.postMessage({type: "start", buffer})
	screenWorker.onmessage = onWorkerMessage
	memory = Memory.map(buffer)

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

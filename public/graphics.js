import * as Memory from "./memory.js"
import {DPI} from "./graphics.const.js"
import BentoScreen from "./bento-elements/screen.js"

let partyElement = document.querySelector("bento-party")
partyElement.addEventListener("theme", event => theme(event.detail))

export let IS_BASICALLY_A_PHONE =
	typeof window != "undefined" &&
	window.matchMedia("(pointer: coarse)").matches

/** @type {Memory.MemoryMap} */
let memory

/** @type {BentoScreen} */
let screenElement

/** @type {Worker} */
let screenWorker

/**
 * @param {number} pageX
 * @param {DOMRectReadOnly} bounds
 */
function getX(pageX, bounds) {
	// TODO
	// let bounds = canvas.getBoundingClientRect()

	return pageX < bounds.left
		? 0
		: pageX > bounds.right
		? screenElement.canvas.width
		: (pageX - bounds.left) * 3
}

// why is this in this file
// todo make this work for both TouchEvent and MouseEvent
// todo this should be part of <bento-screen>
/** @param {MouseEvent} event */
function startSelectingRegion(event) {
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	Memory.drawingRegionStart(memory, getX(event.pageX, bounds))
	/** @param {MouseEvent} event */
	function mousemove(event) {
		if (Memory.regionIsBeingDrawn(memory)) {
			Memory.drawingRegionX(memory, getX(event.pageX, bounds))
		}
	}
	window.addEventListener("mousemove", mousemove)

	/** @param {MouseEvent} event */
	function drawingRegionComplete(event) {
		Memory.drawingRegionEnd(memory, getX(event.pageX, bounds))
		window.removeEventListener("mousemove", mousemove)
	}

	window.addEventListener("mouseup", drawingRegionComplete, {once: true})
}

/**
 * @param {Touch} finger
 * @param {TouchList} touches
 * @returns {Touch?}
 */
function findFinger(finger, touches) {
	return [].find.call(
		touches,
		/** @param {Touch} touch */
		touch => touch.identifier == finger.identifier
	)
}

// todo this should be part of <bento-screen>
/** @param {TouchEvent} event */
function startSelectingRegionWithFinger(event) {
	// assumes nothing ever changes size while you're trying to drawingRegion a sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	let finger = event.touches.item(0)
	Memory.drawingRegionStart(memory, getX(finger.pageX, bounds))
	/** @param {TouchEvent} event */
	function move(event) {
		if (Memory.regionIsBeingDrawn(memory)) {
			/** @type {Touch} */
			let moved = findFinger(finger, event.changedTouches)
			if (moved) {
				Memory.drawingRegionX(memory, getX(moved.pageX, bounds))
			}
		}
	}
	window.addEventListener("touchmove", move)
	window.addEventListener(
		"touchend",
		/** @param {TouchEvent} event */
		function (event) {
			let lost = findFinger(finger, event.changedTouches)
			if (lost) {
				Memory.drawingRegionEnd(memory, getX(lost.pageX, bounds))
				window.removeEventListener("touchmove", move)
			}
		},
		{once: true}
	)
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
	// starring lindsey lohan
	let parentBounds = screenElement.getBoundingClientRect()

	screenElement.canvas.height = parentBounds.height * DPI
	screenElement.canvas.width = parentBounds.width * DPI

	let offscreen = screenElement.canvas.transferControlToOffscreen()
	screenWorker.postMessage(
		{
			type: "init",
			canvas: offscreen,
			styles: screenElement.getStyles()
		},
		[offscreen]
	)
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {SharedArrayBuffer} buffer
 */
export function start(canvas, buffer) {
	screenWorker.postMessage({type: "start", buffer})
	screenWorker.onmessage = onWorkerMessage
	memory = Memory.map(buffer)

	if (IS_BASICALLY_A_PHONE) {
		canvas.addEventListener("touchstart", startSelectingRegionWithFinger, {
			passive: true
		})
	} else {
		canvas.addEventListener("mousedown", startSelectingRegion, {
			passive: true
		})
	}

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

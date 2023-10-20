export const DPI = 3

// TODO add another tiny translucent canvas for the region
let IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN =
	typeof window != "undefined" && window.matchMedia("(pointer: coarse)").matches

import * as Memory from "./memory.js"
/** @type {Memory.MemoryMap} */
let memory

/** @type {HTMLCanvasElement} */
let canvas

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
		? canvas.width
		: (pageX - bounds.left) * 3
}

// why is this in this file
// TODO make this work for both TouchEvent and MouseEvent
/** @param {MouseEvent} event */
function startSelectingRegion(event) {
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = canvas.getBoundingClientRect()
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

/** @param {TouchEvent} event */
function startSelectingRegionWithFinger(event) {
	// assumes nothing ever changes size while you're trying to drawingRegion a sample
	let bounds = canvas.getBoundingClientRect()
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

let alreadyInit = false
/**
 * @param {HTMLCanvasElement} c
 */
export async function init(c) {
	if (alreadyInit) return
	alreadyInit = true
	screenWorker = new Worker("/screen.worker.js", {type: "module"})
	canvas = c
	// starring lindsey lohan
	let parentBox = canvas.parentElement.getBoundingClientRect()

	canvas.height = parentBox.height * DPI
	canvas.width = parentBox.width * DPI

	let offscreen = canvas.transferControlToOffscreen()
	screenWorker.postMessage({type: "init", canvas: offscreen}, [offscreen])
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {SharedArrayBuffer} buffer
 */
export function start(canvas, buffer) {
	screenWorker.postMessage({type: "start", buffer})
	screenWorker.onmessage = onWorkerMessage
	memory = Memory.map(buffer)

	if (
		IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN
	) {
		canvas.addEventListener("touchstart", startSelectingRegionWithFinger)
	} else {
		canvas.addEventListener("mousedown", startSelectingRegion)
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
				detail: message,
			})
		)
	}
}

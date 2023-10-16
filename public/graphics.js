// TODO add another tiny translucent canvas for the region
let IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN =
	typeof window != "undefined" && window.matchMedia("(pointer: coarse)").matches

import * as Memory from "./memory.js"
/** @type {Memory.MemoryMap} */
let memory

/** @type {HTMLCanvasElement} */
let canvas

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
function mouseTrim(event) {
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = canvas.getBoundingClientRect()
	Memory.trimStart(memory, getX(event.pageX, bounds))
	function mousemove(event) {
		if (Memory.trimming(memory)) {
			Memory.trimX(memory, getX(event.pageX, bounds))
		}
	}
	window.addEventListener("mousemove", mousemove)

	function trimComplete(event) {
		Memory.trimEnd(memory, getX(event.pageX, bounds))
		window.removeEventListener("mousemove", mousemove)
	}

	window.addEventListener("mouseup", trimComplete, {once: true})
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
function fingerTrim(event) {
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = canvas.getBoundingClientRect()
	let [finger] = event.touches
	Memory.trimStart(memory, getX(finger.pageX, bounds))
	function move(event) {
		if (Memory.trimming(memory)) {
			/** @type {Touch} */
			let moved = findFinger(finger, event.changedTouches)
			if (moved) {
				Memory.trimX(memory, moved.pageX)
			}
		}
	}
	window.addEventListener("touchmove", move)
	window.addEventListener(
		"touchend",
		function (event) {
			let lost = findFinger(finger, event.changedTouches)
			if (lost) {
				Memory.trimEnd(memory, getX(lost.pageX, bounds))
				window.removeEventListener("touchmove", move)
			}
		},
		{once: true}
	)
}

let worker = new Worker("./waveform.worker.js")

/**
 * @param {HTMLCanvasElement} c
 */
export async function init(c) {
	canvas = c
	// starring lindsey lohan
	let parentBox = canvas.parentElement.getBoundingClientRect()
	canvas.height = parentBox.height * 3
	canvas.width = parentBox.width * 3
	canvas.style.height = parentBox.height + "px"
	canvas.style.width = parentBox.width + "px"

	let offscreen = canvas.transferControlToOffscreen()
	let colorSpace = matchMedia("(color-gamut: p3)").matches
		? "display-p3"
		: "srgb"
	worker.postMessage({type: "init", canvas: offscreen, colorSpace}, [offscreen])
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {SharedArrayBuffer} buffer
 */
export function start(canvas, buffer) {
	worker.postMessage({type: "start", buffer})
	memory = Memory.map(buffer)

	if (
		IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN
	) {
		canvas.addEventListener("touchstart", fingerTrim)
	} else {
		canvas.addEventListener("mousedown", mouseTrim)
	}
}

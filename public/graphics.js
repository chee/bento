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
 * @param {import("./memory.js").MousePoint} clientXY
 * @returns {import("./memory.js").MousePoint} corrected
 */
function resolveMouse(
	clientXY,
	bounds = screenElement.canvas.getBoundingClientRect()
) {
	// todo is it bad to do ask for bounds constantly? if so, i'll make them
	// module-scoped and update when events fire. or use IntersectionObserver?
	// todo why do i not have to multiple clientXY.x when checking overbound?
	// todo neaten up
	return {
		x:
			clientXY.x < bounds.left
				? 0
				: clientXY.x > bounds.right
				? screenElement.canvas.width
				: (clientXY.x - bounds.left) * DPI,
		y:
			clientXY.y < bounds.top
				? 0
				: clientXY.y > bounds.bottom
				? screenElement.canvas.height
				: (clientXY.y - bounds.top) * DPI
	}
}

/**
 * @param {MouseEvent | Touch} event
 * @returns {import("./memory.js").MousePoint}
 */
function resolveMouseFromEvent(
	event,
	bounds = screenElement.canvas.getBoundingClientRect()
) {
	return resolveMouse(
		{
			x: event.clientX,
			y: event.clientY
		},
		bounds
	)
}

// why is this in this file
// todo make this work for both TouchEvent and MouseEvent
// todo this should be part of <bento-screen>
// todo consolidate all mousey things, separate the mouse from the mousist
/** @param {MouseEvent} event */
function startSelectingRegion(event) {
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	Memory.drawingRegionStart(memory, resolveMouseFromEvent(event, bounds).x)
	/** @param {MouseEvent} event */
	function mousemove(event) {
		if (Memory.regionIsBeingDrawn(memory)) {
			Memory.drawingRegionX(memory, resolveMouseFromEvent(event, bounds).x)
		}
	}
	window.addEventListener("mousemove", mousemove)

	/** @param {MouseEvent} event */
	function drawingRegionComplete(event) {
		Memory.drawingRegionEnd(memory, resolveMouseFromEvent(event, bounds).x)
		window.removeEventListener("mousemove", mousemove)
		db.save()
	}

	window.addEventListener("mouseup", drawingRegionComplete, {once: true})
}

/** @param {import("./memory.js").MousePoint} mouse */
function getMixFromMouse(mouse) {
	let pan = Math.round((mouse.x / screenElement.canvas.width) * 12 - 6)
	let quiet = Math.round((mouse.y / screenElement.canvas.height) * 12)
	return {pan, quiet}
}

// why is this in this file
// todo make this work for both TouchEvent and MouseEvent
// todo this should be part of <bento-screen>
// todo consolidate all mousey things, separate the mouse from the mousist
/** @param {MouseEvent} event */
function startSelectingMix(event) {
	let stepDetails = Memory.getSelectedStepDetails(memory)
	let {layer, step} = stepDetails
	// assumes nothing ever changes size while you're trying to trim a sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	let mix = getMixFromMouse(resolveMouseFromEvent(event, bounds))
	Memory.stepPan(memory, layer, step, mix.pan)
	Memory.stepQuiet(memory, layer, step, mix.quiet)

	/** @param {MouseEvent} event */
	function mousemove(event) {
		let mix = getMixFromMouse(resolveMouseFromEvent(event, bounds))
		Memory.stepPan(memory, layer, step, mix.pan)
		Memory.stepQuiet(memory, layer, step, mix.quiet)
	}
	window.addEventListener("mousemove", mousemove)

	/** @param {MouseEvent} event */
	function done(event) {
		window.removeEventListener("mousemove", mousemove)
		db.save()
	}

	window.addEventListener("mouseup", done, {once: true})
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
// todo lol please clean this up rabbit
/** @param {TouchEvent} event */
function startSelectingRegionWithFinger(event) {
	// assumes nothing ever changes size while you're trying to drawingRegion a
	// sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	let finger = event.touches.item(0)
	let x = resolveMouseFromEvent(finger, bounds).x
	Memory.drawingRegionStart(memory, x)
	/** @param {TouchEvent} event */
	function move(event) {
		if (Memory.regionIsBeingDrawn(memory)) {
			/** @type {Touch} */
			let moved = findFinger(finger, event.changedTouches)
			if (moved) {
				let x = resolveMouseFromEvent(moved, bounds).x
				Memory.drawingRegionX(memory, x)
			}
		}
	}
	window.addEventListener("touchmove", move)
	window.addEventListener(
		"touchend",
		/** @param {TouchEvent} event */
		function (event) {
			let lost = findFinger(finger, event.changedTouches)
			let missing = !findFinger(finger, event.targetTouches)
			if (lost && missing) {
				let x = resolveMouseFromEvent(lost, bounds).x
				Memory.drawingRegionEnd(memory, x)
				window.removeEventListener("touchmove", move)
			}
		},
		{once: true}
	)
}

// todo this should be part of <bento-screen>
// todo this is all very rushed you should fix it it's bad
// todo lol come on now
/** @param {TouchEvent} event */
function startSelectingMixWithFinger(event) {
	// assumes nothing ever changes size while you're trying to drawingRegion a
	// sample
	let bounds = screenElement.canvas.getBoundingClientRect()
	let finger = event.touches.item(0)
	let stepDetails = Memory.getSelectedStepDetails(memory)
	let {layer, step} = stepDetails
	let mix = getMixFromMouse(resolveMouseFromEvent(finger, bounds))
	Memory.stepPan(memory, layer, step, mix.pan)
	Memory.stepQuiet(memory, layer, step, mix.quiet)
	/** @param {TouchEvent} event */
	function move(event) {
		/** @type {Touch} */
		let moved = findFinger(finger, event.changedTouches)

		if (moved) {
			let mix = getMixFromMouse(resolveMouseFromEvent(moved, bounds))

			Memory.stepPan(memory, layer, step, mix.pan)
			Memory.stepQuiet(memory, layer, step, mix.quiet)
		}
	}
	window.addEventListener("touchmove", move)
	window.addEventListener(
		"touchend",
		event =>
			findFinger(finger, event.targetTouches) ||
			window.removeEventListener("touchmove", move),
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
 * @param {HTMLCanvasElement} canvas
 * @param {SharedArrayBuffer} buffer
 */
export function start(canvas, buffer) {
	screenWorker.postMessage({type: "start", buffer})
	screenWorker.onmessage = onWorkerMessage
	memory = Memory.map(buffer)

	if (IS_BASICALLY_A_PHONE) {
		canvas.addEventListener("touchstart", startFingering, {
			passive: true
		})
	} else {
		canvas.addEventListener("mousedown", startMousing, {
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

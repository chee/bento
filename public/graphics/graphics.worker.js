import "../convenience/extend-native-prototypes.js"
import {DPI, Screen} from "./constants.js"
import MemoryTree from "../memory/tree/tree.js"
import Step from "../memory/tree/step.js"
import Sound from "../memory/tree/sound.js"
import {
	DYNAMIC_RANGE,
	NUMBER_OF_KEYS,
	STEPS_PER_LAYER
} from "../memory/constants.js"

/** @type {Record<string, import("../elements/screen.js").StyleMap>}*/
let styles

/**
 * @type {OffscreenCanvasRenderingContext2D} context
 */
let context

/**
 * @type {MemoryTree} [memory]
 */
let memtree

/**
 * @type Screen
 */
let screen = "wav"

/**
 * Clear the canvas and reset the tools
 * @param {OffscreenCanvasRenderingContext2D} context
 */
function clear(context) {
	if (!context) return
	let canvas = context.canvas
	let {width, height} = canvas
	context.restore()

	context.fillStyle = styles.normal.fill
	context.strokeStyle = styles.normal.line
	context.clearRect(0, 0, width, height)
	context.lineWidth = DPI
}

/**
 * draw a full-height rectangle between `start` and `end`
 * @param {number} start
 * @param {number} end
 * @param {string} fill fillStyle
 */
function fillRegion(start, end, fill) {
	context.fillStyle = fill
	context.fillRect(start, 0, end - start, context.canvas.height)
}

/**
 * @typedef {Object} DrawSampleLineArguments
 * @prop {import("../elements/screen.js").StyleMap} style
 * @prop {Float32Array} array
 * @prop {number} x
 * @prop {number} xm
 * @prop {number} height
 * @prop {number} markers
 * @param {DrawSampleLineArguments} args
 */
function drawSampleLine({style, array, x, xm, height, markers}) {
	context.beginPath()
	context.strokeStyle = style.line
	context.lineWidth = DPI
	// trying to make it inversely correlated with the size input so smaller
	// samples have more accuracy
	// cleverer than this would be to move in chunks of 10 and draw their average
	let skip = 32
	for (let index in array) {
		let idx = Number(index)
		let f32 = array.at(idx)
		// Safari's canvas is so slow when drawing big paths. So i'll drop some
		// accuracy.
		// TODO check how slow this is on low-powered devices !!
		// TODO keep accuracy high when the sample is small
		// TODO keep accurancy high when not on safari!!!
		if (idx % skip) {
			continue
		}
		x += xm * skip

		context.lineTo(
			x,
			height - (f32 * getYMultiplier(context) + getZeroPoint(context))
		)
	}

	context.stroke()
	return x
}

/**
 * @param {Step["view"] | Sound["view"]} one
 * @param {Step["view"] | Sound["view"]} two
 */
function same(one, two) {
	if (Object.is(one, two)) return true
	if (!two) {
		return false
	}
	let entries = Object.entries(one)

	for (let [key, value] of entries) {
		if (typeof value == "number" || typeof value == "boolean") {
			if (one[key] != two[key]) {
				return false
			}
		}
	}

	return true
}

/**
 * Get the visible portion of a sound, in the right direction.
 *
 * @param {Step["view"]} step
 * @param {Sound["view"]} sound
 */
function getVisibleSound(step, sound) {
	// TODO stereo?
	let visibleSound = sound.left.subarray(0, sound.length)
	if (step.reversed) {
		// TODO replace with toReversed when support is better (february 2024)
		let reversedVisibleSound = visibleSound.slice(0, visibleSound.length)
		reversedVisibleSound.reverse()
		visibleSound = reversedVisibleSound
	}
	return visibleSound
}

let bitmapCache = {}
/**
 * Create and post the bitmap for a step

 * @param {MemoryTree} memtree
 * @param {OffscreenCanvasRenderingContext2D} context
 * @param {number} layerIndex
 * @param {number} stepIndex
 */
function postBitmap(memtree, context, layerIndex, stepIndex) {
	clear(context)
	let step = memtree.getLayerStep(layerIndex, stepIndex)
	let sound = memtree.getSound(layerIndex)
	let visibleSound = getVisibleSound(step, sound)
	let hasRegion = step.start || step.end
	let length = hasRegion ? step.end - step.start : sound.length
	let [start, end] = [step.start, step.end || sound.length]
	if (step.reversed) {
		;[start, end] = [sound.length - end, sound.length - start]
	}
	let array = visibleSound.subarray(start, end)
	let on = step.on
	let style = styles.boxOn
	let color = style.line
	let cachename = `s${start}e${end}r${step.reversed}v${sound.version}l${layerIndex}o${on}c${color}g${step.gridIndexInLayer}`

	if (!bitmapCache[cachename]) {
		let beforeheight = context.canvas.height
		let beforewidth = context.canvas.width
		let height = (context.canvas.height = 256)
		let width = (context.canvas.width = 256)

		drawSampleLine({
			style,
			array,
			x: 0,
			xm: width / length,
			height
		})
		let bmp = context.canvas.transferToImageBitmap()
		bitmapCache[cachename] = bmp
		context.canvas.height = beforeheight
		context.canvas.width = beforewidth
	}

	globalThis.postMessage({
		type: "waveform",
		bmp: bitmapCache[cachename],
		layer: layerIndex,
		uiStep: step.indexInGrid,
		grid: step.gridIndexInLayer,
		cachename
	})
}

/**
 * Create and post the bitmap for a step
 * @param {MemoryTree} memtree
 * @param {OffscreenCanvasRenderingContext2D} context
 */
function postAllBitmaps(memtree, context) {
	let layerNumber = memtree.selectedLayer
	// todo send for current grid
	for (let stepNumber = 0; stepNumber < STEPS_PER_LAYER; stepNumber++) {
		let step = memtree.getLayerStep(layerNumber, stepNumber)
		if (step.on) {
			postBitmap(memtree, context, layerNumber, stepNumber)
		}
	}
}

/**
 * @param {OffscreenCanvasRenderingContext2D} context
 */
function getZeroPoint(context) {
	return context.canvas.height / 2
}

/**
 * @param {OffscreenCanvasRenderingContext2D} context
 */
function getYMultiplier(context) {
	let verticalDistance = 2
	return context.canvas.height * (1 / verticalDistance)
}

/**
 * @param {OffscreenCanvasRenderingContext2D} context
 * @param {number} soundLength
 */
function getXMultiplier(context, soundLength) {
	return context.canvas.width / soundLength
}

function wav(_frame = 0, force = false) {
	if (!context || !memtree) {
		return requestAnimationFrame(update)
	}
	let step = memtree.getSelectedStep()
	// todo do something with step playback rate step pitch2playbackrate
	let samplesPerBeat = memtree.samplesPerBeat
	let samplesPerStep = samplesPerBeat / 4

	let {canvas} = context
	let regionIsBeingDrawn = memtree.regionIsBeingDrawn

	clear(context)

	let sound = memtree.getSound(step.layerIndex)
	let visibleSound = getVisibleSound(step, sound)
	let width = canvas.width
	let height = canvas.height

	// the horizontal distance between each point
	let xm = getXMultiplier(context, visibleSound.length)
	memtree.drawingRegionXMultiplier = xm

	let drawingRegion = {
		start: memtree.drawingRegionStart,
		// regionX because end will be -1 while region is being drawn
		end: memtree.drawingRegionX
	}

	if (drawingRegion.start > drawingRegion.end) {
		;[drawingRegion.start, drawingRegion.end] = [
			drawingRegion.end,
			drawingRegion.start
		]
	}

	let pixelRegion = {
		start: step.start * xm,
		end: step.end * xm
	}
	let hasRegion = pixelRegion.start || pixelRegion.end

	// this is more draws than the previous version, so it is slower.
	// but the logic is a lot simpler, so i am forgiven.
	// i am so bad at math lol
	// will experiment again if it's too slow on lower-powered devices
	drawSampleLine({
		style: styles.normal,
		array: visibleSound,
		x: 0,
		xm,
		height
	})

	if (hasRegion) {
		let fillStart = pixelRegion.start
		let fillEnd = pixelRegion.end

		if (step.reversed) {
			fillStart = width - pixelRegion.end
			fillEnd = width - pixelRegion.start
		}

		fillRegion(fillStart, fillEnd, styles.region.fill)

		let [start, end] = [step.start, step.end || sound.length]
		if (step.reversed) {
			;[start, end] = [sound.length - end, sound.length - start]
		}

		let array = visibleSound.subarray(start, end)

		drawSampleLine({
			style: styles.region,
			array,
			x: fillStart,
			xm,
			height
		})
	}

	if (regionIsBeingDrawn) {
		fillRegion(
			drawingRegion.start,
			drawingRegion.end,
			styles.drawingRegion.fill
		)
		let s = (drawingRegion.start / xm) | 0
		let e = (drawingRegion.end / xm) | 0

		let array = visibleSound.subarray(s, e)

		drawSampleLine({
			style: styles.drawingRegion,
			array,
			x: drawingRegion.start,
			xm,
			height
		})
	}

	context.stroke()

	requestAnimationFrame(update)
}

function mix(_frame = 0, force = false) {
	if (!context || !memtree) {
		return requestAnimationFrame(update)
	}
	let step = memtree.getSelectedStep()

	clear(context)
	let {width, height} = context.canvas
	let b = DYNAMIC_RANGE
	let hb = DYNAMIC_RANGE / 2

	let h = height
	let w = width
	let quietY = (step.quiet / b) * h
	let panX = ((step.pan + hb) / b) * w

	context.strokeStyle = "white"

	context.lineWidth = DPI * 2
	context.beginPath()
	context.arc(panX, quietY, 20, 0, 2 * Math.PI)
	context.stroke()
	context.lineWidth = DPI
	// horizontal line
	// left side
	context.beginPath()
	context.moveTo(0, height / 2)
	context.lineTo(panX, quietY)
	context.stroke()
	// right side
	context.beginPath()
	context.moveTo(panX, quietY)
	context.lineTo(width, height / 2)
	context.stroke()
	// vertical line
	context.beginPath()
	context.moveTo(width / 2, 0)
	// loud side
	context.strokeStyle = "#fff"
	context.lineTo(panX, quietY)
	context.stroke()
	// quiet side
	context.beginPath()
	context.moveTo(panX, quietY)
	context.strokeStyle = "#fff"
	context.lineTo(width / 2, height)
	context.stroke()

	context.font = "50px qp, monospace"
	context.fillStyle = styles.normal.line
	context.strokeStyle = styles.normal.line

	context.textAlign = "left"
	context.textBaseline = "middle"
	context.fillText("left ear", 0, height / 2)

	context.textAlign = "right"
	context.textBaseline = "middle"
	context.fillText("right ear", width, height / 2)

	context.textAlign = "center"
	context.textBaseline = "top"
	context.fillText("loud", width / 2, 0)

	context.textAlign = "center"
	context.textBaseline = "bottom"
	context.fillText("quiet", width / 2, height)

	requestAnimationFrame(update)
}

/** @type Screen */
let lastScreen = screen
let lastStep
let lastStyles = styles
let lastSound
function update(frame = 0, force = false) {
	// todo figure out atomics.wait so this can all go in the bin
	force = force || lastScreen != screen
	lastScreen = screen
	let layer = memtree.getSelectedLayer()
	let sound = memtree.getSound(layer.index)
	let step = memtree.getSelectedStep()
	let drawing = memtree.regionIsBeingDrawn

	if (
		!force &&
		!drawing &&
		same(step, lastStep) &&
		same(sound, lastSound) &&
		styles == lastStyles
	) {
		return requestAnimationFrame(update)
	}

	// Send the current line to the window so it can be used as the step button's
	// background colour. Don't update while the region is being drawn, that's
	// silly and would be v slow
	// This'll clear the current canvas, so needs to be done before anything else
	// that means it has be be done synchronously too
	// todo bring back hanging for everyone
	// if (
	// 	!same(sound, lastSound) ||
	// 		styles != lastStyles ||
	// 		lastStep.grid != lastSound.grid
	// ) {
	if (!drawing) {
		postAllBitmaps(memtree, context)
	}
	// }
	// if (!drawing) {
	// 	postBitmap(memtree, context, step.layerIndex, step.indexInLayer)
	// }
	lastSound = sound
	lastStyles = styles
	lastStep = step

	if (screen == "wav") {
		wav(frame, force)
	} else if (screen == "mix") {
		mix(frame, force)
	} else if (screen == "key") {
		fillRegion(0, context.canvas.width, "black")
		let xs = context.canvas.width / (NUMBER_OF_KEYS + 1)
		let x = xs * (step.pitch + NUMBER_OF_KEYS / 2)
		fillRegion(x, x + xs, "white")
		requestAnimationFrame(update)
	} else {
		requestAnimationFrame(update)
	}
}

let f = new FontFace("qp", 'url("/aux/fonts/iosevka-qp-regular.ttf")')
f.load()

onmessage = async event => {
	let message = event.data

	if (message.type == "init") {
		let {canvas, styles: newStyles} = message
		styles = newStyles
		screen = message.screen

		context = canvas.getContext("2d")
		context.save()
		context.fillStyle = styles.normal.fill
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.lineWidth = DPI
		context.moveTo(0, canvas.height / 2)
		for (
			let x = (Math.random() / 5) * canvas.width, i = 1;
			x < canvas.width;
			x += (Math.random() / 5) * canvas.width, i++
		) {
			context.lineTo(
				x,
				Math.clamp(
					(canvas.height / 2) *
						(Math.random() + (Math.random() > 0.99 ? Math.random() : 0.5)) -
						(canvas.height / 2) * (1 / i),
					0,
					canvas.height
				)
			)
		}
		context.lineTo(canvas.width, canvas.height)
		context.strokeStyle = styles.normal.line
		context.stroke()

		context.font = styles.normal.font
		context.fillStyle = styles.normal.text
		context.textAlign = "center"
		context.textBaseline = "bottom"
		let text = `press ▶ to start`

		f.load().finally(() => {
			context.fillText(text, canvas.width / 2, canvas.height - 5)
		})
	}

	if (message.type == "start") {
		let {buffer} = message
		memtree = MemoryTree.from(buffer)
		requestAnimationFrame(update)
	}

	if (message.type == "styles") {
		styles = message.styles
	}

	if (message.type == "screen") {
		screen = message.screen
	}
}

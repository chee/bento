// TODO share with graphics.js
const DPI = 3
const style = {
	normal: {
		fill: "#00000000",
		line: "white",
	},
	step: {
		fill: "#00000000",
		line: "white",
		lineWidth: 8,
	},
	region: {
		fill: "#ffffffff",
		line: "#333",
	},
	drawingRegion: {
		fill: "#00ff99ee",
		line: "#fff",
	},
}

/**
 *  @type {import("public/memory.js") | void}
 */
let Memory

/**
 * @type {OffscreenCanvasRenderingContext2D} context
 */
let context

/**
 * @type {import("public/memory.js").MemoryMap | void} memory
 */
let memory

function clear() {
	if (!context) return
	let canvas = context.canvas
	let {width, height} = canvas
	context.restore()
	context.clearRect(0, 0, width, height)
	context.fillStyle = "#00000000"
	context.strokeStyle = "#00000000"
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

function drawSampleLine({style, array, x, xm, height}) {
	context.beginPath()
	context.strokeStyle = style.line
	context.lineWidth = style.lineWidth || DPI

	for (let index in array) {
		let idx = Number(index)
		let f32 = array.at(idx)
		// Safari's canvas is so slow when drawing big paths. So i'll drop some
		// accuracy.
		// TODO check how slow this is on low-powered devices !!
		// TODO keep accuracy high when the sample is small
		// TODO keep accurancy high when not on safari!!!
		let skip = 16
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
 * @param {import("public/memory.js").SoundDetails} one
 * @param {import("public/memory.js").SoundDetails} two
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
	if (
		one.region.start != two.region.start ||
		one.region.end != two.region.end
	) {
		return false
	}
	return same
}

let lastSoundDetails

/**
 * @param {import("public/memory.js").Region} region
 * @param {number} soundLength
 * @returns {import("public/memory.js").Region}
 */
function getReversedRegion(region, soundLength) {
	return {
		start: soundLength - region.end,
		end: soundLength - region.start,
	}
}
/**
 * Get the visible portion of a sound, in the right direction.
 *
 * @param {import("public/memory.js").SoundDetails} soundDetails
 */
function getVisibleSound(soundDetails) {
	let {sound, soundLength, reversed} = soundDetails
	let visibleSound = sound.subarray(0, soundLength)
	if (reversed) {
		let reversedVisibleSound
		// TODO replace with toReversed when support is better (february 2024)
		reversedVisibleSound = new Float32Array(visibleSound.length)
		reversedVisibleSound.set(visibleSound)
		reversedVisibleSound.reverse()
		visibleSound = reversedVisibleSound
	}
	return visibleSound
}

/**
 * Create and post the bitmap for a step

 * @param {import("public/memory.js").MemoryMap} memory
 * @param {OffscreenCanvasRenderingContext2D} context
 * @param {number} pattern
 * @param {number} step
 */
function postBitmap(memory, context, pattern, step, caller = "no one") {
	if (!Memory) {
		throw new Error("tried to post bitmap before init")
	}

	let {height, width} = context.canvas
	let soundDetails = Memory.getSoundDetails(memory, pattern, step)
	let {region, reversed, soundLength} = soundDetails
	let visibleSound = getVisibleSound(soundDetails)
	let hasRegion = region.start || region.end
	let reversedRegion = getReversedRegion(region, visibleSound.length)
	let length = hasRegion ? region.end - region.start : soundLength

	let r = reversed ? reversedRegion : region
	let start = hasRegion ? r.start : 0
	let end = hasRegion ? r.end : soundLength
	let array = visibleSound.subarray(start, end)

	drawSampleLine({
		style: style.step,
		array,
		x: 0,
		xm: width / length,
		height,
	})

	let bmp = context.canvas.transferToImageBitmap()
	console.log({pattern, step})

	globalThis.postMessage({
		type: "waveform",
		bmp,
		pattern,
		step,
	})
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

let lastPattern = -1
function update(_frame = 0, force = false) {
	if (!context || !memory || !Memory) return
	let soundDetails = Memory.getSelectedSoundDetails(memory)

	let {canvas} = context
	let regionIsBeingDrawn = Memory.regionIsBeingDrawn(memory)
	if (!force && !regionIsBeingDrawn && same(soundDetails, lastSoundDetails)) {
		return requestAnimationFrame(update)
	}

	clear()
	if (soundDetails.pattern != lastPattern && !regionIsBeingDrawn) {
		for (let pidx = 0; pidx < Memory.NUMBER_OF_PATTERNS; pidx++) {
			for (let sidx = 0; sidx < Memory.NUMBER_OF_STEPS; sidx++) {
				if (Memory.stepOn(memory, pidx, sidx)) {
					postBitmap(memory, context, pidx, sidx)
				}
			}
		}
	}
	lastPattern = soundDetails.pattern

	lastSoundDetails = soundDetails
	let {region, reversed} = soundDetails

	let visibleSound = getVisibleSound(soundDetails)
	let width = canvas.width
	let height = canvas.height

	// the horizontal distance between each point
	let xm = getXMultiplier(context, visibleSound.length)
	Memory.drawingRegionXMultiplier(memory, xm)

	let drawingRegion = {
		start: Memory.drawingRegionStart(memory),
		// regionX because end will be -1 while region is being drawn
		end: Memory.drawingRegionX(memory),
	}

	if (drawingRegion.start > drawingRegion.end) {
		;[drawingRegion.start, drawingRegion.end] = [
			drawingRegion.end,
			drawingRegion.start,
		]
	}

	let pixelRegion = {
		start: region.start * xm,
		end: region.end * xm,
	}
	let hasRegion = pixelRegion.start || pixelRegion.end

	let reversedRegion = getReversedRegion(region, visibleSound.length)

	// Send the current line to the window so it can be used as the step button's
	// background colour. Don't update while the region is being drawn, that's
	// silly and would be v slow
	// This'll clear the current canvas, so needs to be done before anything else
	if (!regionIsBeingDrawn) {
		postBitmap(memory, context, soundDetails.pattern, soundDetails.step)
	}

	// this is more draws than the previous version, so it is slower.
	// but the logic is a lot simpler, so i am forgiven.
	// i am so bad at math lol
	// will experiment again if it's too slow on lower-powered devices
	drawSampleLine({
		style: style.normal,
		array: visibleSound,
		x: 0,
		xm,
		height,
	})

	if (hasRegion) {
		let fillStart = pixelRegion.start
		let fillEnd = pixelRegion.end
		if (reversed) {
			fillStart = width - pixelRegion.end
			fillEnd = width - pixelRegion.start
		}
		fillRegion(fillStart, fillEnd, style.region.fill)
		let r = reversed ? reversedRegion : region
		let array = visibleSound.subarray(r.start, r.end)
		drawSampleLine({
			style: style.region,
			array,
			x: fillStart,
			xm,
			height,
		})
	}

	if (regionIsBeingDrawn) {
		fillRegion(drawingRegion.start, drawingRegion.end, style.drawingRegion.fill)
		let s = (drawingRegion.start / xm) | 0
		let e = (drawingRegion.end / xm) | 0

		let array = visibleSound.subarray(s, e)

		drawSampleLine({
			style: style.drawingRegion,
			array,
			x: drawingRegion.start,
			xm,
			height,
		})
	}

	context.stroke()

	requestAnimationFrame(update)
}

onmessage = async event => {
	if (!Memory) {
		Memory = await import("../memory.js")
	}

	let message = event.data

	if (message.type == "init") {
		let {canvas} = message
		context = canvas.getContext("2d")
		context.save()
		context.fillStyle = style.normal.fill
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.lineWidth = DPI
		context.moveTo(0, canvas.height / 2)
		for (let x of Array.from(
			Array(canvas.width),
			(_, i) => i + (Math.random() + 1) * 2
		)) {
			context.lineTo(
				x,
				(canvas.height / 2) *
					(Math.random() + (Math.random() > 0.99 ? Math.random() : 0.5))
			)
		}
		context.strokeStyle = style.normal.line
		context.stroke()
	}

	if (message.type == "start") {
		let {buffer} = message
		memory = Memory.map(buffer)
		requestAnimationFrame(update)
	}
}

// TODO share with graphics.js
const DPI = 3
const style = {
	fill: "#00000000",
	line: "white",
	trim: {
		fill: "#ffffffff",
		line: "#333",
	},
	newTrim: {
		fill: "#00ff99ee",
		line: "#fff",
	},
}

/**
 *  @type {import("./memory.js") | void}
 */
let Memory

/**
 * @type {CanvasRenderingContext2D} context
 */
let context
/**
 * @type {import("./memory.js").MemoryMap | void} memory
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

function fillTrim(start, end, fill) {
	context.fillStyle = fill
	context.fillRect(start, 0, end - start, context.canvas.height)
}

function drawSampleLine({context, color, array, x, xm, height, ym, zp}) {
	context.beginPath()
	context.strokeStyle = color
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

		context.lineTo(x, height - (f32 * ym + zp))
	}
	context.stroke()
	return x
}

/**
 * @param {Float32Array} sound1
 * @param {Float32Array} sound2
 * @returns {boolean}
 * probably replace this with an event that forces the draw haha
 */
function fuzzySoundMatch(sound1, sound2) {
	if (sound1.length != sound2.length) {
		return false
	}
	let len = sound1.length
	let getindex = () => (Math.random() * len - 1) | 0
	let idxes = Array.from(Array(1000), getindex)
	return idxes.every(n => sound1[n] == sound2[n])
}

/**
 * @param {import("./memory.js").SoundDetails} deet1
 * @param {import("./memory.js").SoundDetails} deet2
 * @returns {boolean}
 */
function deetMatch(deet1, deet2) {
	return (
		deet1 &&
		deet2 &&
		deet1.trim.start == deet2.trim.start &&
		deet1.step == deet2.step &&
		deet1.channel == deet2.channel &&
		fuzzySoundMatch(deet1.sound, deet2.sound)
	)
}

/**
 * @type {import("./memory.js").SoundDetails}
 * @param {number} frame
 * @param {boolean} force
 */
let lastDeets
function update(_frame, force = false) {
	if (!context || !memory || !Memory) return
	let deets = Memory.getSelectedSoundDetails(memory)
	// if (deetMatch(deets, lastDeets) && !force) {
	// 	return
	// }
	lastDeets = deets
	let {sound, trim: activeTrim} = deets

	let {canvas} = context

	clear()

	// find the top and bottom
	let max = 0
	let min = 0

	// TODO do this part when importing the sample and set the correct length in
	// the memory slot
	// TODO can i loop once?
	let lastZeroIndex = 0

	sound.forEach((f32, i) => {
		max = f32 > max ? f32 : max
		min = f32 < min ? f32 : min
		if (f32 != 0 && !isNaN(f32)) {
			lastZeroIndex = i
		}
	})

	let width = canvas.width
	let height = canvas.height
	// the horizontal distance between each point
	let xm = width / lastZeroIndex
	Memory.xm(memory, xm)

	let verticalDistance = max - min

	let zp = height / 2
	let ym = height * (1 / verticalDistance)
	let x = 0

	let newTrim = {
		start: Memory.trimStart(memory),
		// trimX because end will be -1 while trim is active
		end: Memory.trimX(memory),
	}
	let newTrimStart = newTrim.start
	let newTrimEnd = newTrim.end
	if (newTrimStart > newTrimEnd) {
		;[newTrimStart, newTrimEnd] = [newTrimEnd, newTrimStart]
	}
	let isBeingTrimmed = Memory.trimming(memory)

	let activeTrimStart = activeTrim.start * xm
	let activeTrimEnd = activeTrim.end * xm
	let hasActiveTrim = activeTrim.start || activeTrim.end

	// this is more draws than the previous version, so it is slower.
	// but the logic is a lot simpler, so i am forgiven.
	// i am so bad at math lol
	// will experiment again if it's too slow on lower-powered devices
	context.fillStyle = style.fill
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.strokeStyle = style.line
	context.moveTo(0, zp)
	let visibleSound = sound.subarray(0, lastZeroIndex)
	drawSampleLine({
		context,
		color: style.line,
		array: visibleSound,
		x: 0,
		xm,
		height,
		ym,
		zp,
	})
	let imageData = context.getImageData(0, 0, width, height)
	let imageDataBuffer = imageData.data
	Memory.selectedChannelWaveform(memory, imageDataBuffer)
	console.log(imageDataBuffer.length)

	if (hasActiveTrim) {
		fillTrim(activeTrimStart, activeTrimEnd, style.trim.fill)
		let s = (activeTrimStart / xm) | 0
		let e = (activeTrimEnd / xm) | 0

		let array = visibleSound.subarray(s, e)

		drawSampleLine({
			context,
			color: style.trim.line,
			array,
			x: activeTrimStart,
			xm,
			height,
			ym,
			zp,
		})
	}
	if (isBeingTrimmed) {
		fillTrim(newTrimStart, newTrimEnd, style.newTrim.fill)
		let s = (newTrimStart / xm) | 0
		let e = (newTrimEnd / xm) | 0

		let array = visibleSound.subarray(s, e)

		drawSampleLine({
			context,
			color: style.newTrim.line,
			array,
			x: newTrimStart,
			xm,
			height,
			ym,
			zp,
		})
	}

	// let drawingActiveTrim = false
	// let drawingNewTrim = false

	context.stroke()

	requestAnimationFrame(update)
}

onmessage = async event => {
	console.log("just happy to be here")
	if (!Memory) {
		Memory = await import("./memory.js")
	}

	let message = event.data

	if (message.type == "init") {
		let {canvas} = message
		context = canvas.getContext("2d", {
			// alpha: false,
		})
		context.save()
		context.fillStyle = style.fill
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
		context.strokeStyle = style.line
		context.stroke()
	}

	if (message.type == "start") {
		let {buffer} = message
		memory = Memory.map(buffer)
		requestAnimationFrame(update)
	}
}

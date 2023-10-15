let IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN =
	window.matchMedia("(pointer: coarse)").matches
let DPI = 3
/**
 * @type {CanvasRenderingContext2D | void} context
 */
let context

/**
 * @param {HTMLCanvasElement} canvas
 */
function getContext(canvas) {
	if (!context) {
		context = canvas.getContext("2d", {
			colorSpace: "display-p3",
			alpha: false,
		})
		context.save()
	}
	return context
}

let style = {
	fill: "#cc3366",
	line: "white",
	trim: {
		fill: "white",
		line: "black",
	},
}

/**
 * @param {CanvasRenderingContext2D} context
 */ function clear(context) {
	let canvas = context.canvas
	let {width, height} = canvas
	context.restore()
	context.clearRect(0, 0, width, height)
	context.fillStyle = "#00000000"
	context.strokeStyle = "#00000000"
	context.lineWidth = DPI
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {import("./memory.js").SoundDetails} details
 */
function drawWaveform(context, {sound, trim}) {
	let {canvas} = context
	// find the top and bottom
	let max = 0
	let min = 0

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
	let xWidth = width / lastZeroIndex

	let trimStart = trim.start * xWidth
	let trimEnd = trim.end * xWidth

	let verticalDistance = max - min

	let zeroPoint = height / 2
	let yMult = height * (1 / verticalDistance)

	let x = 0

	context.fillStyle = style.fill
	context.fillRect(0, 0, canvas.width, canvas.height)
	let hasTrim = trimStart || trimEnd
	if (hasTrim) {
		context.fillStyle = style.trim.fill
		context.fillRect(trimStart, 0, trimEnd - trimStart, height)
	}
	// i am so bad at math lol
	context.strokeStyle = style.line
	context.moveTo(0, zeroPoint)
	context.beginPath()
	let drawingTrimRegion = false
	for (let index in sound) {
		let idx = Number(index)
		let f32 = sound.at(idx)
		// only drawing every ${skip}th sample because safari canvas is v slow
		// TODO move drawing to a webworker
		let skip = 40
		if (idx % skip) continue
		x += xWidth * skip
		if (hasTrim && x >= trimStart && x < trimEnd && !drawingTrimRegion) {
			context.stroke()
			context.strokeStyle = style.trim.line
			context.beginPath()
			drawingTrimRegion = true
		} else if (hasTrim && x > trimEnd && drawingTrimRegion) {
			context.stroke()
			context.strokeStyle = style.line
			context.beginPath()
			drawingTrimRegion = false
		}
		context.lineTo(x, height - (f32 * yMult + zeroPoint))
	}

	context.stroke()

	// TODO extract
	/** @param {MouseEvent} event */
	function startTrimming(event) {
		if (
			IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN
		) {
			return
		}
		let start = event.offsetX * DPI
		let bounds = canvas.getBoundingClientRect()
		let middle = canvas.height / 2
		let trimming = true
		// TODO fix overlapping problem when wiggling around
		context.beginPath()
		context.lineWidth = canvas.height
		context.strokeStyle = "#ffff0099"
		context.moveTo(start, middle)
		let lastX = start

		/** @param {number} pageX */
		let getX = pageX =>
			pageX < bounds.left
				? 0
				: pageX > bounds.right
				? canvas.width
				: (pageX - bounds.left) * DPI

		let bounce
		/** @param {MouseEvent} event */
		function mousemove(event) {
			let x = getX(event.pageX)
			if (trimming) {
				clearTimeout(bounce)
				bounce = setTimeout(() => {
					context.beginPath()
					context.moveTo(lastX, middle)
					context.lineTo(x, middle)
					context.stroke()
					lastX = x
				})
			}
		}

		window.addEventListener("mousemove", mousemove)

		function finishTrimming(event) {
			let end = getX(event.pageX)
			let trim = {start: (start / xWidth) | 0, end: (end / xWidth) | 0}
			if (start > end) {
				;[trim.start, trim.end] = [trim.end, trim.start]
			}

			canvas.dispatchEvent(new CustomEvent("trim", {detail: trim}))
			window.removeEventListener("mousemove", mousemove)
		}

		window.addEventListener("mouseup", finishTrimming, {once: true})
	}
	canvas.addEventListener("mousedown", startTrimming, {once: true})

	if (
		IS_PRIMARILY_A_TOUCH_DEVICE_LIKE_A_PHONE_NOT_A_LAPTOP_WITH_A_TOUCH_SCREEN
	) {
		let bounds = canvas.getBoundingClientRect()
		/** @type {Touch?} */
		let finger
		canvas.addEventListener(
			"touchstart",
			event => {
				finger = event.touches[0]
				window.addEventListener(
					"touchend",
					event => {
						let lost = event.changedTouches[0]
						if (lost.identifier == finger.identifier) {
							let [start, end] = [
								finger.pageX - bounds.left,
								lost.pageX - bounds.left,
							]
							if (start > end) {
								;[start, end] = [end, start]
							}
							if (start < 0) start = 0
							if (end > bounds.right) end = bounds.right
							let trim = {
								start: ((start * DPI) / xWidth) | 0,
								end: ((end * DPI) / xWidth) | 0,
							}
							canvas.dispatchEvent(new CustomEvent("trim", {detail: trim}))
						}
					},
					{once: true}
				)
			},
			{once: true}
		)
	}
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import("./memory.js").SoundDetails} details
 */
export async function update(canvas, details) {
	let context = getContext(canvas)
	clear(context)
	drawWaveform(context, details)
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function init(canvas) {
	let context = getContext(canvas)
	context.fillStyle = style.fill
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.moveTo(0, canvas.height / 2)
	for (let x of Array.from(Array(canvas.width), (_, i) => i)) {
		context.lineTo(x, (canvas.height / 2) * (Math.random() + 0.5))
	}
	context.strokeStyle = style.line
	context.stroke()
}

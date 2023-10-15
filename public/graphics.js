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
			//colorSpace: "display-p3",
			//alpha: false,
		})
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
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {import("./memory.js").SoundDetails} details
 */
function drawWaveform(canvas, context, {sound, trim}) {
	// find the top and bottom
	let max = 0
	let min = 0

	let lastZeroIndex = 0
	// TODO can i loop once?
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

	context.moveTo(0, zeroPoint)

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
	sound.forEach((f32, idx) => {
		x += xWidth
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
	})
	context.stroke()

	/** @param {MouseEvent} event */
	function startTrimming(event) {
		let start = event.offsetX
		let middle = canvas.height / 2
		let context = canvas.getContext("2d")
		let trimming = true
		let bounds = canvas.getBoundingClientRect()
		context.beginPath()
		context.lineWidth = canvas.height
		context.strokeStyle = "#ffff0099"
		context.moveTo(start, middle)
		let lastX = start
		// TODO make this good
		// context.lineWidth = canvas.height
		// context.strokeStyle = "#ccffff33"
		// context.beginPath()
		// context.moveTo(start, middle)
		let getX = pageX =>
			pageX < bounds.left
				? 0
				: pageX > bounds.right
				? canvas.width
				: pageX - bounds.left
		/** @param {MouseEvent} event */
		function mousemove(event) {
			let x = getX(event.pageX)
			if (trimming) {
				context.beginPath()
				context.moveTo(lastX, middle)
				context.lineTo(x, middle)
				context.stroke()
				lastX = x
			}
		}

		window.addEventListener("mousemove", mousemove)

		window.addEventListener(
			"mouseup",
			function finishTrimming(event) {
				let end = getX(event.pageX)
				console.log({end, px: event.pageX, bx: bounds.left})
				let trim = {start: (start / xWidth) | 0, end: (end / xWidth) | 0}
				if (start > end) {
					;[trim.start, trim.end] = [trim.end, trim.start]
				}
				canvas.dispatchEvent(new CustomEvent("trim", {detail: trim}))
				window.removeEventListener("mousemove", mousemove)
			},
			{once: true}
		)
	}
	canvas.addEventListener("mousedown", startTrimming, {once: true})
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import("./memory.js").SoundDetails} details
 */
export async function update(canvas, details) {
	let context = getContext(canvas)
	context.reset()
	context.clearRect(0, 0, canvas.width, canvas.height)
	drawWaveform(canvas, context, details)
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export async function init(canvas) {
	context = canvas.getContext("2d")
	context.fillStyle = "#cc3366"
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.moveTo(0, canvas.height / 2)
	for (let x of Array.from(Array(canvas.width), (_, i) => i)) {
		context.lineTo(x, (canvas.height / 2) * (Math.random() + 0.5))
	}
	context.strokeStyle = "white"
	context.stroke()
}

import * as Memory from "./memory.js"

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {Float32Array} array
 */
function drawWaveform(canvas, context, array) {
	canvas.getContext("2d")
	let max = 0
	let min = 0
	let zeros = 0
	// TODO can i loop once?
	array.forEach((f32, i) => {
		max = f32 > max ? f32 : max
		min = f32 < min ? f32 : min
		if (f32 != 0 && !isNaN(f32)) {
			zeros = i
		}
	})
	let verticalDistance = max - min
	let width = canvas.width
	let height = canvas.height
	let zeroPoint = height / 2
	let yMult = height * (1 / verticalDistance)
	let len = zeros
	let xw = width / len
	context.beginPath()
	let x = 0
	context.moveTo(x, zeroPoint)
	context.strokeStyle = "white"
	console.log({
		xw,
		yMult,
		zeroPoint,
		height,
		zeros,
		len,
		min,
		max,
		verticalDistance,
	})
	for (let f32 of array) {
		context.lineTo((x += xw), height - (f32 * yMult + zeroPoint))
	}
	context.stroke()
}

/**
 * @param {SharedArrayBuffer} buffer
 * @param {HTMLCanvasElement} canvas
 */
export async function update(buffer, canvas) {
	let context = canvas.getContext("2d")
	let memory = Memory.map(buffer)
	let array = Memory.sound(memory, Memory.selectedChannel(memory))
	context.fillStyle = "#cc3366"
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.fill()
	drawWaveform(canvas, context, array)
}

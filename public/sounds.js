import unmute from "./unmute.js"
import * as Memory from "./memory.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000

async function decode(thing) {
	return (
		await context.decodeAudioData(await thing.arrayBuffer())
	).getChannelData(context)
}

/**
 * @param {Float32Array} array
 */
export function trim(array, threshold = 0.01) {
	let firstAudibleFloat = -1
	let lastAudibleFloat = array.length
	/** @param {number} f32 */
	let chop = f32 => (f32 / 1000) | 0
	array.forEach((f32, i) => {
		if (chop(f32) != 0) {
			if (firstAudibleFloat == -1) {
				firstAudibleFloat = i
			}
			lastAudibleFloat = i
		} else {
		}
	})
	if (firstAudibleFloat == -1) {
		firstAudibleFloat = 0
	}

	return array.subarray(firstAudibleFloat, lastAudibleFloat)
}

async function wait(millis) {
	return new Promise(yay => setTimeout(yay, millis))
}

export async function recordSound() {
	try {
		let stream = await navigator.mediaDevices.getUserMedia({audio: true})
		let tape = new MediaRecorder(stream)
		let blobs = []
		tape.ondataavailable = event => blobs.push(event.data)
		globalThis.postMessage({type: "recording", start: true})
		tape.start(MAX_RECORDING_LENGTH)
		await new Promise(async yay => {
			await wait(MAX_RECORDING_LENGTH)
			tape.onstop = event => yay(event)
			tape.stop()
		})
		globalThis.postMessage({type: "recording", state: false})

		return decode(new Blob(blobs, {type: blobs[0].type}))
	} catch (error) {
		console.error(`Unable to record.`, error)
	}
}

async function fetchSound(name) {
	try {
		let sound = await fetch(`sounds/${name}.wav`)
		return decode(sound)
	} catch (error) {
		console.error(`Unable to fetch the audio file: ${name}`, error)
	}
}

await context.audioWorklet.addModule("./operator.worklet.js")
await context.audioWorklet.addModule("./expression.worklet.js")

let kick = await fetchSound("skk")
let snar = await fetchSound("sks")
let hhat = await fetchSound("skh")
let open = await fetchSound("sko")

export function setSound(memory, channel, sound) {
	Memory.sound(memory, channel, sound)
	Memory.soundLength(memory, channel, sound.byteLength)
}

/**
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function start(buffer) {
	let ready = new Promise((yay, boo) => {
		context.onstatechange = function () {
			if (context.state == "running") {
				yay()
			} else {
				boo()
			}
		}
	})
	context.resume()
	unmute(context, true, true)
	await ready
	let memory = Memory.map(buffer)
	setSound(memory, 0, kick)
	setSound(memory, 1, snar)
	setSound(memory, 2, hhat)
	setSound(memory, 3, open)

	let operator = new AudioWorkletNode(context, "operator", {
		processorOptions: {buffer},
	})
	let expressions = new AudioWorkletNode(context, "expressions")
	operator.connect(expressions)
	expressions.connect(context.destination)
	document.addEventListener("expression", event => {
		let expression = event.detail
		expressions.port.postMessage({
			type: "expression",
			expression,
		})
	})
}

export function init() {}

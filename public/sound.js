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

async function wait(millis) {
	return new Promise(yay => setTimeout(yay, millis))
}

export async function recordSound() {
	try {
		let stream = await navigator.mediaDevices.getUserMedia({audio: true})
		let tape = new MediaRecorder(stream)
		let blobs = []
		tape.ondataavailable = event => blobs.push(event.data)
		tape.start()
		// TODO move to ui
		document.body.classList.toggle("recording")
		// -1000 because browsers are tricky
		await wait(MAX_RECORDING_LENGTH - 1000)
		tape.stop()
		document.body.classList.toggle("recording")
		await wait(1000)
		if (blobs.length !== 1) {
			console.warn(`weird blob length: ${blobs.length}`)
		}
		return decode(blobs[0])
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

let kick = await fetchSound("skk")
let snar = await fetchSound("sks")
let hhat = await fetchSound("skh")
let open = await fetchSound("sko")

export function setSound(memory, channel, sound) {
	Memory.sound(memory, channel, sound)
	Memory.soundLength(memory, channel, sound.byteLength)
}

export async function start(buffer) {
	context.resume()
	unmute(context, true, true)
	let memory = Memory.map(buffer)
	setSound(memory, 0, kick)
	setSound(memory, 1, snar)
	setSound(memory, 2, hhat)
	setSound(memory, 3, open)
	let operator = new AudioWorkletNode(context, "operator", {
		processorOptions: {buffer},
	})
	operator.connect(context.destination)
}

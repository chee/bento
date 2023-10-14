import unmute from "./unmute.js"
import * as Memory from "./memory.js"
let context = new AudioContext()
async function fetchSound(name) {
	try {
		let rsvp = await fetch(`sounds/${name}.wav`)
		return (
			await context.decodeAudioData(await rsvp.arrayBuffer())
		).getChannelData(context)
	} catch (err) {
		console.log(`Unable to fetch the audio file: ${name} Error: ${err.message}`)
	}
}

await context.audioWorklet.addModule("./operator.worklet.js")

let kick = await fetchSound("skk")
let snar = await fetchSound("sks")
let hhat = await fetchSound("skh")
let open = await fetchSound("sko")
export async function start(buffer) {
	context.resume()
	unmute(context, true, true)
	let memory = Memory.map(buffer)
	Memory.sound(memory, 0, kick)
	Memory.soundLength(memory, 0, kick.byteLength)
	Memory.sound(memory, 1, snar)
	Memory.soundLength(memory, 1, snar.byteLength)
	Memory.sound(memory, 2, hhat)
	Memory.soundLength(memory, 2, hhat.byteLength)
	Memory.sound(memory, 3, open)
	Memory.soundLength(memory, 3, open.byteLength)
	let operator = new AudioWorkletNode(context, "operator", {
		processorOptions: {buffer},
	})
	operator.connect(context.destination)
}

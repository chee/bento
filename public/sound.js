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

let kick = await fetchSound("tkk")
let snar = await fetchSound("tks")
let hhat = await fetchSound("tkh")
let open = await fetchSound("tko")
export async function start(buffer) {
	context.resume()
	unmute(context, true, true)
	let memory = Memory.map(buffer)
	Memory.sound(memory, 0, kick)
	Memory.sound(memory, 1, snar)
	Memory.sound(memory, 2, hhat)
	Memory.sound(memory, 3, open)
	let operator = new AudioWorkletNode(context, "operator", {
		processorOptions: {buffer},
	})
	operator.connect(context.destination)
}

import unmute from "./unmute.js"
import * as Memory from "./memory.js"
let context = new AudioContext()
async function fetchSound(name) {
	try {
		let rsvp = await fetch(`sounds/${name}.wav`)
		return context.decodeAudioData(await rsvp.arrayBuffer())
	} catch (err) {
		console.log(`Unable to fetch the audio file: ${name} Error: ${err.message}`)
	}
}

let kick = await fetchSound("tkk")
let snar = await fetchSound("tks")
let hhat = await fetchSound("tkh")
let open = await fetchSound("tko")
let sounds = [kick, snar, hhat, open]

export async function start(memory) {
	context.resume()
	unmute(context, true, true)

	let lastStep = -1
	setInterval(function () {
		let step = Memory.currentStep(memory)
		let toplay = []
		for (let channel of [0, 1, 2, 3]) {
			if (step != lastStep && lastStep > -1) {
				if (memory[`channel${channel}step${step}on`].at(0)) {
					toplay.push(channel)
				}
			}
		}

		lastStep = step
		if (!toplay.length) {
			return
		}
		let sources = Array.from(Array(4), (_, i) => {
			let source = context.createBufferSource()
			source.buffer = sounds[i]
			source.connect(context.destination)
			return source
		})
		for (let channel of toplay) {
			/** @type {AudioBufferSourceNode} */
			let source = sources[channel]
			source.start()
		}
	}, 0)
}

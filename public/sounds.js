import unmute from "./unmute.js"
import * as Memory from "./memory.js"
import * as loop from "./loop.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000

/**
 * normalize audio
 * @param {Float32Array} sound
 */

function normalize(sound) {
	let max = 0
	for (let f32 of sound) {
		max = Math.max(Math.abs(f32), max)
	}
	if (max != 0) {
		let mult = 1 / max
		loop.range(sound.length).forEach(index => {
			sound[index] *= mult
		})
	}
	return sound
}

/**
 * @param {Blob | Response | File} blob
 */
export async function decode(blob, begin = 0, end = Memory.SOUND_SIZE) {
	return (
		(await context.decodeAudioData(await blob.arrayBuffer()))
			// TODO stereo?
			.getChannelData(0)
			.subarray(begin, end)
	)
}

async function wait(millis = 0) {
	return new Promise(yay => setTimeout(yay, millis))
}

export async function recordSound() {
	try {
		let stream = await navigator.mediaDevices.getUserMedia({audio: true})
		let tape = new MediaRecorder(stream)
		let blobs = []
		tape.ondataavailable = event => blobs.push(event.data)
		globalThis.postMessage({
			type: "recording",
			start: true,
			length: MAX_RECORDING_LENGTH,
		})
		tape.start(MAX_RECORDING_LENGTH)
		await new Promise(async yay => {
			await wait(MAX_RECORDING_LENGTH)
			tape.onstop = event => yay(event)
			tape.stop()
		})
		globalThis.postMessage({type: "recording", state: false})

		return normalize(await decode(new Blob(blobs, {type: blobs[0].type})))
	} catch (error) {
		console.error(`Unable to record.`, error)
	}
}

/**
 * Get a sound from the sounds folder
 * @param {string} name
 */
async function fetchSound(name, ext = "wav") {
	try {
		let sound = await fetch(`./sounds/${name}.${ext}`)
		return decode(sound)
	} catch (error) {
		console.error(`Unable to fetch the audio file: ${name}`, error)
	}
}

await context.audioWorklet.addModule("./bako.worklet.js")
await context.audioWorklet.addModule("./expression.worklet.js")

let kick = await fetchSound("skk")
let snar = await fetchSound("sks")
let hhat = await fetchSound("skh")
let open = await fetchSound("sko")

/**
 * set the sound in memory
 * @param {import("./memory.js").MemoryMap} memory
 * @param {number} patternNumber
 * @param {Float32Array} sound
 */
export function setSound(memory, patternNumber, sound) {
	Memory.sound(memory, patternNumber, sound)
}

/**
 * Create a convolver from an audio buffer
 * @param {AudioBuffer} audiobuffer
 */
// function createReverb(audiobuffer) {
// 	let convolver = context.createConvolver()
// 	convolver.buffer = audiobuffer
// 	return convolver
// }

// let ps1s = await context.decodeAudioData(
// 	await (await fetch("sounds/ps1s.flac")).arrayBuffer()
// )

let alreadyFancy = false
export function fancy() {
	return alreadyFancy
}

/**
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function start(buffer) {
	let ready = new Promise((yay, boo) => {
		if (context.state == "running") {
			yay(context.state)
		}
		context.onstatechange = function () {
			if (context.state == "running") {
				yay(context.state)
			} else {
				boo(context.state)
			}
		}
	})
	context.resume()
	await ready
	alreadyFancy = true
	unmute(context, true)
	let memory = Memory.map(buffer)
	setSound(memory, 0, kick)
	setSound(memory, 1, snar)
	setSound(memory, 2, hhat)
	setSound(memory, 3, open)

	let boxes = loop.patterns(
		patternNumber =>
			new AudioWorkletNode(context, "bako", {
				processorOptions: {buffer, patternNumber},
				channelCount: 2,
				outputChannelCount: [2],
			})
	)

	// let delays = loop.patterns(() => context.createDelay())
	// let feedbacks = loop.patterns(() => createGain())
	// let reverbs = loop.patterns(() => createReverb(ps1s))
	let filters = loop.patterns(() => context.createBiquadFilter())
	let pans = loop.patterns(() => context.createPanner())
	let analyzer = context.createAnalyser()

	loop.patterns(patternIdx => {
		boxes[patternIdx].connect(context.destination)
		// let filter = filters[patternIdx]
		// filter.type = "allpass"
		// boxes[patternIdx].connect(filters[patternIdx])
		// filter.connect(pans[patternIdx])
		// filter.connect(analyzer)
		// pans[patternIdx].connect(context.destination)
		// reverbs[patternIdx].connect(context.destination)

		// delays[patternIdx].connect(feedbacks[patternIdx])
		// delays[patternIdx].delayTime.value = 0.3
		// feedbacks[patternIdx].gain.value = 0.5
		// feedbacks[patternIdx].connect(delays[patternIdx])
		// feedbacks[patternIdx].connect(context.destination)
	})
}

export function init() {}

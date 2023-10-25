import * as Memory from "./memory.js"
import * as loop from "./loop.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000
let iphoneSilenceElement = document.querySelector("audio")
/** @type {AudioWorkletNode[]} */
let boxes

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
 * trim zeros from the beginning of audio
 * @param {Float32Array} sound
 */

function trim(sound) {
	// i have NO IDEA what i'm doing.  what is -144dB in 32-bit float???????????
	let noisefloor = 1e-33

	for (let i = 0; i < sound.length; i++) {
		let sample = sound[i]
		if (Math.abs(sample) > noisefloor) {
			return sound.subarray(i)
		}
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
		tape.start(MAX_RECORDING_LENGTH)
		globalThis.postMessage({
			type: "recording",
			recording: true,
			length: MAX_RECORDING_LENGTH
		})
		await new Promise(async yay => {
			await wait(MAX_RECORDING_LENGTH)
			tape.onstop = event => yay(event)
			tape.stop()
		})
		globalThis.postMessage({type: "recording", recording: false})

		return normalize(
			trim(await decode(new Blob(blobs, {type: blobs[0].type})))
		)
	} catch (error) {
		// TODO show error in UI
		alert(
			":( i failed. :< can you record in other apps? if it's just bento that is broken try restarting your browser or e-mail bento@chee.party"
		)
		console.error(`:( i failed.`, error)
	}
}

/**
 * Get a sound from the sounds folder
 * @param {string} name
 */
async function fetchSound(name, ext = "wav") {
	try {
		let sound = await fetch(`/sounds/${name}.${ext}`)
		return decode(sound)
	} catch (error) {
		console.error(`:< unable to fetch the audio file: ${name}`, error)
	}
}

await context.audioWorklet.addModule("/bako.work.js")
await context.audioWorklet.addModule("/expr.work.js")

let [kick, snar, hhat, open] = await Promise.all(
	["skk", "sks", "skh", "sko"].map(s => fetchSound(s))
)

/**
 * set the sound in memory
 * @param {import("./memory.js").MemoryMap} memory
 * @param {number} layerNumber
 * @param {Float32Array} sound
 */
export function setSound(memory, layerNumber, sound) {
	Memory.sound(memory, layerNumber, sound)
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

export async function pause() {
	context.suspend()
	iphoneSilenceElement.pause()
	alreadyFancy = false
}

export async function play() {
	iphoneSilenceElement.play()
	context.onstatechange = function () {
		if (
			// @ts-ignore-line listen this is a thing on ios, typescript. reality
			// matters
			context.state == "interrupted"
		) {
			alreadyFancy = false
			context.resume().then(() => {
				alreadyFancy = true
			})
		}
	}

	await context.resume()
	alreadyFancy = true
}

/**
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function start(buffer) {
	await play()
	if (alreadyFancy) {
		return
	}
	alreadyFancy = true
}

export async function init(buffer) {
	let memory = Memory.map(buffer)
	setSound(memory, 0, kick)
	setSound(memory, 1, snar)
	setSound(memory, 2, hhat)
	setSound(memory, 3, open)

	boxes = loop.layers(
		layerNumber =>
			new AudioWorkletNode(context, "bako", {
				processorOptions: {buffer, layerNumber},
				channelCount: 2,
				outputChannelCount: [2]
			})
	)

	let filters = loop.layers(() => context.createBiquadFilter())
	let pans = loop.layers(() => context.createPanner())
	let analyzer = context.createAnalyser()

	// let delays = loop.layers(() => context.createDelay())
	// let feedbacks = loop.layers(() => createGain())
	// let reverbs = loop.layers(() => createReverb(ps1s))
	loop.layers(layerIdx => {
		boxes[layerIdx].connect(context.destination)
		// let filter = filters[layerIdx]
		// filter.type = "allpass"
		// boxes[layerIdx].connect(filters[layerIdx])
		// filter.connect(pans[layerIdx])
		// filter.connect(analyzer)
		// pans[layerIdx].connect(context.destination)
		// reverbs[layerIdx].connect(context.destination)

		// delays[layerIdx].connect(feedbacks[layerIdx])
		// delays[layerIdx].delayTime.value = 0.3
		// feedbacks[layerIdx].gain.value = 0.5
		// feedbacks[layerIdx].connect(delays[layerIdx])
		// feedbacks[layerIdx].connect(context.destination)
	})
}

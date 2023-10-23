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
	if (alreadyFancy) {
		return
	}
	alreadyFancy = true

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
				outputChannelCount: [2]
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

import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as constants from "./sounds.const.js"
import Delay from "./sounds/delay.js"
import DjFilter from "./sounds/dj-filter.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000
let iphoneSilenceElement = document.querySelector("audio")
/** @type {Memory.MemoryMap} */
let memory

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
 * @param {string} url
 */
async function fetchSound(url) {
	try {
		let sound = await fetch(url)
		return decode(sound)
	} catch (error) {
		console.error(`:< unable to fetch the audio file at ${url}`, error)
	}
}

await context.audioWorklet.addModule("/layer.work.js")
await context.audioWorklet.addModule("/expr.work.js")

/**
 * set the sound in memory
 * @param {import("./memory.js").MemoryMap} memory
 * @param {number} layerNumber
 * @param {Float32Array} sound
 */
export function setSound(memory, layerNumber, sound) {
	Memory.sound(memory, layerNumber, sound)
}

let alreadyFancy = false
export function fancy() {
	return alreadyFancy
}

document.addEventListener("visibilitychange", () => {
	if (document.hidden && Memory.paused(memory)) {
		context.suspend()
		iphoneSilenceElement.parentElement.removeChild(iphoneSilenceElement)
		alreadyFancy = false
	} else {
		play()
	}
})

export async function pause() {}

export async function play() {
	context.onstatechange = function () {
		if (
			// @ts-ignore-line listen, this is a thing on ios, typescript. reality
			// matters
			context.state == "interrupted"
		) {
			alreadyFancy = false
			context.resume().then(() => {
				alreadyFancy = true
			})
		}
	}
	document.body.append(iphoneSilenceElement)
	await context.resume()
	iphoneSilenceElement.play()
	alreadyFancy = true
}

export async function start() {
	await play()
	if (alreadyFancy) {
		return
	}
	alreadyFancy = true
}

/**
 * @param {string[]} urls
 */
export async function loadKit(...urls) {
	for (let [index, url] of Object.entries(urls)) {
		setSound(memory, +index, await fetchSound(url))
	}
}

export async function loadDefaultKit() {
	return loadKit(
		"/sounds/skk.wav",
		"/sounds/sks.wav",
		"/sounds/skh.wav",
		"/sounds/sko.wav"
	)
}

export function empty() {
	return memory.layerSounds.every(n => !n)
}

/**
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function init(buffer) {
	memory = Memory.map(buffer)

	let analyzer = context.createAnalyser()
	analyzer.fftSize = 2048
	// let analysis = new Float32Array(analyzer.fftSize)

	loop.layers(idx => {
		let layer = new AudioWorkletNode(context, "bento-layer", {
			processorOptions: {buffer, layerNumber: idx},
			channelCount: 1,
			numberOfOutputs: 1 + constants.NUMBER_OF_CONTROL_OUTPUTS,
			outputChannelCount: [
				2,
				...Array(constants.NUMBER_OF_CONTROL_OUTPUTS).fill(1)
			]
		})
		let pan = new StereoPannerNode(context)
		layer.connect(pan.pan, constants.Output.Pan)

		let filter = new DjFilter(context, {layer})
		let delay = new Delay(context, {layer})

		/* layer -> filter */
		layer.connect(filter.in, constants.Output.Sound)

		/* filter->pan */
		filter.out.connect(pan)

		/* pan->dac */
		pan.connect(context.destination)

		// /* pan->sends */
		// pan.connect(reverb.in)
		pan.connect(delay.in)

		// /* sends->dac */
		delay.out.connect(context.destination)
		// reverb.out.connect(context.destination)

		// /* everything that goes out is connected to the analyzer too  */
		pan.connect(analyzer)
		delay.out.connect(analyzer)
		// reverb.out.connect(analyzer)
	})
}

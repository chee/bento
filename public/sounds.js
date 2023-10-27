import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as constants from "./sounds.const.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000
let iphoneSilenceElement = document.querySelector("audio")
/** @type {AudioWorkletNode[]} */
let layers

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
function createReverb(audiobuffer) {
	let convolver = context.createConvolver()
	convolver.buffer = audiobuffer
	return convolver
}

let ps1 = await context.decodeAudioData(
	await (await fetch("/sounds/ps1h.flac")).arrayBuffer()
)

let alreadyFancy = false
export function fancy() {
	return alreadyFancy
}

export async function pause() {
	context.suspend()
	iphoneSilenceElement.pause()
	alreadyFancy = false
}

function ios() {
	return (
		navigator.platform.startsWith("iP") ||
		(navigator.platform.startsWith("Mac") && navigator.maxTouchPoints)
	)
}

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		iphoneSilenceElement.pause()
		// context.suspend()
	} else {
		iphoneSilenceElement.play()
		// context.resume()
	}
})

export async function play() {
	if (ios()) {
		iphoneSilenceElement.play()
	}
	context.onstatechange = function () {
		if (
			// @ts-ignore-line listen this is a thing on ios, typescript. reality
			// matters
			context.state == "interrupted"
		) {
			alreadyFancy = false
			context.resume().then(() => {
				alreadyFancy = true
				iphoneSilenceElement.pause()
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

	layers = loop.layers(
		layerNumber =>
			new AudioWorkletNode(context, "bako", {
				processorOptions: {buffer, layerNumber},
				channelCount: 2,
				numberOfOutputs: 12,
				outputChannelCount: [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
			})
	)
	let layerParams = []
	layers.forEach((l, i) => {
		layerParams[i] = {}
		l.parameters.forEach((p, n, r) => {
			layerParams[i][n] = {
				param: p,
				parent: r
			}
		})
	})

	let lowpasses = loop.layers(
		() =>
			new BiquadFilterNode(context, {
				type: "lowpass"
			})
	)
	let highpasses = loop.layers(
		() =>
			new BiquadFilterNode(context, {
				type: "highpass"
			})
	)
	// these will have their
	let lowpassGains = loop.layers(() => context.createGain())
	let highpassGains = loop.layers(() => context.createGain())
	let pans = loop.layers(() => context.createStereoPanner())
	let analyzer = context.createAnalyser()

	let delaySends = loop.layers(() => context.createGain())
	let delays = loop.layers(() => context.createDelay())
	let feedbacks = loop.layers(() => context.createGain())
	let reverbs = loop.layers(() => createReverb(ps1))
	let reverbSends = loop.layers(() => context.createGain())
	loop.layers(idx => {
		let layer = layers[idx]
		layer.connect(pans[idx].pan, constants.Output.Pan)
		layer.connect(lowpassGains[idx].gain, constants.Output.LowPassGain)
		layer.connect(highpassGains[idx].gain, constants.Output.HighPassGain)
		layer.connect(lowpasses[idx].frequency, constants.Output.LowPassFrequency)
		layer.connect(
			highpasses[idx].frequency,
			constants.Output.HighPassFrequency
		)
		layer.connect(lowpasses[idx].Q, constants.Output.LowPassQ)
		layer.connect(highpasses[idx].Q, constants.Output.HighPassQ)
		layer.connect(reverbSends[idx].gain, constants.Output.ReverbSend)
		layer.connect(delaySends[idx].gain, constants.Output.DelaySend)
		layer.connect(delays[idx].delayTime, constants.Output.DelayTime)
		layer.connect(delays[idx].delayTime, constants.Output.DelayTime)
		layer.connect(feedbacks[idx].gain, constants.Output.DelayFeedback)
		delays[idx].connect(feedbacks[idx])
		feedbacks[idx].connect(delays[idx])

		reverbSends[idx].connect(reverbs[idx])

		layer.connect(lowpassGains[idx], constants.Output.Sound)
		layer.connect(highpassGains[idx], constants.Output.Sound)
		lowpassGains[idx].connect(lowpasses[idx])
		highpassGains[idx].connect(highpasses[idx])
		lowpasses[idx].connect(pans[idx])
		highpasses[idx].connect(pans[idx])
		pans[idx].connect(reverbSends[idx])
		pans[idx].connect(delaySends[idx])
		delays[idx].connect(context.destination)
		feedbacks[idx].connect(context.destination)
		reverbs[idx].connect(context.destination)
		pans[idx].connect(context.destination)
		pans[idx].connect(analyzer)
	})
}

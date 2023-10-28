import * as Memory from "./memory.js"
import * as loop from "./loop.js"
import * as constants from "./sounds.const.js"
import Delay from "./sounds/delay.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (Memory.SOUND_SIZE / context.sampleRate) * 1000
let iphoneSilenceElement = document.querySelector("audio")
/** @type {AudioWorkletNode[]} */
let layers

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

let ps1 = await context.decodeAudioData(
	await (await fetch("/sounds/ps1h.flac")).arrayBuffer()
)

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
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function init(buffer) {
	memory = Memory.map(buffer)
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

	let analyzer = context.createAnalyser()

	loop.layers(idx => {
		let layer = layers[idx]
		let lowpassGain = new GainNode(context, {gain: 0.5})
		let lowpass = new BiquadFilterNode(context, {
			type: "lowpass",
			frequency: 40000
		})
		let highpassGain = new GainNode(context, {gain: 0.5})
		let highpass = new BiquadFilterNode(context, {
			type: "highpass",
			frequency: 0
		})
		let pan = new StereoPannerNode(context)
		let delay = new Delay(context)
		let reverbSend = new GainNode(context, {gain: 0})
		let reverb = createReverb(ps1)

		layer.connect(pan.pan, constants.Output.Pan)

		layer.connect(lowpassGain.gain, constants.Output.LowPassGain)
		layer.connect(lowpass.frequency, constants.Output.LowPassFrequency)
		layer.connect(lowpass.Q, constants.Output.LowPassQ)

		layer.connect(highpassGain.gain, constants.Output.HighPassGain)
		layer.connect(highpass.frequency, constants.Output.HighPassFrequency)
		layer.connect(highpass.Q, constants.Output.HighPassQ)

		layer.connect(reverbSend.gain, constants.Output.ReverbSend)

		delay.connectLayerParams(layer)

		layer.connect(lowpassGain, constants.Output.Sound)
		layer.connect(highpassGain, constants.Output.Sound)

		/*
		 * both filters always connected, gain set to 0.5 when "off"
		 */
		lowpassGain.connect(lowpass)
		highpassGain.connect(highpass)

		/*
		 * input level to reverb controlled by gain in worker
		 */
		reverbSend.connect(reverb)

		/* filters->pan */
		lowpass.connect(pan)
		highpass.connect(pan)

		/* pan->sends */
		pan.connect(reverbSend)
		delay.connectInput(pan)

		/* sends->dac */
		delay.connectOutput(context.destination)
		reverb.connect(context.destination)

		/* pan->dac */
		pan.connect(context.destination)

		/* everything connected to the analyzer too  */
		delay.connectOutput(analyzer)
		reverb.connect(analyzer)
		pan.connect(analyzer)
	})
}

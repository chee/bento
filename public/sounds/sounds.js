import {SOUND_SIZE, LayerType} from "../memory/constants.js"
import * as loop from "../convenience/loop.js"
import Synth from "./sources/synth.js"
import Passthru from "./sources/passthru.js"
import MemoryTree from "../memory/tree/tree.js"
let context = new AudioContext()
// in milliseconds
let MAX_RECORDING_LENGTH = (SOUND_SIZE / context.sampleRate) * 1000
let iphoneSilenceElement = document.querySelector("audio")
/** @type {MemoryTree} */
let memtree
/** @type {SharedArrayBuffer} */
let sharedarraybuffer

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
export async function decode(blob, begin = 0, end = SOUND_SIZE) {
	// TODO stereo?
	return (await context.decodeAudioData(await blob.arrayBuffer()))
		.getChannelData(0)
		.subarray(begin, end)
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
		let audio = new Promise(async yay => {
			await wait(MAX_RECORDING_LENGTH)
			tape.onstop = event => yay(event)
			tape.stop()
		}).then(async () =>
			normalize(trim(await decode(new Blob(blobs, {type: blobs[0].type}))))
		)
		return {
			length: MAX_RECORDING_LENGTH,
			audio
		}
	} catch (error) {
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
let alreadyFancy = false
export function fancy() {
	return alreadyFancy
}

document.addEventListener("visibilitychange", () => {
	if (!memtree) {
		return
	}
	if (document.hidden && (memtree.paused || !memtree.playing)) {
		context.suspend()
		iphoneSilenceElement.load()
		// iphoneSilenceElement.pause()
		iphoneSilenceElement.parentElement.removeChild(iphoneSilenceElement)
		alreadyFancy = false
	} else {
		play()
	}
})

let party = document.querySelector("bento-party")

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
}

export async function start() {
	await play()
	if (alreadyFancy) {
		return
	}
	let analyzer = context.createAnalyser()
	analyzer.fftSize = 2048
	// todo write analysis to memory periodically
	// let analysis = new Float32Array(analyzer.fftSize)

	loop.layers(idx => {
		let layer = memtree.getLayer(idx)
		let processorOptions = {buffer: sharedarraybuffer, layerNumber: idx}

		let quiet = new AudioWorkletNode(context, "quiet-party", {
			processorOptions,
			numberOfInputs: 1,
			numberOfOutputs: 1,
			channelCount: 2,
			outputChannelCount: [2],
			channelInterpretation: "speakers"
		})

		/** @type {import("./sources/source.js").default | void} */
		let source
		let type = layer.type

		if (type == LayerType.sampler) {
			let sampler = new AudioWorkletNode(context, "bento-sampler", {
				processorOptions,
				numberOfInputs: 0,
				numberOfOutputs: 1,
				channelCount: 2,
				outputChannelCount: [2],
				channelInterpretation: "speakers"
			})
			let passthru = new Passthru(context)
			sampler.connect(quiet)
			quiet.connect(passthru.in)
			passthru.connect(context.destination)
			source = passthru
		} else if (type == LayerType.synth) {
			let synth = new Synth(context)
			synth.connect(quiet)
			quiet.connect(context.destination)
			source = synth
		}

		let transport = new AudioWorkletNode(context, "bento-layer", {
			processorOptions
		})

		transport.port.onmessage = event => {
			let message = event.data
			party.updateCurrentStep(memtree)
			// todo make this unnecesary
			if (message == "step-change") {
				memtree.announce("steps", -1)
				let step = memtree.getStep(idx)
				if (step.on && source) {
					source.play(step)
				}
			}
		}
	})

	alreadyFancy = true
}

/**
 * @param {string[]} urls
 */
export async function loadKit(...urls) {
	for (let [index, url] of Object.entries(urls)) {
		let audio = await fetchSound(url)
		memtree.alterSound(+index, sound => {
			sound.audio = audio
			// sound.sampleRate = context.sampleRate
		})
	}
}

export async function loadKitFromPath(base) {
	return loadKit(
		`${base}/a.wav`,
		`${base}/b.wav`,
		`${base}/c.wav`,
		`${base}/d.wav`
	)
}

export async function loadDefaultKit() {
	return loadKitFromPath("/aux/kits/casio")
}

export function empty() {
	return memtree.karaoke()
}

/**
 * @param {SharedArrayBuffer} buffer
 * @return {Promise}
 */
export async function init(buffer) {
	sharedarraybuffer = buffer
	memtree = MemoryTree.from(buffer)
}

await context.audioWorklet.addModule("/sounds/layer.audioworklet.js")
await context.audioWorklet.addModule("/sounds/sampler.audioworklet.js")
await context.audioWorklet.addModule("/sounds/quietparty.audioworklet.js")

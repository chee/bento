// this proved to keep unreliable time. unacceptable

import {SOUND_SIZE} from "../../memory/memory.js"
import BentoSoundSource from "./source.js"

export default class Sampler extends BentoSoundSource {
	/** @type AudioBufferSourceNode */
	#source
	/** @type AudioBuffer */
	#audiobuffer

	#zeros = new Float32Array(SOUND_SIZE)

	/** @type Map<string, Float32Array> */
	#cache = new Map()

	/** @param {AudioContext} context */
	constructor(context) {
		super(context)
		this.#audiobuffer = new AudioBuffer({
			length: SOUND_SIZE * Float32Array.BYTES_PER_ELEMENT,
			sampleRate: this.sampleRate,
			numberOfChannels: 1
		})
	}

	/** @param {import("../../memory/memory.js").StepDetails} step */
	play(step) {
		super.play(step)
		let start = step.region.start || 0
		let end = step.region.end || step.soundLength
		let version = step.version
		let reversed = step.reversed
		let cachename = `s${start}e${end}v${version}r${reversed}`
		if (!this.#cache.has(cachename)) {
			let portion = step.sound.slice(
				step.region.start,
				step.region.end || step.soundLength
			)
			if (step.reversed) {
				portion.reverse()
			}
			this.#cache.set(cachename, portion)
		}
		let portion = this.#cache.get(cachename)

		if (this.#source) {
			// this.#source.stop()
			// this.#source.disconnect(this.source)
		}
		this.#audiobuffer.copyToChannel(portion, 0)
		if (portion.length < this.#audiobuffer.length) {
			let length = portion.length
			let diff = this.#audiobuffer.length - length
			this.#audiobuffer.copyToChannel(this.#zeros.subarray(0, diff), 0, length)
		}
		this.#source = new AudioBufferSourceNode(this.context, {
			buffer: this.#audiobuffer
		})
		this.#source.connect(this.source)

		this.#source.playbackRate.value = this.note2freq(step.pitch)
		this.#source.start()
	}
}

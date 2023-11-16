import Step from "../../memory/tree/step.js"
import {pitch2playbackrate} from "../scale.js"
import BentoSoundSource from "./source.js"

export default class Synth extends BentoSoundSource {
	/** @type number the amount of stereo detune between the samplers */
	#width
	/** @type OscillatorOptions["type"] */
	#type
	/** @type {OscillatorNode[]} */
	#oscillators

	/**
	 * @param {AudioContext} context
	 */
	constructor(context) {
		super(context)
		let leftpan = new StereoPannerNode(context, {pan: -1})
		leftpan.connect(this.source)
		let rightpan = new StereoPannerNode(context, {pan: 1})
		rightpan.connect(this.source)
		let leftosc = new OscillatorNode(context)
		let rightosc = new OscillatorNode(context)
		leftosc.connect(leftpan)
		rightosc.connect(rightpan)
		this.#oscillators = [leftosc, rightosc]
		this.width = 0.1
		this.type = "square"
	}

	get width() {
		return this.#width
	}

	set width(val) {
		this.#width = val
		let detune = val / 2
		let [left, right] = this.#oscillators
		left.detune.value = -detune
		right.detune.value = detune
	}

	get type() {
		return this.#type
	}

	#startGain = 1

	set type(val) {
		this.#type = val
		switch (val) {
			case "triangle":
			case "sine":
				this.#startGain = 0.6
				break
			case "sawtooth":
			case "square":
				this.#startGain = 0.3
				break
		}

		for (let o of this.#oscillators) {
			o.type = val
		}
	}

	/** @param {number} val */
	set #frequency(val) {
		for (let o of this.#oscillators) {
			o.frequency.value = val
		}
	}

	#started = false

	start() {
		for (let o of this.#oscillators) {
			o.start()
		}
		this.#started = true
	}

	/** @param {Step["view"]} step */
	play(step) {
		super.play(step)
		if (!this.#started) {
			this.start()
		}
		if (step.on) {
			let freq = pitch2playbackrate(step.pitch, this.scale)
			this.#frequency = 440 * freq
			// this.out.gain.value = 1
			let time = this.context.currentTime
			// todo this magic should happen in quiet-party and be a function of
			// envelope
			this.out.gain.setValueAtTime(this.#startGain, time)
			this.out.gain.setTargetAtTime(0, time, 0.1)
		}
	}
}

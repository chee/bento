import BentoDjFilter from "../effects/dj-filter.js"
import BentoAudioNode from "../node.js"
import {DYNAMIC_RANGE} from "../../memory/memory.js"

/**
 * @typedef {typeof Scale[keyof typeof Scale]} Scale
 * @readonly
 */
export const Scale = /** @type const */ ({
	HarmonicMinor: [0, 2, 3, 5, 7, 8, 11]
})

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(DYNAMIC_RANGE)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

export default class BentoSoundSource extends BentoAudioNode {
	/** @type Scale */
	scale
	// todo make getters and setters for these that perform the lerp
	/** @type number */
	attack
	/** @type number */
	decay
	/** @type number */
	sustain
	/** @type number */
	release

	/**
	 * @param {AudioContext} context
	 */
	constructor(context) {
		super(context)
		this.source = new GainNode(context, {
			gain: 1
		})
		this.pan = new StereoPannerNode(context)
		this.source.connect(this.pan)
		this.out = new GainNode(context, {
			gain: 1
		})
		this.filter = new BentoDjFilter(context)
		this.pan.connect(this.filter.in)
		this.filter.out.connect(this.out)
		this.scale = Scale.HarmonicMinor
	}

	/**
	 * @param {import("public/public/memory/memory.js").StepDetails} step
	 */
	play(step) {
		let time = this.context.currentTime
		// TODO use bpm to calculate a value for ramping to a time
		this.source.gain.setValueAtTime(qcurve[step.quiet], time)
		this.pan.pan.setValueAtTime(step.pan / (DYNAMIC_RANGE / 2), time)
		this.filter.freq = step.freq
		this.filter.q = step.q
	}

	/**
	 * @param {AudioNode} destination
	 * @param {number?} [output]
	 * @param {number?} [input]
	 */
	connect(destination, output, input) {
		if (input != null) {
			return this.out.connect(destination, output, input)
		}
		if (output != null) {
			return this.out.connect(destination, output)
		}
		return this.out.connect(destination)
	}

	/** @param {number} note */
	note2freq(note) {
		let noteOctave = Math.floor(note / this.scale.length) * 12
		let noteIndex = Math.abs(note % this.scale.length)
		let factor = 1 + (this.scale[noteIndex] + noteOctave)
		return 2 ** (factor / 12)
	}
}

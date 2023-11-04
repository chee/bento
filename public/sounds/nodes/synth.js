import BentoAudioNode from "./node.js"

let scales = {
	"harmonic-minor": [0, 2, 3, 5, 7, 8, 11]
}

/**
 * @typedef {{
 [Option in typeof Synth["options"][number]]?: Synth[Option]
}} SynthOptions
 */
export default class Synth extends BentoAudioNode {
	static options = /** @type const */ ([
		"width",
		"type",
		"scale",
		"key",
		"octave"
	])
	/** @type {keyof scales} */
	scale = "harmonic-minor"
	/** @type {"a"|"a#"|"b"|"c"|"c#"|"d"|"d#"|"e"|"f"|"f#"|"g"|"g#"} */
	key = "a"
	octave = "3"
	#width = 0.1
	/** @type OscillatorOptions["type"] */
	#type = "sine"
	#attack = 0
	#release = 0
	/** @type {OscillatorNode[]} */
	#oscillators
	/**
	 * @param {AudioContext} context
	 * @param {SynthOptions} options
	 */
	constructor(context, {type = "sine", width = 0.1}) {
		super(context)
		this.out = new GainNode(context)
		this.out.gain.value = 0.000001
		let leftpan = new StereoPannerNode(context, {pan: -1})
		leftpan.connect(this.out)
		let rightpan = new StereoPannerNode(context, {pan: 1})
		rightpan.connect(this.out)
		let leftosc = new OscillatorNode(context)
		let rightosc = new OscillatorNode(context)
		leftosc.connect(leftpan)
		rightosc.connect(rightpan)
		this.#oscillators = [leftosc, rightosc]
		this.width = width
		this.type = type
		leftosc.start()
		rightosc.start()
	}

	get width() {
		return this.#width
	}

	set width(val) {
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
				this.#startGain = 0.4
				break
		}

		for (let o of this.#oscillators) {
			o.type = val
		}
	}

	/** @param {number} val */
	set #frequency(val) {
		console.log(val)
		for (let o of this.#oscillators) {
			o.frequency.value = val
		}
	}

	/** @param {number} note */
	play(note) {
		let scale = scales[this.scale]
		let no = Math.floor(note / scale.length) * 12
		let nm = note % scale.length

		let f = 1 + (scale[nm] + no)
		this.#frequency = 440 * f ** (1 / 12)
		// this.out.gain.value = 1
		this.out.gain.setValueAtTime(this.#startGain, this.context.currentTime)
		this.out.gain.linearRampToValueAtTime(
			0.000001,
			this.context.currentTime + 0.4
		)
	}
}

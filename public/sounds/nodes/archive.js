class Envelope {
	/** @type {"chilling" | "attacking" | "releasing"} */
	state = "chilling"
	constructor(a, r) {
		this.attack = a
		this.release = r
		this.divider = 1000
		this.point = 0
		this.calc()
	}

	calc() {
		this.attackSeconds = (this.attack * 2) ** 2 / this.divider
		this.attackSamples = this.attackSeconds * sampleRate
		this.releaseSeconds = (this.release * 2) ** 2 / this.divider
		this.releaseSamples = this.releaseSeconds * sampleRate
		this.totalSamples = this.attackSamples + this.releaseSamples
	}

	start() {
		this.point = 0
		this.calc()
		if (this.attackSamples || this.releaseSamples) {
			this.state = "attacking"
		}
	}

	get value() {
		if (this.state == "attacking") {
			let amp = this.point / this.attackSamples
			this.point += 1
			if (this.point >= this.attackSamples) {
				this.state = "releasing"
			}
			return amp // * Math.sin((this.point / this.totalSamples) * Math.PI * 0.5)
		} else if (this.state == "releasing") {
			let amp = 1 - this.point / this.totalSamples
			this.point += 1
			if (this.point >= this.totalSamples) {
				this.state = "chilling"
			}
			return amp // * Math.sin((this.point / this.totalSamples) * Math.PI * 0.5)
		} else if (this.state == "chilling") {
			this.point += 1
			return this.attackSeconds || this.releaseSeconds ? 0 : 1
		}
	}
}

class QuietPartyFilter {
	/** @type {"by" | "lo" | "hi"} */
	pass = "by"
	#cutoff = 0
	#scale = 8
	/**
	 * @param {number} freq
	 * @param {number} q
	 */
	constructor(freq, q, scale = 8) {
		this.set(freq, q, scale)
	}

	/**
	 * @param {number} freq
	 * @param {number} q
	 */
	set(freq, q, scale = 8) {
		this.freq = freq
		this.q = q
		if (freq == 0) {
			this.pass = "by"
		} else if (freq > 0) {
			this.pass = "hi"
		} else if (freq < 0) {
			this.pass = "lo"
		}
		this.#scale = scale
		this.scale()
		this.calc()
		this.#filter = new Float32Array(4)
	}

	scale() {
		if (this.pass == "hi") {
			this.#cutoff = (sampleRate / this.#scale) * this.freq
		} else if ((this.pass = "lo")) {
			this.#cutoff =
				(sampleRate - (sampleRate / this.#scale) * Math.abs(this.freq)) / 12
		}
		this.#q = this.q / this.#scale
	}

	#freq = 0
	#q = 0
	#damp = 0

	calc() {
		this.#freq =
			2 * Math.sin(Math.PI * Math.min(0.25, this.#cutoff / (sampleRate * 2)))
		this.#damp = Math.min(
			2 * (1 - Math.pow(this.#q, 0.25)),
			Math.min(2, 2 / this.#freq - this.#freq * 0.5)
		)
		console.log(this.#cutoff)
	}

	#filter = new Float32Array(4)

	/**
	 * @param {number} signal
	 */
	signal(signal) {
		this.#filter[3] = signal - this.#damp * this.#filter[2]
		this.#filter[0] = this.#filter[0] + this.#freq * this.#filter[2]
		this.#filter[1] = this.#filter[3] - this.#filter[0]
		this.#filter[2] = this.#freq * this.#filter[1] + this.#filter[2]

		this.#filter[3] = signal - this.#damp * this.#filter[2]
		this.#filter[0] = this.#filter[0] + this.#freq * this.#filter[2]
		this.#filter[1] = this.#filter[3] - this.#filter[0]
		this.#filter[2] = this.#freq * this.#filter[1] + this.#filter[2]

		if (this.pass == "by") {
			return signal
		}
		if (this.pass == "lo") {
			// return signal
			return 0.5 * this.#filter[0]
		}
		if (this.pass == "hi") {
			// return signal
			return 0.5 * this.#filter[1]
		}
		return signal
	}

	/** @param {number[]} signal */
	apply(signals) {}
}

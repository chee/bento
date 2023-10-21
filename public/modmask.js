/**
 * @enum {number}
 */
const Bitshift = {
	shift: 1,
	control: 2,
	alt: 3,
	meta: 4
}

export default class Modmask {
	static shift = 1 << 1
	static control = 1 << 2
	static ctrl = 1 << 2
	static alt = 1 << 3
	static meta = 1 << 4
	/** @param {KeyboardEvent} event */
	constructor(event) {
		this.bits = 0
		this.bits |= +event.shiftKey << Bitshift.shift
		this.bits |= +event.ctrlKey << Bitshift.control
		this.bits |= +event.altKey << Bitshift.alt
		this.bits |= +event.metaKey << Bitshift.alt
	}

	get shift() {
		return Boolean(this.bits & Modmask.shift)
	}
	get control() {
		return Boolean(this.bits & Modmask.control)
	}
	get ctrl() {
		return Boolean(this.bits & Modmask.control)
	}
	get alt() {
		return Boolean(this.bits & Modmask.alt)
	}
	get meta() {
		return Boolean(this.bits & Modmask.meta)
	}
	get only() {
		let bits = this.bits
		return {
			get shift() {
				return Boolean(bits == Modmask.shift)
			},
			get control() {
				return Boolean(bits == Modmask.control)
			},
			get ctrl() {
				return Boolean(bits == Modmask.control)
			},
			get alt() {
				return Boolean(bits == Modmask.alt)
			},
			get meta() {
				return Boolean(bits == Modmask.meta)
			}
		}
	}
	get none() {
		return !this.bits
	}

	get symbol() {
		return String.fromCodePoint(parseInt("1fbaa", 16) + this.bits)
	}
}

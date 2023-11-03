// welcome to my file
Object.defineProperties(Array.prototype, {
	chunk: {
		value(size = 1) {
			let chunks = []
			for (let i = 0; i < this.length; i += size) {
				chunks.push(this.slice(i, i + size))
			}
			return chunks
		}
	},
	random: {
		value() {
			return this[(Math.random() * this.length) | 0]
		}
	}
})

/**
 * A clamp function with the same sig as CSS's clamp()
 * @param {number} min
 * @param {number} num
 * @param {number} max
 */
function clamp(min, num, max) {
	return num > max ? max : num < min ? min : num
}

/**
 * A wrap function with the same sig as CSS's clamp()
 * @param {number} min
 * @param {number} num
 * @param {number} max
 */
function wrap(min, num, max) {
	return num > max ? min : num < min ? max : num
}

Object.defineProperties(Math, {
	clamp: {value: clamp},
	wrap: {value: wrap}
})

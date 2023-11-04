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
 * Clamp a number between a min and mix
 * @param {number} num
 * @param {number} min
 * @param {number} max
 */
function clamp(num, min, max) {
	return num > max ? max : num < min ? min : num
}

/**
 * Wrap a number around
 * @param {number} min
 * @param {number} num
 * @param {number} max
 */
function wrap(num, min, max) {
	return num > max ? min : num < min ? max : num
}

/**
 * Scale a number (from 0-1) to a range from min and max
 * @param {number} num
 * @param {number} min
 * @param {number} max
 */
function lerp(num, min, max) {
	return num > max ? min : num < min ? max : num
}

Object.defineProperties(Math, {
	clamp: {value: clamp},
	wrap: {value: wrap},
	lerp: {value: lerp}
})

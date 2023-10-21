/**
 * A clamp function with the same sig as CSS's clamp()
 * @param {number} min
 * @param {number} min
 * @param {number} min
 */
function clamp(min, num, max) {
	return num > max ? max : num < min ? min : num
}

/**
 * A wrap function with the same sig as CSS's clamp()
 * @param {number} min
 * @param {number} min
 * @param {number} min
 */
function wrap(min, num, max) {
	return num > max ? min : num < min ? max : num
}

let BentoMath = {
	...Math,
	clamp,
	wrap
}

for (let m of Reflect.ownKeys(Math)) {
	BentoMath[m] = Math[m]
}

globalThis.Math = BentoMath

export default BentoMath

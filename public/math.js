/**
 * A clamp function with the same sig as CSS's clamp()
 * @param {number} min
 * @param {number} min
 * @param {number} min
 */
function clamp(min, num, max) {
	return Math.min(max, Math.max(min, num))
}

let BentoMath = {
	...Math,
	clamp,
}

for (let m of Reflect.ownKeys(Math)) {
	BentoMath[m] = Math[m]
}

globalThis.Math = BentoMath

export default BentoMath

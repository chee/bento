/**
 * @typedef {typeof Scale[keyof typeof Scale]} Scale
 * @readonly
 */
export const Scale = /** @type const */ ({
	HarmonicMinor: [0, 2, 3, 5, 7, 8, 11]
})

/**
 * @param {number} pitch
 * @param {Scale} scale
 */
// todo octaves
// lol i am so bad at math
export function pitch2freq(pitch, scale) {
	let noteIndex = pitch % scale.length
	// everything means
	if (pitch < 0) {
		noteIndex = scale.length + noteIndex
	}

	if (noteIndex == scale.length) {
		noteIndex = 0
	}
	let octave = 1
	if (pitch < 0) {
		octave = 0.5
	} else if (pitch > scale.length - 1) {
		octave = 2
	}
	let factor = scale[noteIndex]

	return 2 ** (factor / 12) * octave
}

/**
 * @typedef {typeof Scale[keyof typeof Scale]} Scale
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
export function pitch2playbackrate(pitch, scale) {
	let noteIndex = pitch % scale.length
	// everything means
	if (pitch < 0) {
		noteIndex = scale.length + noteIndex
	}

	if (noteIndex == scale.length) {
		noteIndex = 0
	}
	let octave = 1
	// lol why can i not figure out the math for this
	if (pitch < 0 - scale.length) {
		octave = 0.25
	} else if (pitch < 0) {
		octave = 0.5
	} else if (pitch > scale.length * 2) {
		octave = 4
	} else if (pitch > scale.length - 1) {
		octave = 2
	}
	let factor = scale[noteIndex]

	return 2 ** (factor / 12) * octave
}

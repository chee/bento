// lmao lost 20 mins on trying to allow dots in the type.
// i've had to write it in typescript inside na object
/**
 * @typedef {{
   ".": number
   "..": number
	s: number
	e: number
	g: number
	o: number
	r: number
 }} SerializedStep
 */

/**
 * serialize a step's info to a flat object
 * currently we do not serialize the sound, that will
 * come later with the sound format
 * @param {import("./memory").StepDetails} stepDetails
 */
export function step(stepDetails) {
	return {
		".": stepDetails.step,
		"..": stepDetails.pattern,
		s: stepDetails.region.start,
		e: stepDetails.region.end,
		g: stepDetails.gain,
		o: stepDetails.on,
		r: stepDetails.reversed,
	}
}

/**
 * serialize a step's info to text/plain
 * @param {import("./memory").StepDetails} stepDetails
 */
export function stringifyStep(stepDetails) {
	let x = step(stepDetails)
	x.e
	let output = ""
	for (let [key, value] of step(stepDetails).entries()) {
		output += key + " " + value + "\n"
	}
	return output + "\n"
}

/**
 * serialize a step's info from text/plain
 * use this as the input for Memory.loadStep or Memory.copyStep
 * @param {string} step
 * @returns {SerializedStep}
 */
export function parseStep(step) {
	let serialized = {}
	for (let line in step.split("\n")) {
		let [key, value] = line.split(" ")
		serialized[key] = value
	}
	return serialized
}

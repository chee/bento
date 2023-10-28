import * as constants from "../sounds.const.js"

export default function createFilter(
	/** @type {BiquadFilterType} */
	type,
	/** @type {AudioContext} */
	context,
	/** @type {AudioNode} */
	input,
	/** @type {AudioNode} */
	output
) {
	let send = new GainNode(context)
	let filter = new BiquadFilterNode(context, {type})
	send.connect(filter)
	return {
		gain: send.gain,
		frequency: filter.frequency,
		q: filter.Q,
		filter
	}
}

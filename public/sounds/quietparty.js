/**
 * @typedef {Float32Array[][]} SoundTube
 */

import {DYNAMIC_RANGE} from "../memory/constants.js"

/** the curve used to make the gain more satisfying */
let qcurve = new Float32Array(DYNAMIC_RANGE + 1)
for (let i = 0; i < qcurve.length; i++) {
	qcurve[i] = 1.00001 - Math.sin((i / (qcurve.length + 1)) * Math.PI * 0.5)
}

/**
 * @typedef {Object} SoundInfo
 * @prop {number} quiet
 * @prop {number} pan
 */

/**
 * @param {SoundInfo} info
 * @param {[number, number]} sample
 */
export default function (info, [left, right]) {
	let pan = (info.pan + DYNAMIC_RANGE / 2) / DYNAMIC_RANGE
	let panl = Math.cos((pan * Math.PI) / 2)
	let panr = Math.sin((pan * Math.PI) / 2)
	return [left * qcurve[info.quiet] * panl, right * qcurve[info.quiet] * panr]
}

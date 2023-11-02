/* data migrations */
export function scaleStepsForGrids(/** @type Uint8Array */ array) {
	let layera = array.subarray(0, 15)
	let layerb = array.subarray(16, 31)
	let layerc = array.subarray(32, 47)
	let layerd = array.subarray(48, 64)
	// can't reuse any info from the outside object because it
	// might change but this function must never
	let stepsPerLayer = 128
	let layersPerMachine = 4
	let layerNumberOffset = 0
	let updated = new Uint8Array(
		(layersPerMachine + layerNumberOffset) * stepsPerLayer
	)
	updated.set(layera, 0)
	updated.set(layerb, stepsPerLayer)
	updated.set(layerc, stepsPerLayer * 2)
	updated.set(layerd, stepsPerLayer * 3)
	return updated
}

/**
 * @typedef {import("./memory.js").MemoryMapType} MemoryMap
 * @typedef {(map: MemoryMap) => MemoryMap} Migration
 */

/**
 * @type {Migration[]}
 */
export default [
	// 0 to 1
	map => map,
	// 1 to 2
	map => map,
	// 2 to 3
	map => {
		// if ("layerLengths" in map) {
		// 	map.numberOfStepsInGrids = /**@type {Uint8Array}*/ (map.layerLengths)
		// 	delete map.layerLengths
		// }

		map.stepOns = scaleStepsForGrids(map.stepOns)
		map.stepPans = scaleStepsForGrids(map.stepPans)
		map.stepQuiets = scaleStepsForGrids(map.stepQuiets)
		map.stepReverseds = scaleStepsForGrids(map.stepReverseds)

		return map
	}
]

/* data migrations */
export function scaleStepsForGrids(/** @type Uint8Array */ array) {
	if (array.length != 64) {
		console.log(array.length)
		return array
	}
	let layera = array.subarray(0, 15)
	let layerb = array.subarray(16, 31)
	let layerc = array.subarray(32, 47)
	let layerd = array.subarray(48, 64)
	console.log({layera, layerb, layerc, layerd})
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
 * @typedef {import("./memory.js").MemoryMap} MemoryMap
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
		if (map.layerLengths) {
			map.numberOfStepsInGrids = map.layerLengths
			delete map.layerLengths
		}
		return map
		map.stepOns.set(scaleStepsForGrids(map.stepOns))
		map.stepPans.set(scaleStepsForGrids(map.stepPans))
		map.stepQuiets.set(scaleStepsForGrids(map.stepQuiets))
		map.stepReverseds.set(scaleStepsForGrids(map.stepReverseds))
		return map
	}
]

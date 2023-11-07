let mem = this.#mem
/** @type Grid */
let grid = {
	index,
	indexInLayer: grid2layerGrid(index),
	on: Boolean(mem.gridOns.at(index)),
	layer: grid2layer(index),
	jump: mem.gridJumps.at(index),
	loop: mem.gridLoops.at(index),
	speed: mem.gridSpeeds.at(index)
}
this.#grids.set(index, Object.freeze(grid))

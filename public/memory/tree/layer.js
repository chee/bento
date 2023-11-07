let layer = {
	index,
	selectedGrid: mem.layerSelectedGrids.at(index),
	type: /** @type LayerType */ (mem.layerTypes.at(index)) || LayerType.sampler
}

/**
 * @import {Repo, default as AutomergeRepo, AutomergeUrl, DocHandle, DocHandleChangePayload} from "@automerge/automerge-repo"
 */

import Layer from "../memory/tree/layer.js"
import Step from "../memory/tree/step.js"
import Sound from "../memory/tree/sound.js"
import Grid from "../memory/tree/grid.js"
import MemoryTree from "../memory/tree/tree.js"
import * as loop from "../loop.js"

/**
 *
 * @param {Float32Array} float32Array
 * @returns
 */
function f2u8(float32Array) {
	const buffer = new ArrayBuffer(float32Array.length * 4)
	const view = new DataView(buffer)
	for (let i = 0; i < float32Array.length; i++) {
		view.setFloat32(i * 4, float32Array[i], true)
	}
	return new Uint8Array(buffer)
}

/**
 *
 * @param {Uint8Array} uint8Array
 * @returns
 */
function u82f(uint8Array) {
	const buffer = uint8Array.buffer
	const view = new DataView(buffer)
	const float32Array = new Float32Array(uint8Array.length / 4)
	for (let i = 0; i < float32Array.length; i++) {
		float32Array[i] = view.getFloat32(i * 4, true)
	}
	return float32Array
}

/**
 * @type {Repo}
 */
let repo
/**
 * @type {AutomergeRepo}
 */
let AutomergeRepo

/**@type {SharedArrayBuffer} */
let sharedarraybuffer

/**
 *
 * @param {(repo: Repo, Repo: AutomergeRepo) => Promise<void>} fn
 */
async function withAutomergeRepo(fn) {
	if (repo) {
		return fn(repo, AutomergeRepo)
	} else {
		return new Promise(yay => {
			document.addEventListener("repo", () => {
				fn(repo, AutomergeRepo).then(yay)
			})
		})
	}
}

let alreadyFancy = false

export function fancy() {
	return alreadyFancy
}

/**
 *
 * @param {SharedArrayBuffer} sab
 * @returns
 */
export async function init(sab) {
	if (repo) return
	sharedarraybuffer = sab
	AutomergeRepo = await import("./automerge-repo-slim.js")
	let {BrowserWebSocketClientAdapter} = await import(
		"./automerge-repo-websocket.js"
	)
	let {IndexedDBStorageAdapter} = await import("./automerge-repo-indexeddb.js")
	await AutomergeRepo.initializeWasm(fetch("/automerge/automerge.wasm"))
	repo = new AutomergeRepo.Repo({
		storage: new IndexedDBStorageAdapter(),
		network: [new BrowserWebSocketClientAdapter("wss://galaxy.observer")],
		async sharePolicy() {
			return true
		}
	})
	window.repo = repo
	document.dispatchEvent(new CustomEvent("repo"))
}

/**
 * @typedef {{
 *  layer: number
 *  detune: number
 *  length: number
 *  bytes: Uint8Array
 *  version: number
 * }} CollaborativeSound
 */

/**
 * @typedef {Object} CollaborativePattern
 * @prop {Record<number, import("../memory/tree/layer.js").LayerJSON>} layers
 * @prop {Record<number, import("../memory/tree/grid.js").GridJSON>} grids
 * @prop {Record<number, import("../memory/tree/step.js").StepJSON>} steps
 * @prop {Record<number, AutomergeUrl>} sounds
 * @prop {{bpm: number}} master
 */

/**
 * @type {() => void}
 */
let unlisten

let currentId
/**
 * @param {AutomergeUrl} url
 * @param {import("../memory/tree/tree.js").default} memtree
 */
export async function start(url, memtree) {
	if (url == currentId) return
	alreadyFancy = false
	currentId = url
	/**
	 * @type {import("@automerge/automerge-repo").DocHandle<CollaborativePattern>}
	 */
	let handle = repo.find(url)
	window.handle = handle
	let firstLoadComplete = false
	/** @type {DocHandle<CollaborativeSound>[]} */
	let soundHandles = []
	await handle.doc().then(async doc => {
		soundHandles = loop.layers(index => {
			/** @type {DocHandle<CollaborativeSound>} */
			return repo.find(doc.sounds[index])
		})

		let sounds = await Promise.all(soundHandles.map(handle => handle.doc()))
		memtree.bpm = doc.master.bpm

		loop.layers(index => {
			memtree.alterLayer(
				index,
				m => {
					let p = doc.layers[index]
					for (let key in p) {
						m[key] = p[key]
						if (key == "length") {
						}
					}
				},
				"automerge"
			)
			memtree.alterSound(
				index,
				sound => {
					for (let key in sounds[index]) {
						if (key == "bytes" || key == "version") {
						} else {
							sound[key] = sounds[index][key]
						}
					}
					sound.audio = u82f(sounds[index].bytes).subarray(
						0,
						sounds[index].length
					)
				},
				"automerge"
			)
		})
		loop.machineGrids(index =>
			memtree.alterGrid(
				index,
				m => {
					let p = doc.grids[index]
					for (let key in p) {
						m[key] = p[key]
					}
				},
				"automerge"
			)
		)
		loop.machineSteps(index =>
			memtree.alterStep(
				index,
				m => {
					if (!m) {
						m = new Step(memtree.memory, index)
					}
					let p = doc.steps[index]
					for (let key in p) {
						m[key] = p[key]
					}
				},
				"automerge"
			)
		)
		firstLoadComplete = true
	})
	handle.broadcast("hello")
	/**
	 *
	 * @param {AutomergeRepo.DocHandleEphemeralMessagePayload<CollaborativePattern>} payload
	 */
	function onephemera(payload) {
		console.info(payload.message, payload)
	}
	handle.addListener("ephemeral-message", onephemera)
	alreadyFancy = true
	let preventPatchApplications = false
	let dispose = memtree.listen((kind, index, source) => {
		if (source == "automerge") return
		if (!firstLoadComplete) return
		preventPatchApplications = true
		switch (kind) {
			case "layers":
			case "grids":
			case "steps": {
				handle.change(
					pattern => {
						let patternItem = pattern[kind][index]
						let memtreeItem = memtree[kind][index]
						if (!memtreeItem) {
							console.error("yup")
						}
						for (let key in patternItem) {
							if (key == "selectedGrid") {
								continue
							}
							key = /** @type {keyof typeof memtreeItem} */ (key)
							if (patternItem[key] != memtreeItem[key]) {
								patternItem[key] = memtreeItem[key] ?? null
							}
						}
					},
					{message: "memtree"}
				)
				break
			}
			case "sounds": {
				/** @type {DocHandle<CollaborativeSound>} */
				let soundHandle = soundHandles[index]
				soundHandle.change(
					sound => {
						const memsound = memtree.sounds[index]
						// todo should maybe create a whole new sound when this
						// happens because otherwise phew it's gonna get LARGE
						sound.bytes = f2u8(
							memsound.left.subarray(0, memtree.sounds[index].length)
						)
						for (let key in sound) {
							if (key == "bytes" || key == "version") {
							} else {
								sound[key] = memsound[key]
							}
						}
					},
					{message: "memtree"}
				)
				break
			}
			case "master": {
				handle.change(
					pattern => {
						if (pattern.master.bpm != memtree.bpm) {
							pattern.master.bpm = memtree.bpm
						}
					},
					{message: "memtree"}
				)
				break
			}
		}
		preventPatchApplications = false
	})

	let kindAlterMap = /** @type {const} */ ({
		steps: "alterStep",
		grids: "alterGrid",
		layers: "alterLayer",
		sounds: "alterSound"
	})

	/**
	 *
	 * @param {DocHandleChangePayload} change
	 */
	function onchange(change) {
		if (preventPatchApplications) return
		for (let patch of change.patches) {
			let [kind, index] = patch.path.splice(0, 2)
			switch (patch.action) {
				case "splice":
				case "put": {
					let {value} = patch
					if ("conflict" in patch) {
						console.error("a put conflict happened", patch)
					}
					if (
						kind == "master" &&
						index == "bpm" &&
						typeof patch.value == "number"
					) {
						memtree.bpm = patch.value
						continue
					}
					let patchKey = patch.path.shift()
					const fn = kindAlterMap[/** @type {keyof kindAlterMap}*/ (kind)]
					if (fn) {
						memtree[fn](
							+index,
							item => {
								if (!item) {
									if (kind == "steps") {
										item = new Step(memtree.memory, +index)
									} else {
										console.error(`unexpected lazy ${kind}!`)
									}
								}
								if (kind == "sounds") {
									console.error("sounds", patchKey, value)
								} else {
									if (patchKey == null) {
										for (let key in /** @type {any[]} */ (value)) {
											if (key == "selectedGrid") {
												continue
											}
											item[key] = value[key]
										}
									} else {
										item[patchKey] = value
									}
								}
							},
							"automerge"
						)
					}
					continue
				}
				case "del":
				case "inc":
				case "insert":
				case "mark":
				case "unmark": {
					console.error(`unhandled ${patch.action} occurred!`)
					continue
				}
				case "conflict": {
					console.warn("OH NO A CONFLICT", patch)
					continue
				}
			}
		}
		firstLoadComplete = true
	}
	handle.on("change", onchange)

	/**
	 * @param {number} index
	 * @returns {(change: DocHandleChangePayload) => void}
	 */
	function createonsoundchange(index) {
		return function onsoundchange(change) {
			for (let patch of change.patches) {
				let key = patch.path.shift()
				switch (patch.action) {
					case "splice":
					case "put": {
						let {value} = patch
						if ("conflict" in patch) {
							console.error("a put conflict happened", patch)
						}
						memtree.alterSound(
							// todo correct index
							index,
							sound => {
								if (key == "bytes") {
									sound.audio = u82f(
										/** @type {Uint8Array} */ (value)
									).subarray(index, change.patchInfo.after.length)
								} else if (key == "version") {
								} else {
									sound[key] = value
								}
							},
							"automerge"
						)
						continue
					}
					case "del":
					case "inc":
					case "insert":
					case "mark":
					case "unmark": {
						console.error(`unhandled ${patch.action} occurred!`)
						continue
					}
					case "conflict": {
						console.warn("OH NO A CONFLICT", patch)
						continue
					}
				}
			}
		}
	}

	const offsoundchanges = loop.layers(i => {
		const onsoundchange = createonsoundchange(i)
		soundHandles[i].on("change", onsoundchange)
		return () => soundHandles[i].off("change", onsoundchange)
	})

	unlisten = () => {
		dispose()
		handle.off("change", onchange)
		handle.off("ephemeral-message", onephemera)
		offsoundchanges.forEach(o => o())
	}
}

export function stop() {
	unlisten?.()
	unlisten = null
}

/**
 *
 * @param {MemoryTree} memtree
 */
export function create(memtree) {
	/** @type {Record<number, AutomergeUrl>} sounds */
	const sounds = {}
	/** @type {Record<number, import("../memory/tree/layer.js").LayerJSON>} */
	const layers = {}
	/** @type {Record<number, import("../memory/tree/grid.js").GridJSON>} grids */
	const grids = {}
	/** @type {Record<number, import("../memory/tree/step.js").StepJSON>} steps */
	const steps = {}
	loop.layers(index => {
		layers[index] = new Layer(memtree.memory, index).toJSON()
	})
	loop.machineGrids(
		index => (grids[index] = new Grid(memtree.memory, index).toJSON())
	)
	loop.machineSteps(
		index => (steps[index] = new Step(memtree.memory, index).toJSON())
	)
	loop.layers(index => {
		const {left, right, ...json} = new Sound(memtree.memory, index).toJSON()
		sounds[index] = repo.create({
			...json,
			bytes: f2u8(left.subarray(0, json.length))
		}).url
	})
	/**
	 * @type {DocHandle<CollaborativePattern>}
	 */
	let handle = repo.create({})
	handle.change(doc => {
		doc.layers = layers
	})
	handle.change(doc => {
		doc.grids = grids
	})
	handle.change(doc => {
		doc.steps = steps
	})
	handle.change(doc => {
		doc.sounds = sounds
	})
	handle.change(doc => {
		doc.master = {bpm: memtree.bpm}
	})
	return handle.documentId
}

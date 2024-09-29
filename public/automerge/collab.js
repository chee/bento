/**
 * @import {Repo, default as AutomergeRepo, AutomergeUrl, DocHandle, DocHandleChangePayload} from "@automerge/automerge-repo"
 */

import Layer from "../memory/tree/layer.js"
import Step from "../memory/tree/step.js"
import Sound from "../memory/tree/sound.js"
import Grid from "../memory/tree/grid.js"
import MemoryTree from "../memory/tree/tree.js"
import {insertAt} from "./automerge-repo-slim.js"
import * as loop from "../loop.js"
import {Master} from "../memory/constants.js"
import {trim} from "../sounds/sounds.js"

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

export function fancy() {
	return !!repo
}

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
	await repo.networkSubsystem.whenReady()
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
	currentId = url
	/**
	 * @type {import("@automerge/automerge-repo").DocHandle<CollaborativePattern>}
	 */
	let handle = repo.find(url)
	window.handle = handle
	let firstLoadComplete = false
	await handle.doc().then(async doc => {
		loop.layers(index =>
			memtree.alterLayer(
				index,
				m => {
					let p = doc.layers[index]
					for (let key in p) {
						m[key] = p[key]
					}
				},
				"automerge"
			)
		)
		loop.grids(index =>
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
		loop.steps(index =>
			memtree.alterStep(
				index,
				m => {
					let p = doc.steps[index]
					for (let key in p) {
						m[key] = p[key]
					}
				},
				"automerge"
			)
		)
		let sounds = await Promise.all(
			loop.layers(index => {
				/** @type {DocHandle<CollaborativeSound>} */
				let handle = repo.find(doc.sounds[index])
				return handle.doc()
			})
		)
		loop.layers(index => {
			memtree.alterSound(
				index,
				sound => {
					for (let key in sounds[index]) {
						if (key == "bytes" || key == "version") {
						} else {
							// sound[key] = sounds[index][key]
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
		firstLoadComplete = true
	})
	let preventPatchApplications = false
	let dispose = memtree.listen((kind, index, source) => {
		if (source == "automerge") return
		if (!firstLoadComplete) return
		preventPatchApplications = true
		switch (kind) {
			case "layers": {
				handle.change(
					pattern => {
						let ps = pattern.layers[index]
						let ms = memtree.layers[index]
						for (let key in ps) {
							key = /** @type {keyof typeof ms} */ (key)
							if (ps[key] != ms[key]) {
								ps[key] = ms[key]
							}
						}
					},
					{message: "memtree"}
				)
				break
			}
			case "grids": {
				handle.change(
					pattern => {
						let ps = pattern.grids[index]
						let ms = memtree.grids[index]
						for (let key in ps) {
							key = /** @type {keyof typeof ms} */ (key)
							if (ps[key] != ms[key]) {
								ps[key] = ms[key]
							}
						}
					},
					{message: "memtree"}
				)
				break
			}
			case "steps": {
				handle.change(
					pattern => {
						let ps = pattern.steps[index]
						let ms = memtree.steps[index]
						for (let key in ps) {
							key = /** @type {keyof typeof ms} */ (key)
							if (ps[key] != ms[key]) {
								ps[key] = ms[key] ?? null
							}
						}
					},
					{message: "memtree"}
				)
				break
			}
			case "sounds": {
				handle.change(
					pattern => {
						pattern
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

	/**
	 *
	 * @param {DocHandleChangePayload} change
	 */
	function onchange(change) {
		if (preventPatchApplications) return
		for (let patch of change.patches) {
			let [kind, index] = patch.path.splice(0, 2)
			switch (patch.action) {
				case "put": {
					let {value, conflict} = patch
					if (
						kind == "master" &&
						index == "bpm" &&
						typeof patch.value == "number"
					) {
						memtree.bpm = patch.value
						continue
					}
					let key = patch.path.shift()
					if (kind == "steps") {
						if (key != null) {
							memtree.alterStep(
								+index,
								step => {
									step[key] = value
								},
								"automerge"
							)
						} else {
							memtree.alterStep(
								+index,
								step => {
									for (let key in value) {
										step[key] = value[key]
									}
								},
								"automerge"
							)
						}
					} else if (kind == "grids") {
						if (key != null) {
							memtree.alterGrid(
								+index,
								grid => {
									grid[key] = value
								},
								"automerge"
							)
						} else {
							memtree.alterGrid(
								+index,
								grid => {
									for (let key in value) {
										grid[key] = value[key]
									}
								},
								"automerge"
							)
						}
					} else if (kind == "sounds") {
						console.info("SOUNDS HAPEN")
					}

					continue
				}
				case "del": {
					continue
				}
				case "splice": {
					let {value} = patch
					let key = patch.path.shift()
					if (kind == "steps") {
						if (value == "on" || value == "off") {
							memtree.alterStep(
								+index,
								step => {
									step[key] = value
								},
								"automerge"
							)
						} else if (key != null) {
							memtree.alterStep(
								+index,
								step => {
									step[key] = value
								},
								"automerge"
							)
						} else {
							memtree.alterStep(
								+index,
								step => {
									for (let key in value) {
										step[key] = value[key]
									}
								},
								"automerge"
							)
						}
					} else if (kind == "grids") {
						if (key != null) {
							memtree.alterGrid(
								+index,
								grid => {
									grid[key] = value
								},
								"automerge"
							)
						} else {
							memtree.alterGrid(
								+index,
								grid => {
									for (let key in value) {
										grid[key] = value[key]
									}
								},
								"automerge"
							)
						}
					}

					continue
				}
				case "inc": {
					console.error("INC!")
					continue
				}
				case "insert": {
					console.log("INSERT!")
					continue
				}
				case "mark":
				case "unmark": {
					console.error("MARK!")
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
	unlisten = () => {
		dispose()
		handle.off("change", onchange)
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
	loop.layers(
		index => (layers[index] = new Layer(memtree.memory, index).toJSON())
	)
	loop.grids(
		index => (grids[index] = new Grid(memtree.memory, index).toJSON())
	)
	loop.steps(
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
	return handle.url
}

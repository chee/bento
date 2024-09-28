/**
 * @import {Repo, default as AutomergeRepo, AutomergeUrl, DocHandle, DocHandleChangePayload} from "@automerge/automerge-repo"
 */

import Layer from "../memory/tree/layer.js"
import MemoryTree from "../memory/tree/tree.js"

/**
 * @type {Repo}
 */
let repo
/**
 * @type {AutomergeRepo}
 */
let AutomergeRepo

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

export async function init() {
	if (repo) return
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
 * @typedef {Object} CollaborativePattern
 * @prop {import("../memory/tree/layer.js").LayerJSON[]} layers
 * @prop {import("../memory/tree/grid.js").GridJSON[]} grids
 * @prop {import("../memory/tree/step.js").StepJSON[]} steps
 * @prop {(import("../memory/tree/sound.js").SoundJSON & {url: AutomergeUrl})[]} sounds
 * @prop {{bpm: number}} master
 */

/**
 * @type {() => void}
 */
let unlisten

/**
 * @param {AutomergeUrl} url
 * @param {import("../memory/tree/tree.js").default} memtree
 */
export function start(url, memtree) {
	/**
	 * @type {import("@automerge/automerge-repo").DocHandle<CollaborativePattern>}
	 */
	let handle = repo.find(url)
	let dispose = memtree.listen((kind, index) => {
		switch (kind) {
			case "layers": {
				handle.change(
					/**
					 *
					 * @param {CollaborativePattern} pattern
					 */
					pattern => {
						pattern
					}
				)
				return
			}
			case "grids": {
				handle.change(
					/**
					 *
					 * @param {CollaborativePattern} pattern
					 */
					pattern => {
						pattern
					}
				)
				return
			}
			case "steps": {
				handle.change(
					/**
					 *
					 * @param {CollaborativePattern} pattern
					 */
					pattern => {
						pattern
					}
				)
				return
			}
			case "sounds": {
				handle.change(
					/**
					 *
					 * @param {CollaborativePattern} pattern
					 */
					pattern => {
						pattern
					}
				)
				return
			}
			case "master": {
				handle.change(
					/**
					 *
					 * @param {CollaborativePattern} pattern
					 */
					pattern => {
						pattern.master.bpm = memtree.bpm
					}
				)
				return
			}
		}
	})
	/**
	 *
	 * @param {DocHandleChangePayload} change
	 */
	function onchange(change) {
		for (let patch of change.patches) {
			let [kind, index] = patch.path.splice(0, 2)
			console.log({
				kind,
				index,
				action: patch.action,
				value: patch.value || patch.values,
				length: patch.length
			})
			switch (patch.action) {
				case "put": {
					let {value, conflict} = patch
					if (
						kind == "master" &&
						index == "bpm" &&
						typeof patch.value == "number"
					) {
						memtree.bpm = patch.value
					}
					return
				}
				case "del": {
					return
				}
				case "splice": {
					return
				}
				case "inc": {
					return
				}
				case "insert": {
					return
				}
				case "mark":
				case "unmark": {
					return
				}
				case "conflict": {
					console.warn("OH NO A CONFLICT", patch)
					return
				}
			}
		}
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
	/**
	 * @type {DocHandle<CollaborativePattern>}
	 */
	let handle = repo.create(
		/** @satisfies {CollaborativePattern} */ ({
			layers: [],
			grids: [],
			steps: [],
			sounds: [],
			master: {
				bpm: memtree.bpm
			}
		})
	)
	return handle.url
}

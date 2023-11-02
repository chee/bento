import * as Memory from "./memory.js"
export const DB_VERSION = 3

/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

/** @param {SharedArrayBuffer} sab */
export async function init(sab) {
	memory = Memory.map(sab)
	return new Promise((yay, boo) => {
		// indexedDB.deleteDatabase("bento")
		let open = indexedDB.open("bento", DB_VERSION)

		open.onerror = _event => {
			// we don't mind, you just get the old no-save experience
			console.error("🮲🮳", open.error)
			boo(open.error)
		}

		// migrate here
		open.onupgradeneeded = (/** @type {IDBVersionChangeEvent} */ event) => {
			console.debug(
				`migration requires from ${event.oldVersion} to ${event.newVersion}`
			)
			db = open.result
			let store
			if (db.objectStoreNames.contains("pattern")) {
				store = open.transaction.objectStore("pattern")
			} else {
				store = db.createObjectStore("pattern", {
					autoIncrement: false
				})
			}
			for (let name in memory) {
				if (!store.indexNames.contains(name)) {
					store.createIndex(name, name, {unique: false})
				}
			}
			if (!store.indexNames.contains("id")) {
				store.createIndex("id", "id", {unique: true})
			}
		}

		// now we're talking
		open.onsuccess = _event => {
			db = open.result
			console.log("initialized")
			yay(db)
		}
	})
}

/** @param {string} id */
export async function save(id) {
	if (!db || !memory) {
		throw new Error("hey! tried to save before init")
	}
	let trans = db.transaction("pattern", "readwrite", {
		durability: "relaxed"
	})
	let store = trans.objectStore("pattern")
	let object = new ArrayBuffer(Memory.size)
	let map = Memory.map(object)
	// object.id = id
	Memory.save(memory, map)
	store.put(map, id)
	await new Promise(yay => {
		trans.oncomplete = yay
	})
}

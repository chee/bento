import * as Memory from "./memory.js"

/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

/** @type {SharedArrayBuffer} */
let buffer

/**
 * get started
 *
 * @param {SharedArrayBuffer} sab
 * @returns {Promise}
 */
export async function init(sab) {
	buffer = sab
	memory = Memory.map(buffer)
	return new Promise((yay, _boo) => {
		try {
			// indexedDB.deleteDatabase("bento")
			let open = indexedDB.open("bento", 1)
			open.onerror = _event => {
				// we don't mind, you just get the old no-save experience
				console.error("🮲🮳")
			}

			// migrate here
			open.onupgradeneeded = _event => {
				db = open.result
				try {
					let store = db.createObjectStore("box", {
						// keyPath: location.pathname.slice(1) ?? "?",
						autoIncrement: false
					})
					for (let name in memory) {
						store.createIndex(name, name, {unique: false})
					}
					store.createIndex("id", "id", {
						unique: true
					})
				} catch (error) {
					// if they exist it's fine, idk what else can happen
					console.error("woh-oh alert!!!! ", error)
				}
			}

			// now we're talking
			open.onsuccess = _event => {
				db = open.result
				yay(db)
			}
		} catch (error) {
			console.info("why is everyone bullying me :(", error)
		}
	})
}

export async function load(
	id = globalThis.location?.pathname?.slice(1) || "?"
) {
	if (!db || !memory) {
		throw new Error("hey now! tried to load before init")
	}
	try {
		let trans = db.transaction("box", "readonly")
		let store = trans.objectStore("box")
		let object = await new Promise((yay, boo) => {
			let get = store.get(id)
			get.onsuccess = event => yay(get.result)
			get.onerror = error => boo(error)
		})

		if (object) {
			console.info("obje", object)
			console.info("memmy", Memory.map(object))
			Memory.map(buffer, object)
		}
		return object
	} catch (error) {
		console.error("i'm so sorry", error)
	}
}

export async function save(
	id = globalThis.location?.pathname?.slice(1) || "?"
) {
	if (!db || !memory) {
		throw new Error("hey now! tried to load before init")
	}
	let trans = db.transaction("box", "readwrite", {
		// durability: "strict"
	})
	let store = trans.objectStore("box")
	let object = new ArrayBuffer(Memory.size)
	// object.id = id
	store.put(Memory.map(object, memory), id)
}

globalThis.save = save
globalThis.load = load

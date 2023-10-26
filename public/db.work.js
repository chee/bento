import * as Memory from "./memory.js"
// TODO put this in a worker and use Atomics.notify in memory to indicate that a
// change has occured

/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

/** @type {SharedArrayBuffer} */
let buffer

let loaded = false

/** @param {SharedArrayBuffer} sab */
async function init(sab) {
	buffer = sab
	memory = Memory.map(buffer)
	await new Promise((yay, _boo) => {
		try {
			// indexedDB.deleteDatabase("bento")
			let open = indexedDB.open("bento", 2)
			open.onerror = _event => {
				// we don't mind, you just get the old no-save experience
				console.error("🮲🮳")
			}

			// migrate here
			open.onupgradeneeded = _event => {
				db = open.result
				try {
					let store = db.createObjectStore("pattern", {
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

async function load(id = "?", now = true) {
	if (!db || !memory) {
		throw new Error("hey now! tried to load before init")
	}
	try {
		let trans = db.transaction("pattern", "readonly")
		let store = trans.objectStore("pattern")
		let object = await new Promise((yay, boo) => {
			let get = store.get(id)
			get.onsuccess = () => yay(get.result)
			get.onerror = error => boo(error)
		})

		if (object && now) {
			Memory.map(buffer, object)
		}

		return !!object
	} catch (error) {
		console.error("i'm so sorry", error)
	} finally {
		/** um */
		loaded = true
	}
}

function save(id = "?") {
	if (!db || !memory || !loaded) {
		throw new Error("hey now! tried to save before init")
	}
	let trans = db.transaction("pattern", "readwrite", {
		// durability: "strict"
	})
	let store = trans.objectStore("pattern")
	let object = new ArrayBuffer(Memory.size)
	// object.id = id
	store.put(Memory.map(object, memory), id)
}

async function reset(id = "?", message) {
	if (!db || !memory || !loaded) {
		throw new Error("hey now! tried to reset before init")
	}
	let trans = db.transaction("pattern", "readwrite", {
		// durability: "strict"
	})
	let store = trans.objectStore("pattern")
	// TODO put Memory.map(new ArrayBuffer, Memory.fresh)
	// console.log(Memory.map(new ArrayBuffer(Memory.size), memory))
	store.delete(id)
	await new Promise(yay => {
		trans.oncomplete = yay
	})

	// store.put(Memory.fresh(memory))
	// store.clear()
	postMessage(message)
}

onmessage = async event => {
	let message = event.data
	if (message.type == "init") {
		await init(message.buffer)
	}

	if (message.type == "load") {
		await load(message.id, message.now)
	}

	if (message.type == "save") {
		save(message.id)
	}

	if (message.type == "reset") {
		reset(message.id, message)
	}
}

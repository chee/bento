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

/** @param {Object & {buffer: SharedArrayBuffer}} message */
async function init(message) {
	buffer = message.buffer
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
						try {
							store.createIndex(name, name, {unique: false})
						} catch {}
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

async function load({id = "bento"}) {
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

		if (object) {
			Memory.map(buffer, object)
		}
	} catch (error) {
		console.error("i'm so sorry", error)
	} finally {
		/** um */
		loaded = true
	}
}

async function exists({id = "bento"}) {
	if (!db || !memory) {
		throw new Error("hey now! tried to check existence before init")
	}
	try {
		let trans = db.transaction("pattern", "readonly")
		let store = trans.objectStore("pattern")
		let object = await new Promise((yay, boo) => {
			let get = store.get(id)
			get.onsuccess = () => yay(get.result)
			get.onerror = error => boo(error)
		})
		if (object) {
			return true
		} else {
			return false
		}
	} catch (error) {
		console.error("i'm so sorry", error)
	} finally {
		/** um */
		loaded = true
	}
}

async function save({id = "bento"}) {
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
	await new Promise(yay => {
		trans.oncomplete = yay
	})
}

async function reset({id = "bento"}) {
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
}

async function getPatternNames() {
	if (!db || !memory || !loaded) {
		throw new Error("what! tried to getPatternNames before init??")
	}
	let trans = db.transaction("pattern", "readonly", {
		// durability: "strict"
	})
	let store = trans.objectStore("pattern")
	let names = store.getAllKeys()
	await new Promise(yay => {
		trans.oncomplete = yay
	})

	return names.result
}

let fn = {reset, save, exists, init, load, getPatternNames}

onmessage = async event => {
	let message = event.data

	if (fn[message.type]) {
		postMessage({
			...message,
			result: await fn[message.type](message)
		})
	}
}

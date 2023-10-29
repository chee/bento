export let loaded = false
/**
 * @typedef {Object} Message
 * @prop {string} type
 * @prop {string} [id]
 */

import * as Memory from "./memory.js"
/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

/** @param {SharedArrayBuffer} sab */
export async function init(sab) {
	memory = Memory.map(sab)
	await new Promise((yay, boo) => {
		try {
			// indexedDB.deleteDatabase("bento")
			let open = indexedDB.open("bento", 3)
			open.onerror = _event => {
				// we don't mind, you just get the old no-save experience
				console.error("🮲🮳", open.error)
				boo()
			}

			// migrate here
			open.onupgradeneeded = event => {
				console.debug(
					`migration requires from ${event.oldVersion} to ${event.newVersion}`
				)
				db = open.result
				try {
					if (event.newVersion == 2) {
						let store = db.createObjectStore("pattern", {
							autoIncrement: false
						})
						for (let name in memory) {
							try {
								store.createIndex(name, name, {unique: false})
							} catch {
								console.debug(`tried to create already existing ${name}`)
							}
						}
						store.createIndex("id", "id", {
							unique: true
						})
					}
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

export async function load(id = "bento") {
	if (!db || !memory) {
		console.error("hey now! tried to load before init")
		return
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
			Memory.copy(object, memory)
		}
	} catch (error) {
		console.error("i'm so sorry", error)
	} finally {
		/** um */
		loaded = true
	}
}

export async function exists(id = "bento") {
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

export async function save(id = "bento") {
	if (!db || !memory || !loaded) {
		throw new Error("hey now! tried to save before init")
	}
	let trans = db.transaction("pattern", "readwrite", {
		// durability: "strict"
	})
	let store = trans.objectStore("pattern")
	let object = new ArrayBuffer(Memory.size)
	let map = Memory.map(object)
	// object.id = id
	Memory.copy(memory, map)
	store.put(map, id)
	await new Promise(yay => {
		trans.oncomplete = yay
	})
}

export async function reset(id = "bento") {
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

export async function getPatternNames() {
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

export function getSlugFromLocation() {
	return (
		(typeof window != "undefined" &&
			window.location?.pathname.match(RegExp("patterns/([^/]+)"))?.[1]) ||
		"bento"
	)
}

function randomWord() {
	let vowels = "aeiou".split("")
	let consonants = "bcdfghjklmnpqrstvwxyz".split("")
	return (
		consonants.random() +
		vowels.random() +
		consonants.random() +
		vowels.random() +
		consonants.random()
	)
}

export function generateRandomSlug() {
	return randomWord() + "-" + randomWord()
}

export function slugify(name = "") {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9+=~@]/g, "-")
		.replace(/-:[:a-z0-9]+:$/g, "")
		.replace(/-+/g, "-")
		.replace(/(^\-|\-$)/, "")
}

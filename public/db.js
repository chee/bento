export const DB_VERSION = 3

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

export async function load(slug = getSlugFromLocation()) {
	if (!db || !memory) {
		console.error("hey now! tried to load before init")
		return
	}
	try {
		let trans = db.transaction("pattern", "readonly")
		let store = trans.objectStore("pattern")
		let object = await new Promise(yay => {
			let get = store.get(slug)
			get.onsuccess = () => yay(get.result)
			get.onerror = error => {
				console.error(error)
				yay()
			}
		})

		if (object) {
			Memory.load(memory, object)
		} else {
			console.debug("fresh start :)")
		}
	} catch (error) {
		console.error("i'm so sorry", error)
	} finally {
		/** um */
		loaded = true
	}
}

export async function exists(id = getSlugFromLocation()) {
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
		return false
	} finally {
		/** um */
		loaded = true
	}
}

export async function save(id = getSlugFromLocation()) {
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
	Memory.save(memory, map)
	store.put(map, id)
	await new Promise(yay => {
		trans.oncomplete = yay
	})
}

export async function reset(id = getSlugFromLocation()) {
	if (!db || !memory || !loaded) {
		throw new Error("hey now! tried to reset before init")
	}
	let trans = db.transaction("pattern", "readwrite", {
		// durability: "strict"
	})
	let store = trans.objectStore("pattern")
	store.delete(id)
	await new Promise(yay => {
		trans.oncomplete = yay
	})
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

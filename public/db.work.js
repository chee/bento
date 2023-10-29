export let loaded = false

import {DB_VERSION} from "./db.const.js"
import * as Memory from "./memory.js"
import migrations from "./migrations.js"

/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

/** @type {SharedArrayBuffer} */
let sharedarraybuffer

/** @param {Object & {buffer: SharedArrayBuffer}} message */
export async function init(message) {
	sharedarraybuffer = message.buffer

	memory = Memory.map(sharedarraybuffer)

	await new Promise((yay, _boo) => {
		try {
			indexedDB.deleteDatabase("bento")
			let open = indexedDB.open("bento", 2)

			// let open = indexedDB.open("bento", DB_VERSION)
			open.onerror = _event => {
				// we don't mind, you just get the old no-save experience
				// throw new Error(open.error)
				throw open.error
			}

			/** @type Promise[] */
			// let migrationPromises = []

			// migrate here
			open.onupgradeneeded = event => {
				console.info(
					`db upgrade required: ${event.oldVersion} ${event.newVersion}`
				)
				db = open.result

				for (let migrate of migrations.slice(
					event.oldVersion,
					event.newVersion
				)) {
					migrate(open.transaction, open.result)
				}
			}

			// now we're talking
			open.onsuccess = _event => {
				db = open.result
				// await Promise.all(migrationPromises)
				yay(db)
			}
		} catch (error) {
			console.info("why is everyone bullying me :(", error)
		}
	})
}

export async function load(id = getSlugFromLocation()) {
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
			Memory.copy(object, memory)
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
	let localbuffer = new ArrayBuffer(Memory.size)

	let localmap = Memory.map(localbuffer)
	Memory.copy(memory, localmap)
	localmap.master.set([DB_VERSION], Memory.Master.dbVersion)
	store.put(localmap, id)

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

import * as share from "./db.share.js"
import * as Memory from "./memory.js"

/** @type {IDBDatabase} */
let db
/** @type {Memory.MemoryMap} */
let memory

let worker = new Worker("/db.work.js", {type: "module"})

/** @param {SharedArrayBuffer} sab */
export async function init(sab) {
	memory = Memory.map(sab)
	db = await share.init(sab)
	worker.postMessage({
		type: "init",
		sharedarraybuffer: sab
	})
}

/**
 * @returns {Promise<Memory.MemoryMap>}
 */
async function get(slug = getSlugFromLocation()) {
	if (!db || !memory) {
		console.error("hey now! tried to get before init")
		return
	}
	let fresh = Memory.fresh()
	return new Promise(async (yay, boo) => {
		let trans = db.transaction("pattern", "readonly")
		let store = trans.objectStore("pattern")
		let get = store.get(slug)
		get.onsuccess = () => {
			if (get.result) {
				Memory.load(fresh, get.result)
			}
			yay(fresh)
		}
		get.onerror = error => {
			console.error("i'm so sorry", error)
			boo(error)
		}
	})
}

export async function load(slug = getSlugFromLocation()) {
	if (!db || !memory) {
		console.error("well now come now.. tried to load before init")
		return
	}

	let object = (await get(slug).catch(() => Memory.fresh())) || Memory.fresh()
	Memory.load(memory, object)
	alreadyFancy = true
}

let alreadyFancy = false

export function fancy() {
	return alreadyFancy
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
		alreadyFancy = true
	}
}

export function save(id = getSlugFromLocation()) {
	worker.postMessage({
		type: "save",
		id
	})
}

export async function reset(id = getSlugFromLocation()) {
	if (!db || !memory || !alreadyFancy) {
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
	if (!db || !memory || !alreadyFancy) {
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

export let loaded = false

let worker = new Worker("/db.work.js", {type: "module"})
/**
 * @typedef {Object} Message
 * @prop {string} type
 * @prop {string} [id]
 */

/**
 * @template {Message & {hash?: string} & Record<string, any>} Msg
 * @param {Msg} message
 */
async function post(message) {
	let hash = Math.random().toString(16).slice(2, 10)
	message.hash = hash
	// todo timeout
	let done = new Promise(yay => {
		worker.addEventListener("message", event => {
			let msg = event.data
			if (
				msg.type == message.type &&
				msg.id == message.id &&
				msg.hash == message.hash
			) {
				yay(msg.result)
			}
		})
	})
	worker.postMessage(message)
	return done
}

/**
 * get started
 *
 * @param {SharedArrayBuffer} sab
 * @returns {Promise}
 */
export async function init(sab) {
	return post({
		type: "init",
		buffer: sab
	})
}

export async function load(id = getSlugFromLocation()) {
	await post({
		type: "load",
		id
	})
	loaded = true // haha
}

export async function exists(id = getSlugFromLocation()) {
	return await post({
		type: "exists",
		id
	})
}

export async function save(id = getSlugFromLocation()) {
	return post({
		type: "save",
		id
	})
}

export async function reset(id = getSlugFromLocation()) {
	return post({type: "reset", id})
}

export async function getPatternNames() {
	return post({type: "getPatternNames"})
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

// TODO put this in a worker and use Atomics.notify in memory to indicate that a
// change has occured

export let loaded = false

export function getIdFromLocation() {
	return (
		(typeof window != "undefined" &&
			window.location?.pathname.match(RegExp("patterns/([^/]+)"))?.[1]) ||
		"?"
	)
}

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

export async function load(id = getIdFromLocation()) {
	await post({
		type: "load",
		id
	})
	loaded = true // haha
}

export async function exists(id = getIdFromLocation()) {
	return await post({
		type: "exists",
		id
	})
}

export async function save(id = getIdFromLocation()) {
	return post({
		type: "save",
		id
	})
}

export async function reset(id = getIdFromLocation()) {
	return post({type: "reset", id})
}

export async function getPatternNames() {
	return post({type: "getPatternNames"})
}

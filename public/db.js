// TODO put this in a worker and use Atomics.notify in memory to indicate that a
// change has occured

export let loaded = false

function getId() {
	return (
		(typeof window != "undefined" &&
			window.location?.pathname.match(RegExp("patterns/([^/]+)"))?.[1]) ||
		"?"
	)
}
let worker = new Worker("/db.work.js", {type: "module"})
/**
 * get started
 *
 * @param {SharedArrayBuffer} sab
 * @returns {Promise}
 */
export async function init(sab) {
	worker.postMessage({
		type: "init",
		buffer: sab
	})
}

export async function load(id = getId(), now = true) {
	worker.postMessage({
		type: "load",
		id,
		now
	})
	loaded = true
	// haha
}

export async function save(id = getId()) {
	worker.postMessage({
		type: "save",
		id
	})
}

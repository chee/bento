/*
 * Save to indexeddb
 */
export async function save(memory) {
	let request = globalThis.indexedDB.open("db", 1)
	return new Promise((yay, boo) => {
		request.onerror = boo
		request.onsuccess = yay
	})
}

export function load(memory) {}

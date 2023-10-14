export default class Angel extends EventTarget {
	herald(name, detail) {
		this.dispatchEvent(new CustomEvent(name, {detail}))
	}
	hark(name, cb, opts) {
		function callback(event) {
			cb(event.detail)
		}
		this.addEventListener(name, callback, opts)
		return function cease() {
			this.removeEventListener(name, callback)
		}
	}
}

let serviceWorker = null
export async function init() {
	return new Promise((yay, boo) => {
		try {
			serviceWorker = navigator.serviceWorker.register("/service-worker.js", {
				type: "module",
			})
			yay(serviceWorker)
		} catch (error) {
			boo(error)
		}
	})
}

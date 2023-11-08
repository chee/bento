import * as share from "./share.js"

onmessage = event => {
	let message = event.data
	if (message.type == "init") {
		share.init(message.sharedarraybuffer)
	}
	if (message.type == "save") {
		share.save(message.id)
	}
}

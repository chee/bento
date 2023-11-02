import * as share from "./db.share.js"

onmessage = async event => {
	let message = event.data
	if (message.type == "init") {
		await share.init(message.sharedarraybuffer)
	}
	if (message.type == "save") {
		await share.save(message.id)
	}
}

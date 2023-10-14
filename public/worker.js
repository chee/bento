let wrap = (n, top, bottom = 0) => (++n > top ? bottom : n)
let bpm2samplesPerBeat = (bpm, sampleRate) => (60 / bpm) * sampleRate
let bpm2spqn = (bpm, sampleRate) => bpm2samplesPerBeat(bpm, sampleRate) / 4

let buffer
let memory
let Memory

function handleMessage(message) {
	if (message.type == "bpm") {
		Memory.bpm(memory, message.value)
	}
	if (message.type == "play") {
		Memory.playing(memory, true)
	}
	if (message.type == "pause") {
		Memory.playing(memory, false)
	}
	if (message.type == "stop") {
		Memory.playing(memory, false)
		for (let channel in [0, 1, 2, 3]) {
			Memory.currentStep(memory, channel, 0)
		}
	}
}

onmessage = async event => {
	if (typeof Memory == "undefined") {
		Memory = await import("./memory.js")
	}
	let message = event.data
	if (message.type == "memory") {
		buffer = message.buffer
		memory = Memory.map(buffer)
		Memory.bpm(memory, 120)
		for (let channel in [0, 1, 2, 3]) {
			Memory.channelSpeed(memory, channel, 1)
		}
	} else {
		handleMessage(message)
	}
}

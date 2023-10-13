let wrap = (n, top, bottom = 0) => (++n > top ? bottom : n)
let bpm2mspqn = bpm => 60000 / bpm / 4
let bpm2tick = bpm => bpm2mspqn(bpm) / 16

let buffer
let memory
let interval
let Memory

let messages = []
let tick = 0
let maxTick = 16 * 4 * 4 - 1

let tick2step = tick => (tick / 16) | 0

function next() {
	while (messages.length) {
		handleMessage(messages.shift())
	}

	if (Memory.playing(memory)) {
		tick = wrap(tick + 1, maxTick)
	}

	let step = tick2step(tick)

	if (step != Memory.currentStep(memory)) {
		Memory.currentStep(memory, step)
	}
	setTimeout(next, bpm2tick(Memory.bpm(memory)))
}

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
		tick = 0
		Memory.playing(memory, false)
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
		Memory.bpm(memory, 96)
		next()
	} else {
		messages.push(message)
	}
}

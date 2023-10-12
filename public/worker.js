let wrap = (n, top, bottom = 0) => (++n > top ? bottom : n)
let bpm2mspqn = bpm => 60000 / bpm / 4

let buffer
let memory
let interval
let Memory

function start() {
	return setInterval(() => {
		let step = memory.current_step.at(0)
		memory.current_step.set([wrap(step, 15)])
	}, bpm2mspqn(memory.bpm.at(0)))
}

onmessage = async event => {
	if (typeof Memory == "undefined") {
		Memory = await import("./memory.js")
	}
	if (event.data.type == "memory") {
		buffer = event.data.buffer

		memory = Memory.map(buffer)
		interval = start()
	}
	if (event.data.type == "bpm") {
		clearInterval(interval)
		interval = start()
	}
}

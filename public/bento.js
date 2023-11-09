import * as sounds from "./sounds/sounds.js"
import * as graphics from "./graphics/graphics.js"
import {size as MEMORY_SIZE, map} from "./memory/memory.js"
import MemoryTree from "./memory/tree/tree.js"
import * as db from "./db/db.js"
import Ask from "./io/ask.js"

let sharedarraybuffer = new SharedArrayBuffer(MEMORY_SIZE)

let memtree = MemoryTree.from(sharedarraybuffer)
let party = document.querySelector("bento-party")
let ask = new Ask(document.querySelector("dialog"))

let fancyListeners = ["keydown", "click", "touchstart"]

if (history.scrollRestoration) {
	history.scrollRestoration = "manual"
}

async function getFancy() {
	if (party.fancy) {
		return
	}
	try {
		if (!db.fancy()) {
			await db.load()
			if (sounds.empty()) {
				await sounds.loadDefaultKit()
			}
		}
		if (!sounds.fancy()) {
			await sounds.start()
		}

		if (sounds.fancy() && !graphics.fancy()) {
			graphics.start(sharedarraybuffer)
		}

		if (sounds.fancy() && graphics.fancy() && db.fancy()) {
			party.fancy = true
		}
	} catch {}

	if (party.fancy) {
		// if (!party.isSettingsOpen()) {
		setTimeout(() => {
			openScreen()
		}, 200)
		// }
		let slug = db.slugify(db.getSlugFromLocation())
		history.replaceState(
			{slug},
			"",
			slug == "bento"
				? "/" + location.search
				: `/patterns/${slug}/` + location.search
		)
		party.slug = slug
		party.tree = memtree
		memtree.listen(() => {
			party.tree = memtree
		})
		// todo delay the request animation frame by bpm/60/4/2 maybe
		// ;(async function updateCurrentStep() {
		// 	// todo no exist in firefox
		// 	// await memtree.waitAsync()
		// 	// setTimeout(() => requestAnimationFrame(updateCurrentStep), 100)
		// })()
	}
}

globalThis.update = event => {
	party.selectedLayerCurrentGridIndex = memtree.selectedLayerCurrentGrid
	party.selectedLayerCurrentStepIndex = memtree.selectedLayerCurrentStep
	party.selectedLayerCurrentGridStepIndex =
		memtree.selectedLayerCurrentGridStep
}

fancyListeners.map(name =>
	window.addEventListener(name, getFancy, {
		passive: true
	})
)

async function init() {
	await db.init(sharedarraybuffer)
	await graphics.init()
	await sounds.init(sharedarraybuffer)
}

await init()
getFancy()

party.when("play", () => {
	memtree.play()
	// todo base this on memtree.update() in sounds.js
	sounds.play()
})

party.when("pause", () => {
	memtree.pause()
	sounds.pause()
})

party.when("stop", () => {
	memtree.stop()
	sounds.pause()
})

party.when("set-bpm", message => {
	memtree.bpm = message.value
	// todo base these saves on memtree.update() in db.js
	db.save()
})

party.when("select-layer", index => {
	memtree.selectedLayer = index
	db.save()
})

party.when("update-grid", message => {
	memtree.alterGrid(message.grid.index, grid => {
		grid[message.property] = message.value
	})
	db.save()
})

party.when("select-grid", indexInLayer => {
	memtree.alterSelected("layer", layer => {
		layer.selectedGrid = indexInLayer
	})
	db.save()
})

party.when("copy-grid", message => {
	memtree.alterGrid(message.to, grid => {
		grid.paste()
	})
	memtree.copyGrid(memtree.selectedLayer, message.from, message.to)
	db.save()
})

party.when("toggle-grid", index => {
	memtree.alterGrid(index, grid => {
		grid.toggle()
	})
	db.save()
})

party.when("start-recording", async () => {
	// todo stopPropagation in party:)
	// if (party.hasAttribute("recording")) {
	// 		return
	// 	}
	//
	party.recording = true
	let audio = await sounds.recordSound()
	memtree.alterSound(memtree.selectedLayer, sound => {
		sound.audio = audio
	})
	db.save()
})

party.when("set-sound", async message => {
	let audio = await sounds.decode(message.audio)
	memtree.alterSound(memtree.selectedLayer, sound => {
		sound.audio = audio
	})
	db.save()
})

party.when("flip-sound", async message => {
	memtree.alterSound(message.soundIndex, sound => {
		sound.flip()
	})
	db.save()
})

party.when("clip-sound", message => {
	let from = message.from
	memtree.alterSound(message.soundIndex, sound => {
		sound.clip(from.start, from.end)
	})
	db.save()
})

/** TODO this is the screen's business */
// /** @param {Memory.MousePoint} mouse */
// function getMixFromMouse(mouse) {
// 	let pan = Math.round((mouse.x / screen.canvas.width) * 12 - 6)
// 	let quiet = Math.round((mouse.y / screen.canvas.height) * 12)
// 	return {pan, quiet}
// }

// party.hark("mouse", message => {
// 	if (!("screen" in message)) {
// 		return
// 	}
// 	if (message.screen == "wav") {
// 		if (message.type == "start") {
// 			Memory.drawingRegionStart(memory, message.mouse.x)
// 		} else if (message.type == "move") {
// 			Memory.drawingRegionX(memory, message.mouse.x)
// 		} else if (message.type == "end") {
// 			Memory.drawingRegionEnd(memory, message.mouse.x)
// 			db.save()
// 		}
// 	} else if (message.screen == "mix") {
// 		let {pan, quiet} = getMixFromMouse(message.mouse)
// 		let deets = Memory.getSelectedStepDetails(memory)
// 		Memory.stepQuiet(memory, deets.layer, deets.step, quiet)
// 		Memory.stepPan(memory, deets.layer, deets.step, pan)
// 		if (message.type == "end") {
// 			db.save()
// 		}
// 	} else if (message.screen == "key") {
// 		let deets = Memory.getSelectedStepDetails(memory)
// 		Memory.stepPitch(
// 			memory,
// 			deets.layer,
// 			deets.step,
// 			Math.round(
// 				(message.mouse.x / screen.canvas.width) * Memory.NUMBER_OF_KEYS
// 			) -
// 				Memory.NUMBER_OF_KEYS / 2
// 		)
// 		if (message.type == "end") {
// 			db.save()
// 		}
// 	}
// })

party.when("select-step", index => {
	memtree.selectedUiStep = index
	db.save()
})

party.when("update-step", message => {
	memtree.alterStep(message.index, step => {
		step[message.property] = message.value
	})
	db.save()
})

party.when("toggle-step", index => {
	memtree.alterStep(index, step => {
		step.toggle()
	})
	db.save()
})

party.when("turn-step-on", index => {
	memtree.alterStep(index, step => {
		step.toggle(true)
	})
	db.save()
})

party.when("turn-step-off", index => {
	memtree.alterStep(index, step => {
		step.toggle(false)
		db.save()
	})
})

party.when("flip-step", index => {
	memtree.alterStep(index, step => {
		step.flip()
	})
	db.save()
})

party.when("copy-step", message => {
	memtree.alterStep(message.to, step => {
		step.paste(memtree.getStep(message.from))
	})
	db.save()
})

party.when("step-softly", index => {
	memtree.alterStep(index, step => {
		step.quieter()
	})
	db.save()
})

party.when("step-loudly", index => {
	memtree.alterStep(index, step => {
		step.louder()
	})
	db.save()
})

party.when("pan-step-left", index => {
	memtree.alterStep(index, step => {
		step.lefter()
	})
	db.save()
})

party.when("pan-step-right", index => {
	memtree.alterStep(index, step => {
		step.righter()
	})
	db.save()
})

// todo fire this on the party in sounds
window.onmessage = function (event) {
	let message = event.data
	if (message.type == "recording") {
		let recording = event.data.recording
		party.toggleAttribute("recording", recording)
		party.recording = true
		party.recordingLength = event.data.length
		document.dispatchEvent(new CustomEvent("recording", {detail: message}))
	}
}

let stepWaveformCanvas = document.createElement("canvas")

// todo maybe keep this in the bento grid?
// maybe all this?
let stepWaveformUrlCache = {}
document.addEventListener(
	"waveform",
	/**
	 * @param {CustomEvent & {detail: {imageData: ImageData}}} event
	 */
	async ({detail}) => {
		/** @type {ImageBitmap} */
		let bmp = detail.bmp
		let {layer, uiStep, grid, cachename} = detail
		if (layer != memtree.selectedLayer) return
		if (grid != memtree.getSelectedLayer().selectedGrid) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height

		// does i need to make a state tree that combines values from memtree to
		// create a single state tree?
		// let box = boxes[uiStep]
		if (!stepWaveformUrlCache[cachename]) {
			let context = stepWaveformCanvas.getContext("bitmaprenderer")
			context.transferFromImageBitmap(bmp)
			stepWaveformUrlCache[cachename] =
				stepWaveformCanvas.toDataURL("image/webp")
		}

		let box = party.machine.grid.boxes[uiStep]
		box.wav = stepWaveformUrlCache[cachename]
	}
)

// todo move below to some kind of machine/settings.js

party.when("toggle-settings", () => {
	party.settings.open = !party.settings.open
	setTimeout(() => {
		party.screen.open = !party.settings.open
	})
})

function openScreen() {
	party.settings.open = false
	party.machine.screen.open = true
	// todo
	// party.openScreen()
}

// this is for party to handle
// party.screen.hark("screen", openScreen)
// party.screen.hark("open", openScreen)
// party.layerSelector.hark("click", openScreen)
// party.grid.hark("click", openScreen)

party.settings.when("reset", async () => {
	let ok = await ask.confirm(
		"this will delete the current pattern from your disk FOREVER. ok?"
	)

	if (ok) {
		await db.reset()
		location.reload()
	}
})

addEventListener("popstate", async () => {
	let slug = history.state?.slug || "bento"
	await db.load(slug)
	party.slug = slug
})

async function saveAs(/** @type {string} */ name) {
	if (!name) {
		name = await ask.prompt("enter a name")
	}
	if (name) {
		let slug = db.slugify(name)
		if (slug == db.getSlugFromLocation()) {
			await ask.alert(
				`you are looking at ${slug} right now!<br> bento autosaves btw`
			)
			return
		}
		if (slug) {
			if (await db.exists(slug)) {
				let ok = ask.confirm(
					`already pattern called ${slug}. this wil overwrite. ok?`
				)
				if (!ok) {
					return saveAs(name)
				}
			}
			db.save(slug)

			history.pushState(
				{slug},
				"",
				slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
			)
			party.slug = slug
			openScreen()
		}
	}
}

async function loadPattern() {
	let names = await db.getPatternNames()
	let slug = await ask.select(
		"select a pattern",
		...names.map(n => n.toString())
	)
	if (slug) {
		await db.load(slug)
		history.pushState(
			{slug},
			"",
			slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
		)
		party.slug = slug
		openScreen()
	}
}

async function renamePattern() {
	let currentSlug = db.getSlugFromLocation()
	await saveAs()
	db.reset(currentSlug)
}

async function newPattern() {
	let slug = db.generateRandomSlug()
	history.pushState(
		{slug},
		"",
		slug == "bento" ? "/" : `/patterns/${slug}/` + location.search
	)
	await db.load(slug)
	await sounds.loadDefaultKit()
	party.slug = slug
	openScreen()
}

party.settings.when("load-pattern", async () => {
	await loadPattern()
})

party.settings.when("save-as", async () => {
	await saveAs()
})

party.settings.when("new-pattern", async () => {
	await newPattern()
})

party.settings.when("rename-pattern", async () => {
	await renamePattern()
})

let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	document.documentElement.setAttribute(flag, value)
}

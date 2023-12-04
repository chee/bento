import * as sounds from "./sounds/sounds.js"
import * as graphics from "./graphics/graphics.js"
import {
	size as MEMORY_SIZE,
	grid2layerGrid,
	map,
	step2gridStep
} from "./memory/memory.js"
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
		// this is currently taken care of in sound.js
		// ;(async function updateCurrentStep() {
		// 	// todo no exist in firefox
		// 	// await memtree.waitAsync()
		// 	// setTimeout(() => requestAnimationFrame(updateCurrentStep), 100)
		// })()
	}
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

party.when("set-bpm", bpm => {
	memtree.bpm = bpm
	db.save()
})

party.gridControls.when("set-layer-speed", message => {
	memtree.alterLayer(message.index, layer => {
		layer.speed = message.value
	})
	db.save()
})

party.gridControls.when("set-grid-loop", message => {
	memtree.alterGrid(message.index, grid => {
		grid.loop = message.value
	})
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

party.when("select-grid", index => {
	memtree.alterSelected("layer", layer => {
		layer.selectedGrid = grid2layerGrid(index)
	})
	db.save()
})

party.when("copy-grid", message => {
	memtree.alterGrid(message.to, grid => {
		grid.paste(memtree.getGrid(message.from))
	})

	db.save()
})

party.when("toggle-grid", index => {
	memtree.alterGrid(index, grid => {
		let activeGrids = memtree.getActiveGridIndices(grid.layerIndex)
		if (activeGrids.length <= 1 && grid.on) {
			return
		}
		grid.toggle()
	})
	db.save()
})

customElements.whenDefined("bento-screen-controls").then(() => {
	party.screen.controls.when("record", async () => {
		// todo stopPropagation in party:)
		if (party.recording) {
			return
		}
		let info = await sounds.recordSound()
		party.startRecording(info)
		let audio = await info.audio
		memtree.alterSound(memtree.selectedLayer, sound => {
			sound.audio = audio
		})
		party.recording = false
		db.save()
	})

	party.screen.when("set-sound", async message => {
		let audio = await sounds.decode(message.audio)
		memtree.alterSound(memtree.selectedLayer, sound => {
			sound.audio = audio
		})
		db.save()
	})

	party.screen.when("flip-sound", async index => {
		memtree.alterSound(memtree.selectedLayer, sound => {
			sound.flip()
		})
		db.save()
	})

	party.screen.when("clip-sound", message => {
		let from = memtree.getStep(message.from)
		memtree.alterSound(memtree.selectedLayer, sound => {
			sound.clip(from.start, from.end)
		})
		memtree.clearRegions(memtree.selectedLayer)
		db.save()
	})

	party.screen.controls.when("flip", message => {
		memtree.alterStep(memtree.selectedStep, step => {
			step.flip()
		})
		db.save()
	})

	party.screen.controls.when("loop", message => {
		memtree.alterStep(memtree.selectedStep, step => {
			step.loop = message
		})
		db.save()
	})

	party.screen.controls.when("ctrl", message => {
		memtree.alterStep(memtree.selectedStep, step => {
			if (step.state == "off" || step.state == "on") {
				step.state = "ctrl"
			} else {
				step.state = "off"
			}
		})
		db.save()
	})
})

party.when("select-layer-type", message => {
	memtree.alterLayer(message.layer, layer => {
		layer.type = message.type
	})
	db.save()
})

party.screen.when("drawing-region-start", x => {
	memtree.startDrawingRegion(x)
	db.save()
})

party.screen.when("drawing-region-x", x => {
	memtree.drawingRegionX = x
	db.save()
})

party.screen.when("drawing-region-end", x => {
	memtree.finishDrawingRegion(x)
	db.save()
})

party.screen.when("set-pan", pan => {
	memtree.alterStep(memtree.selectedStep, step => {
		step.pan = pan
	})
	db.save()
})

party.screen.when("set-quiet", quiet => {
	memtree.alterSelected("step", step => {
		step.quiet = quiet
	})
	db.save()
})

party.screen.when("set-pitch", pitch => {
	memtree.alterSelected("step", step => {
		step.pitch = pitch
	})
	db.save()
})

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

party.grid.when("copy-step", message => {
	memtree.alterStep(message.to, step => {
		step.paste(memtree.getStep(message.from))
	})
	memtree.selectedUiStep = step2gridStep(message.to)
	party.grid.boxes[memtree.selectedUiStep].focus()
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
		let {layer, uiStep, grid} = detail
		if (layer != memtree.selectedLayer) return
		if (grid != memtree.getSelectedLayer().selectedGrid) return
		stepWaveformCanvas.width = bmp.width
		stepWaveformCanvas.height = bmp.height
		let cachename = detail.cachename + `slug${party.slug}`

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
	party.tree = memtree
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
			party.tree = memtree
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
		party.tree = memtree
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
	party.tree = memtree
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

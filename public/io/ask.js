function form(
	/** @type string */ title,
	/** @type HTMLElement[] */ ...controls
) {
	let form = document.createElement("form")
	form.method = "dialog"
	let fieldset = document.createElement("fieldset")
	let legend = document.createElement("legend")
	legend.textContent = title
	fieldset.append(legend)
	form.append(fieldset)
	for (let control of controls) {
		fieldset.appendChild(control)
	}
	return form
}

function button(/** @type string */ value, focus = false, className = "") {
	let button = document.createElement("button")
	button.value = value
	button.name = value
	button.textContent = value
	button.className = className
	if (focus) {
		button.autofocus = true
	}
	return button
}

function text(/** @type string */ name, placeholder = "") {
	let input = document.createElement("input")
	input.type = "text"
	input.placeholder = placeholder
	input.name = name
	return input
}

function select(/** @type string */ name, /** @type string[] */ ...choices) {
	let select = document.createElement("select")
	select.name = name
	for (let choice of choices) {
		let option = document.createElement("option")
		// option.value = choice
		option.textContent = choice
		select.append(option)
	}
	return select
}

export default class Ask {
	constructor(/** @type HTMLDialogElement */ dialog) {
		this.dialog = dialog
	}

	#ask() {
		this.dialog.showModal()
		return new Promise(yay => {
			this.dialog.addEventListener("close", () => {
				yay(this.dialog.returnValue)
			})
		})
	}

	#setContent(/** @type HTMLFormElement */ content) {
		this.dialog.textContent = ""
		this.dialog.append(content)
	}

	async alert(msg = "ok?", ok = ":)") {
		this.#setContent(form(msg, button(ok, true)))
		let response = await this.#ask()
		return response == ok
	}

	async confirm(msg = "sure?", n = ":(", y = ":)") {
		this.#setContent(form(msg, button(n), button(y, true)))
		let response = await this.#ask()
		return response == y
	}

	async select(msg = "which?", /** @type string[]*/ ...choices) {
		this.#setContent(form(msg, select("select", ...choices), button("ok")))
		let response = await this.#ask()
		if (response == "ok") {
			let select = this.dialog.querySelector("select")
			let val = select.value
			return val
		}
		return null
	}

	async prompt(msg = "which?", placeholder = "type text...") {
		this.#setContent(form(msg, text("name", placeholder), button("ok")))
		let response = await this.#ask()
		if (response == "ok") {
			let input = this.dialog.querySelector("input")
			let val = input.value
			return val
		}
		return null
	}
}

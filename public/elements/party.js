import {bentoElements, BentoElement} from "./base.js"

export default bentoElements.define(
	"bento-party",
	class BentoParty extends BentoElement {
		connectedCallback() {
			let root = document.documentElement
			root.removeAttribute("loading")
			let themeObserver = new MutationObserver(changes => {
				for (let change of changes) {
					if (change.type == "attributes") {
						if (change.attributeName == "theme") {
							this.announce("theme", root.getAttribute("theme"))
						}
					}
				}
			})

			themeObserver.observe(root, {
				attributes: true,
				attributeFilter: ["theme"]
			})

			// todo create these rather than find them
			this.nav = this.querySelector("bento-nav")
			this.machine = this.querySelector("bento-machine")
			this.tape = this.querySelector("bento-tape")
		}

		set fancy(val) {
			this.set("fancy", val == null ? true : val, () => {
				this.toggleAttribute("fancy", this.get("fancy"))
			})
		}

		get fancy() {
			return this.getAttribute("fancy") == "fancy"
		}

		set slug(val) {
			this.nav.slug = val
		}

		get slug() {
			return this.nav.slug
		}
	}
)

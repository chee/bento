/** @typedef {
"flip"|"play"|"pause"|"stop"|"poweroff"|"tape"|"record"|"loop"|"unknown"
} IconName */

/** @type {Map<IconName, SVGElement>} */
let icons = new Map()
for (let svg of Array.from(document.querySelectorAll("svg"))) {
	let name = /** @type IconName */ (svg.dataset.icon || "unknown")
	icons.set(name, svg)
}
export default icons

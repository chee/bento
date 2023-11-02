/**
 * @param {DataTransfer} dt
 * @returns {Promise<number|null>}
 */
export async function getStep(dt) {
	for (let item of Array.from(dt.items)) {
		if (item.type == "text/plain") {
			return new Promise(yay => {
				item.getAsString(string => {
					let step = string.match(/\bstep\s+(\d+)/)?.[1]
					yay(step ? Number(step) : null)
				})
			})
		}
	}
}

/**
 * @param {DataTransfer} dt
 * @returns {Promise<boolean>}
 */
export async function isStep(dt) {
	return getStep(dt) != null
}

/**
 * @param {DataTransfer} dt
 * @param {number} step
 */
export function setStep(dt, step) {
	dt.setData("text/plain", `step ${step}`)
	// TODO make this a special file format containing all the step info
	// (maybe a .wav with cue points + instrument info)
}

/**
 * @param {DataTransfer} dt
 * @returns {Promise<number|null>}
 */
export async function getGrid(dt) {
	for (let item of Array.from(dt.items)) {
		if (item.type == "text/plain") {
			return new Promise(yay => {
				item.getAsString(string => {
					let grid = string.match(/\bgrid\s+(\d+)/)?.[1]
					yay(grid ? Number(grid) : null)
				})
			})
		}
	}
}

/**
 * @param {DataTransfer} dt
 * @returns {Promise<boolean>}
 */
export async function isGrid(dt) {
	return getGrid(dt) != null
}

/**
 * @param {DataTransfer} dt
 * @param {number} grid
 */
export function setGrid(dt, grid) {
	dt.setData("text/plain", `grid ${grid}`)
	// TODO make this a special file format containing all the grid info
	// (maybe a .wav with cue points + instrument info)
}

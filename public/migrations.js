import * as Memory from "./memory.js"

/**
 * @typedef {Object} MemoryDataMigration
 * @prop {"data"} type
 * @prop {(...any: any) => any} migrate
 */

/**
 * @typedef {Object} DatabaseAddMigration
 * @prop {"add"} type
 */

/**
 * @typedef {Object} DatabaseRenameMigration
 * @prop {"rename"} type
 * @prop {string} from
 * @prop {string} to
 */

/**
 * @typedef {
		DatabaseAddMigration
		| DatabaseRenameMigration
		| MemoryDataMigration
	} MigrationInfo
 */

function gatherMigrationsFromMemory(/** @type number */ version) {
	let info = Memory.arrays
		.map(array => {
			return {
				name: array.name,
				type: array.type,
				/** @type {MigrationInfo[]} */
				operations: array.migrations?.[version]
			}
		})
		.filter(info => info.operations?.length)
	return info
}

/** @type {(trans: IDBObjectStore, version: number) => void} */
function migrate(store, version) {
	let migrations = gatherMigrationsFromMemory(version)
	for (let migration of migrations) {
		for (let operation of migration.operations) {
			if (operation.type == "add") {
				store.createIndex(migration.name, migration.name, {
					unique: false
				})
			} else if (operation.type == "rename") {
				// try to rename, and make it fresh if you cannot
				try {
					store.index(operation.from).name = operation.to
				} catch {
					store.createIndex(operation.to, operation.to, {
						unique: false
					})
				}
			} // data migrations are handled in memory.js during load
		}
	}
}

/** @type {((trans: IDBTransaction, db: IDBDatabase) => void)[]} */
export default [
	/* from 0 to 1 */
	(_trans, db) => {
		db.createObjectStore("pattern", {
			autoIncrement: false
		})
	},
	/* from 1 to 2 */
	function from1to2(trans) {
		let store = trans.objectStore("pattern")
		migrate(store, 2)
		store.createIndex("id", "id", {
			unique: true
		})
	},
	/* from 2 to 3 */
	function from2to3(trans) {
		let store = trans.objectStore("pattern")
		migrate(store, 3)
	}
]

/* data migrations */
export function migrateStepLocations(/** @type Uint8Array */ array) {
	let layera = array.subarray(0, 15)
	let layerb = array.subarray(16, 31)
	let layerc = array.subarray(32, 47)
	let layerd = array.subarray(48, 64)
	// can't reuse any info from the outside object because it
	// might change but this function must never
	let stepsPerLayer = 128
	let layersPerMachine = 4
	let layerNumberOffset = 0
	let updated = new Uint8Array(
		(layersPerMachine + layerNumberOffset) * stepsPerLayer
	)
	updated.set(layera, 0)
	updated.set(layerb, stepsPerLayer)
	updated.set(layerc, stepsPerLayer * 2)
	updated.set(layerd, stepsPerLayer * 3)
	return updated
}

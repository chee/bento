interface HTMLElement {
	connectedCallback(): void
}

interface Math {
	clamp: (num: number, min: number, max: number) => number
	wrap: (num: number, min: number, max: number) => number
	lerp: (num: number, min: number, max: number) => number
}

interface Array<T> {
	chunk: (size: number) => T[][]
	random: () => T
}

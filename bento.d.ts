interface HTMLElement {
	connectedCallback(): void
}

interface Math {
	clamp: (min: number, num: number, max: number) => number
	wrap: (min: number, num: number, max: number) => number
}

interface Array<T> {
	chunk: (size: number) => T[][]
}

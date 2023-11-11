import BentoParty from "./public/elements/party"
import BentoNav from "./public/elements/nav"
import BentoMachine from "./public/elements/machine"
import BentoControlButton, {
	ButtonControlSpec
} from "./public/elements/control-button"
import BentoBox from "./public/elements/box"
import BentoGrid from "./public/elements/grid"
import BentoGridControls from "./public/elements/grid-controls"
import BentoLayerSelector from "./public/elements/layer-selector"
import BentoMasterControls from "./public/elements/master-controls"
import BentoMiniGrid from "./public/elements/mini-grid"
import BentoScreen from "./public/elements/screen"
import BentoScreenControls from "./public/elements/screen-controls"
import BentoScreenSelector from "./public/elements/screen-selector"
import BentoGridSelector from "./public/elements/grid-selector"
import BentoTape from "./public/elements/tape"
import BentoControlPopout, {
	PopoutControlSpec
} from "./public/elements/control-popout"

declare global {
	type BentoControl = BentoControlButton | BentoControlPopout
	type BentoControlSpec<T> = PopoutControlSpec<T> | ButtonControlSpec

	interface HTMLElementTagNameMap {
		"bento-party": BentoParty
		"bento-nav": BentoNav
		"bento-machine": BentoMachine
		"bento-master-controls": BentoMasterControls
		"bento-layer-selector": BentoLayerSelector
		"bento-screen-controls": BentoScreenControls
		"bento-control-button": BentoControlButton
		"bento-control-popout": BentoControlPopout
		"bento-screen": BentoScreen
		"bento-screen-selector": BentoScreenSelector
		"bento-grid": BentoGrid
		"bento-box": BentoBox
		"bento-grid-controls": BentoGridControls
		"bento-grid-selector": BentoGridSelector
		"bento-mini-grid": BentoMiniGrid
		"bento-tape": BentoTape

		dialog: HTMLDialogElement
		"template[icon]": HTMLTemplateElement
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

	interface HTMLElement {
		connectedCallback(): void
	}
}

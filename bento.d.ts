import BentoParty from "./public/elements/party"
import BentoNav from "./public/elements/nav"
import BentoMachine from "./public/elements/machine"
import BentoControlButton, {
	BentoRecordButton,
	BentoFlipButton,
	BentoLoopButton,
	BentoHearButton
} from "./public/elements/controls/button"
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
	BentoLayerTypeSelector,
	BentoSpeedSelector,
	BentoLoopSelector
} from "./public/elements/controls/popout"
import BentoLayerSelectorChoice from "./public/elements/layer-selector-choice"

declare global {
	type BentoControl = BentoControlButton | BentoControlPopout
	type BentoControlSpec<T> = PopoutControlSpec<T> | ButtonControlSpec

	interface HTMLElementTagNameMap {
		"bento-party": BentoParty
		"bento-nav": BentoNav
		"bento-machine": BentoMachine
		"bento-master-controls": BentoMasterControls
		"bento-layer-selector": BentoLayerSelector
		"bento-layer-selector-choice": BentoLayerSelectorChoice
		"bento-screen-controls": BentoScreenControls
		"bento-control-button": BentoControlButton
		"bento-record-button": BentoRecordButton
		"bento-hear-button": BentoHearButton
		"bento-flip-button": BentoFlipButton
		"bento-loop-button": BentoLoopButton
		"bento-layer-type-selector": BentoLayerTypeSelector
		"bento-speed-selector": BentoSpeedSelector
		"bento-loop-selector": BentoLoopSelector
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

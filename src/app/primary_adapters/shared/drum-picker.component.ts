import {
	Component,
	ChangeDetectionStrategy,
	input,
	output,
	viewChild,
	ElementRef,
	effect,
	afterNextRender,
} from "@angular/core";

const ITEM_HEIGHT = 40;
const PHANTOM_COUNT = 1;

@Component({
	selector: "app-drum-picker",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./drum-picker.component.html",
	styleUrl: "./drum-picker.component.scss",
})
export class DrumPickerComponent {
	readonly values = input.required<(number | string)[]>();
	readonly selectedValue = input.required<number | string>();
	readonly unit = input<string>("");
	readonly valueChange = output<number | string>();

	readonly scrollContainer = viewChild<ElementRef<HTMLElement>>("scrollContainer");

	readonly phantoms = Array(PHANTOM_COUNT).fill(null);

	private initialRenderDone = false;

	constructor() {
		afterNextRender(() => {
			this.scrollToSelected();
			this.initialRenderDone = true;
		});

		effect(() => {
			if (!this.initialRenderDone) return;
			this.scrollToSelected();
		});
	}

	private scrollToSelected(): void {
		const container = this.scrollContainer()?.nativeElement;
		if (!container) return;
		const index = this.values().indexOf(this.selectedValue());
		if (index >= 0) container.scrollTop = index * ITEM_HEIGHT;
	}

	onScroll(event: Event): void {
		const container = event.target as HTMLElement;
		const activeIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
		const newValue = this.values()[activeIndex];
		if (newValue !== undefined && newValue !== this.selectedValue()) this.valueChange.emit(newValue);
	}
}

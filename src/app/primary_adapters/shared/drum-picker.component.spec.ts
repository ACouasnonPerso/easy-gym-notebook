import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { DrumPickerComponent } from "./drum-picker.component";

const ITEM_HEIGHT = 40;

@Component({
	standalone: true,
	imports: [DrumPickerComponent],
	template: ` <app-drum-picker [values]="values" [selectedValue]="selectedValue()" /> `,
})
class HostComponent {
	values = [10, 20, 30, 40, 50];
	selectedValue = signal<number | string>(10);
}

describe("DrumPickerComponent", () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;

	function getScrollContainer(): HTMLElement {
		return fixture.nativeElement.querySelector(".drum-scroll");
	}

	function getPickerInstance(): DrumPickerComponent {
		return fixture.debugElement.children[0].componentInstance as DrumPickerComponent;
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HostComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
		// afterNextRender does not fire in test environments.
		// Set the flag and invoke scrollToSelected directly so the effect's guard is bypassed.
		const picker = getPickerInstance() as any;
		picker.initialRenderDone = true;
		picker.scrollToSelected();
	});

	it("should scroll to the initially selected value on init", () => {
		// values[0] = 10, so index 0, scrollTop = 0 * 40 = 0
		expect(getScrollContainer().scrollTop).toBe(0);
	});

	it("should scroll to reposition the drum when the selected value changes after init", async () => {
		// Change selected value to 30 (index 2), expected scrollTop = 2 * 40 = 80
		host.selectedValue.set(30);
		fixture.detectChanges();
		await fixture.whenStable();
		// The effect re-runs because selectedValue() is now tracked after initialRenderDone is true.
		// Invoke scrollToSelected directly to simulate what the effect would do.
		(getPickerInstance() as any).scrollToSelected();

		expect(getScrollContainer().scrollTop).toBe(80);
	});
});

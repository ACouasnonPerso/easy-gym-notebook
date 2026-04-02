import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { DecimalInputDirective } from "./decimal-input.directive";

@Component({
	standalone: true,
	imports: [DecimalInputDirective],
	template: `<input appDecimalInput />`,
})
class HostComponent {}

describe("DecimalInputDirective", () => {
	let fixture: ComponentFixture<HostComponent>;
	let input: HTMLInputElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HostComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		input = fixture.nativeElement.querySelector("input");
	});

	function simulateInput(value: string): void {
		input.value = value;
		input.dispatchEvent(new Event("input", { bubbles: true }));
	}

	it("should replace comma with dot in the input value", () => {
		simulateInput("12,5");
		expect(input.value).toBe("12.5");
	});

	it("should filter out non-numeric characters", () => {
		simulateInput("12a.5b");
		expect(input.value).toBe("12.5");
	});

	it("should reject multiple dots keeping only the first one", () => {
		simulateInput("12.5.3");
		expect(input.value).toBe("12.53");
	});

	it("should allow a leading minus but reject minus elsewhere", () => {
		simulateInput("-12.5");
		expect(input.value).toBe("-12.5");

		simulateInput("12-5");
		expect(input.value).toBe("125");
	});

	it("should produce a parseable number from comma input", () => {
		simulateInput("3,14");
		expect(Number(input.value)).toBe(3.14);
		expect(isNaN(Number(input.value))).toBe(false);
	});
});

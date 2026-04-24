import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { ChronoCustomSettingsPanelComponent } from "./chrono-custom-settings-panel.component";
import { ChronoCustomSettings } from "../../core_logic/exercise-chrono/chrono-custom-settings";

function createComponent(initialSettings: ChronoCustomSettings) {
	TestBed.configureTestingModule({
		imports: [ChronoCustomSettingsPanelComponent],
		providers: [provideTranslateService({ defaultLanguage: "en" })],
	});
	const fixture = TestBed.createComponent(ChronoCustomSettingsPanelComponent);
	fixture.componentRef.setInput("initialSettings", initialSettings);
	fixture.detectChanges();
	return fixture;
}

describe("ChronoCustomSettingsPanelComponent", () => {
	describe("initial values", () => {
		it("shows initial breakDuration", () => {
			const fixture = createComponent({ breakDuration: 90, repetitions: 3, totalSets: 2 });
			const values = fixture.debugElement.queryAll(By.css(".stepper-value"));
			expect(values[0].nativeElement.textContent.trim()).toContain("90");
		});
	});

	describe("infinity toggle for repetitions", () => {
		it("infinity button for repetitions has active class when repetitions=null", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: null, totalSets: 2 });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			expect(infBtns[0].nativeElement.classList.contains("active")).toBeTrue();
		});

		it("infinity button for repetitions does NOT have active class when repetitions is a number", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: 2 });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			expect(infBtns[0].nativeElement.classList.contains("active")).toBeFalse();
		});

		it("toggles repetitions to null when clicking infinity button while value is numeric", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: 2 });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			infBtns[0].triggerEventHandler("click", null);
			expect(fixture.componentInstance.repetitionsVal()).toBeNull();
		});

		it("toggles repetitions back to last integer when clicking infinity button while value is null", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: null, totalSets: 2 });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			infBtns[0].triggerEventHandler("click", null);
			expect(fixture.componentInstance.repetitionsVal()).toBeGreaterThan(0);
		});
	});

	describe("infinity toggle for totalSets", () => {
		it("infinity button for totalSets has active class when totalSets=null", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: null });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			expect(infBtns[1].nativeElement.classList.contains("active")).toBeTrue();
		});

		it("toggles totalSets to null when clicking infinity button while value is numeric", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: 2 });
			const infBtns = fixture.debugElement.queryAll(By.css(".infinity-btn"));
			infBtns[1].triggerEventHandler("click", null);
			expect(fixture.componentInstance.totalSetsVal()).toBeNull();
		});
	});

	describe("confirmed output", () => {
		it("emits confirmed with current settings on confirm button click", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: 2 });
			let emitted: ChronoCustomSettings | undefined;
			fixture.componentInstance.confirmed.subscribe((v: ChronoCustomSettings) => (emitted = v));
			const btns = fixture.debugElement.queryAll(By.css(".btn-primary"));
			btns[0].triggerEventHandler("click", null);
			expect(emitted).toEqual({ breakDuration: 60, repetitions: 3, totalSets: 2 });
		});
	});

	describe("cancelled output", () => {
		it("emits cancelled on cancel button click", () => {
			const fixture = createComponent({ breakDuration: 60, repetitions: 3, totalSets: 2 });
			let emitted = false;
			fixture.componentInstance.cancelled.subscribe(() => (emitted = true));
			const btns = fixture.debugElement.queryAll(By.css(".btn-cancel"));
			btns[0].triggerEventHandler("click", null);
			expect(emitted).toBeTrue();
		});
	});
});
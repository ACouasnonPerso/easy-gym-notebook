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
	describe("confirmed output", () => {
		it("emits ChronoCustomSettings with correct finite values on confirm", () => {
			const fixture = createComponent({ exerciseDuration: 30, breakDuration: 60, repetitions: 3 });
			let emitted: ChronoCustomSettings | undefined;
			fixture.componentInstance.confirmed.subscribe((v: ChronoCustomSettings) => (emitted = v));

			const confirmBtn = fixture.debugElement.query(By.css("[data-testid='confirm-btn']"));
			confirmBtn.triggerEventHandler("click", null);

			expect(emitted).toEqual({ exerciseDuration: 30, breakDuration: 60, repetitions: 3 });
		});

		it("emits null for infinite fields on confirm", () => {
			const fixture = createComponent({ exerciseDuration: null, breakDuration: null, repetitions: null });
			let emitted: ChronoCustomSettings | undefined;
			fixture.componentInstance.confirmed.subscribe((v: ChronoCustomSettings) => (emitted = v));

			const confirmBtn = fixture.debugElement.query(By.css("[data-testid='confirm-btn']"));
			confirmBtn.triggerEventHandler("click", null);

			expect(emitted).toEqual({ exerciseDuration: null, breakDuration: null, repetitions: null });
		});
	});

	describe("cancelled output", () => {
		it("emits on cancel button click", () => {
			const fixture = createComponent({ exerciseDuration: null, breakDuration: 60, repetitions: null });
			let emitted = false;
			fixture.componentInstance.cancelled.subscribe(() => (emitted = true));

			const cancelBtn = fixture.debugElement.query(By.css("[data-testid='cancel-btn']"));
			cancelBtn.triggerEventHandler("click", null);

			expect(emitted).toBeTrue();
		});
	});
});

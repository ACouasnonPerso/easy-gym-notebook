import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { ChronoActionsComponent } from "./chrono-actions.component";
import { HapticService } from "../../core_logic/shared/haptic.service";

function createComponent(chronoState: string) {
	const hapticSpy = jasmine.createSpyObj<HapticService>("HapticService", ["vibrate"]);

	TestBed.configureTestingModule({
		imports: [ChronoActionsComponent],
		providers: [{ provide: HapticService, useValue: hapticSpy }, provideTranslateService({ defaultLanguage: "fr" })],
	});

	const fixture = TestBed.createComponent(ChronoActionsComponent);
	fixture.componentRef.setInput("chronoState", chronoState);
	fixture.detectChanges();

	return { fixture, hapticSpy };
}

describe("ChronoActionsComponent — haptic feedback sur -10s et +10s", () => {
	it("cliquer sur -10s appelle hapticService.vibrate()", () => {
		const { fixture, hapticSpy } = createComponent("break");

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btn = btns.find((b) => b.nativeElement.textContent.trim() === "-10s")!;
		btn.triggerEventHandler("click", null);

		expect(hapticSpy.vibrate).toHaveBeenCalledTimes(1);
	});

	it("cliquer sur +10s appelle hapticService.vibrate()", () => {
		const { fixture, hapticSpy } = createComponent("break");

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btn = btns.find((b) => b.nativeElement.textContent.trim() === "+10s")!;
		btn.triggerEventHandler("click", null);

		expect(hapticSpy.vibrate).toHaveBeenCalledTimes(1);
	});

	it("cliquer sur -10s émet addTime(-10)", () => {
		const { fixture } = createComponent("break");
		let emitted: number | undefined;
		fixture.componentInstance.addTime.subscribe((v: number) => (emitted = v));

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btn = btns.find((b) => b.nativeElement.textContent.trim() === "-10s")!;
		btn.triggerEventHandler("click", null);

		expect(emitted).toBe(-10);
	});

	it("cliquer sur +10s émet addTime(10)", () => {
		const { fixture } = createComponent("break");
		let emitted: number | undefined;
		fixture.componentInstance.addTime.subscribe((v: number) => (emitted = v));

		const btns = fixture.debugElement.queryAll(By.css(".add-time-btn"));
		const btn = btns.find((b) => b.nativeElement.textContent.trim() === "+10s")!;
		btn.triggerEventHandler("click", null);

		expect(emitted).toBe(10);
	});
});

describe("ChronoActionsComponent Story 5 - OVER state RESTART button", () => {
	it("shows RESTART button when chronoState is over", () => {
		const { fixture } = createComponent("over");
		const restartBtn = fixture.debugElement.query(By.css("[data-testid='restart-btn']"));
		expect(restartBtn).not.toBeNull();
	});

	it("does not show RESTART button when chronoState is initial", () => {
		const { fixture } = createComponent("initial");
		const restartBtn = fixture.debugElement.query(By.css("[data-testid='restart-btn']"));
		expect(restartBtn).toBeNull();
	});

	it("does not show RESTART button when chronoState is training", () => {
		const { fixture } = createComponent("training");
		const restartBtn = fixture.debugElement.query(By.css("[data-testid='restart-btn']"));
		expect(restartBtn).toBeNull();
	});

	it("RESTART button click emits restart output", () => {
		const { fixture } = createComponent("over");
		let emitted = false;
		fixture.componentInstance.restart.subscribe(() => (emitted = true));
		const restartBtn = fixture.debugElement.query(By.css("[data-testid='restart-btn']"));
		restartBtn.triggerEventHandler("click", null);
		expect(emitted).toBeTrue();
	});
});

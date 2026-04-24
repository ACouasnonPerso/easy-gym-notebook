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

describe('ChronoActionsComponent — over state', () => {
	it('shows RESTART button when state is over', () => {
		const { fixture } = createComponent('over');
		const labels = fixture.debugElement.queryAll(By.css('.chrono-btn-label'));
		const texts = labels.map((l) => l.nativeElement.textContent.trim());
		// Should find a restart button (translate key chrono.restart - displayed as key since no translations loaded)
		const hasRestartBtn = texts.some((t) => t.includes('restart') || t.includes('RESTART'));
		expect(hasRestartBtn).toBeTrue();
	});

	it('emits restart output when restart button is clicked', () => {
		const { fixture } = createComponent('over');
		let emitted = false;
		fixture.componentInstance.restart.subscribe(() => (emitted = true));
		const btn = fixture.debugElement.query(By.css('.chrono-btn'));
		btn.triggerEventHandler('click', null);
		expect(emitted).toBeTrue();
	});

	it('does not show start/pause buttons in over state', () => {
		const { fixture } = createComponent('over');
		const btns = fixture.debugElement.queryAll(By.css('.chrono-btn'));
		// Only the restart button should be present
		expect(btns.length).toBe(1);
	});
});

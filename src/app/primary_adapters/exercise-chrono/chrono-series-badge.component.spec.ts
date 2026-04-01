import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { ChronoSeriesBadgeComponent } from "./chrono-series-badge.component";

function createComponent(hasExercise: boolean, seriesCount: number) {
	TestBed.configureTestingModule({
		imports: [ChronoSeriesBadgeComponent],
		providers: [provideTranslateService({ defaultLanguage: "fr" })],
	});

	const fixture = TestBed.createComponent(ChronoSeriesBadgeComponent);
	fixture.componentRef.setInput("hasExercise", hasExercise);
	fixture.componentRef.setInput("seriesCount", seriesCount);
	fixture.detectChanges();
	return fixture;
}

describe("ChronoSeriesBadgeComponent — rendu toujours visible", () => {
	it("affiche le badge même quand seriesCount vaut 0", () => {
		const fixture = createComponent(false, 0);

		const badge = fixture.debugElement.query(By.css(".series-badge"));

		expect(badge).not.toBeNull();
	});
});

describe("ChronoSeriesBadgeComponent — bouton +1", () => {
	it("cliquer sur le bouton +1 émet incrementSeries", () => {
		const fixture = createComponent(true, 2);
		let emitted = false;
		fixture.componentInstance.incrementSeries.subscribe(() => (emitted = true));

		const btn = fixture.debugElement.query(By.css(".series-increment-btn"));
		btn.triggerEventHandler("click", null);

		expect(emitted).toBeTrue();
	});
});

describe("ChronoSeriesBadgeComponent — bouton -1", () => {
	it("cliquer sur le bouton -1 émet decrementSeries", () => {
		const fixture = createComponent(true, 2);
		let emitted = false;
		fixture.componentInstance.decrementSeries.subscribe(() => (emitted = true));

		const btn = fixture.debugElement.query(By.css(".series-decrement-btn"));
		btn.triggerEventHandler("click", null);

		expect(emitted).toBeTrue();
	});
});

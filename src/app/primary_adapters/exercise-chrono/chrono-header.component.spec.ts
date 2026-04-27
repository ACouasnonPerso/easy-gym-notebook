import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { ChronoHeaderComponent } from "./chrono-header.component";

function createComponent(overrides: { hasExercise?: boolean; seriesCount?: number; soundEnabled?: boolean } = {}) {
	TestBed.configureTestingModule({
		imports: [ChronoHeaderComponent],
		providers: [provideTranslateService({ defaultLanguage: "fr" })],
	});

	const fixture = TestBed.createComponent(ChronoHeaderComponent);
	fixture.componentRef.setInput("hasExercise", overrides.hasExercise ?? false);
	fixture.componentRef.setInput("seriesCount", overrides.seriesCount ?? 0);
fixture.componentRef.setInput("soundEnabled", overrides.soundEnabled ?? true);
	fixture.detectChanges();
	return fixture;
}

describe("ChronoHeaderComponent — position du badge série", () => {
	it("app-chrono-series-badge apparaît après app-chrono-sound-button dans le DOM", () => {
		const fixture = createComponent();

		const rightActions = fixture.debugElement.query(By.css(".right-actions"));
		const children = rightActions.children;
		const soundIdx = children.findIndex((c) => c.name === "app-chrono-sound-button");
		const badgeIdx = children.findIndex((c) => c.name === "app-chrono-series-badge");

		expect(badgeIdx).toBeGreaterThan(soundIdx);
	});
});

describe("ChronoHeaderComponent — wiring incrementSeries", () => {
	it("l'événement incrementSeries du badge émet incrementSeries sur le header", () => {
		const fixture = createComponent({ seriesCount: 2 });
		let emitted = false;
		fixture.componentInstance.incrementSeries.subscribe(() => (emitted = true));

		const badge = fixture.debugElement.query(By.css("app-chrono-series-badge"));
		badge.componentInstance.incrementSeries.emit();
		fixture.detectChanges();

		expect(emitted).toBeTrue();
	});
});

describe("ChronoHeaderComponent — wiring decrementSeries", () => {
	it("l'événement decrementSeries du badge émet decrementSeries sur le header", () => {
		const fixture = createComponent({ seriesCount: 2 });
		let emitted = false;
		fixture.componentInstance.decrementSeries.subscribe(() => (emitted = true));

		const badge = fixture.debugElement.query(By.css("app-chrono-series-badge"));
		badge.componentInstance.decrementSeries.emit();
		fixture.detectChanges();

		expect(emitted).toBeTrue();
	});
});

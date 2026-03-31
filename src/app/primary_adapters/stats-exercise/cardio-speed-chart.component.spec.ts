import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { signal } from "@angular/core";
import { CardioSpeedChartComponent } from "./cardio-speed-chart.component";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";

@Component({
	standalone: true,
	imports: [CardioSpeedChartComponent],
	template: `<app-cardio-speed-chart [occurrences]="occurrences" />`,
})
class HostComponent {
	occurrences: CardioOccurrence[] = [];
}

function makeOccurrence(
	distanceKm: number | null,
	durationSeconds: number,
	date = new Date(2026, 0, 1)
): CardioOccurrence {
	return { date, durationSeconds, distanceKm };
}

describe("CardioSpeedChartComponent", () => {
	function setup(occurrences: CardioOccurrence[], unit: "metric" | "imperial" | "us" = "metric") {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [
				provideTranslateService({ defaultLanguage: "fr" }),
				{ provide: MassUnitService, useValue: { activeMassUnit: signal(unit) } },
			],
		});
		const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.detectChanges();
		return fixture;
	}

	it("should return null chartData when no occurrences have distance > 0", () => {
		const fixture = setup([makeOccurrence(null, 3600), makeOccurrence(0, 3600)]);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector(".empty-chart")).not.toBeNull();
		expect(el.querySelectorAll("circle").length).toBe(0);
	});

	it("should compute metric speed: 3600s over 10km = 10 km/h", () => {
		const fixture = setup([makeOccurrence(10, 3600)], "metric");
		const el: HTMLElement = fixture.nativeElement;
		const texts = Array.from(el.querySelectorAll("text")).map((t) => t.textContent?.trim());
		expect(texts).toContain("10 km/h");
	});

	it("should compute imperial speed: 3600s over 10km -> 6.2 mph", () => {
		const fixture = setup([makeOccurrence(10, 3600)], "imperial");
		const el: HTMLElement = fixture.nativeElement;
		const texts = Array.from(el.querySelectorAll("text")).map((t) => t.textContent?.trim());
		expect(texts).toContain("6.2 mph");
	});
});

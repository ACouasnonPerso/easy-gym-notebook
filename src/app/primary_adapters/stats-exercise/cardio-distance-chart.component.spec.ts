import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { CardioDistanceChartComponent } from "./cardio-distance-chart.component";
import { CardioOccurrence } from "../../core_logic/shared/models";

@Component({
	standalone: true,
	imports: [CardioDistanceChartComponent],
	template: `<app-cardio-distance-chart [occurrences]="occurrences" />`,
})
class HostComponent {
	occurrences: CardioOccurrence[] = [];
}

function makeOccurrence(distanceKm: number | null, date = new Date(2026, 0, 1)): CardioOccurrence {
	return {
		date,
		durationSeconds: 3600,
		distanceKm,
	};
}

describe("CardioDistanceChartComponent", () => {
	let hostFixture: ComponentFixture<HostComponent>;

	function setup(occurrences: CardioOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideTranslateService({ defaultLanguage: "fr" })],
		});
		hostFixture = TestBed.createComponent(HostComponent);
		hostFixture.componentInstance.occurrences = occurrences;
		hostFixture.detectChanges();
	}

	it("should exclude occurrences where distanceKm is 0 from the chart", () => {
		const occurrences = [
			makeOccurrence(0, new Date(2026, 0, 1)),
			makeOccurrence(10, new Date(2026, 0, 2)),
			makeOccurrence(0, new Date(2026, 0, 3)),
			makeOccurrence(15, new Date(2026, 0, 4)),
		];
		setup(occurrences);

		const el: HTMLElement = hostFixture.nativeElement;
		const circles = el.querySelectorAll("circle");
		expect(circles.length).toBe(2);
	});

	it("should exclude occurrences where distanceKm is null from the chart", () => {
		const occurrences = [makeOccurrence(null, new Date(2026, 0, 1)), makeOccurrence(10, new Date(2026, 0, 2))];
		setup(occurrences);

		const el: HTMLElement = hostFixture.nativeElement;
		const circles = el.querySelectorAll("circle");
		expect(circles.length).toBe(1);
	});

	it("should show the empty state when all occurrences have no distance", () => {
		const occurrences = [makeOccurrence(null), makeOccurrence(0)];
		setup(occurrences);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector(".empty-chart")).not.toBeNull();
		expect(el.querySelectorAll("circle").length).toBe(0);
	});
});

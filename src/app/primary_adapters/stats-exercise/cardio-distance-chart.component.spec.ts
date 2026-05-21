import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { CardioDistanceChartComponent } from "./cardio-distance-chart.component";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

@Component({
	standalone: true,
	imports: [CardioDistanceChartComponent],
	template: `<app-cardio-distance-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: CardioOccurrence[] = [];
	groupBy: GroupBy = 'session';
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

	function setup(occurrences: CardioOccurrence[], groupBy: GroupBy = 'session') {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideTranslateService({ defaultLanguage: "fr" })],
		});
		hostFixture = TestBed.createComponent(HostComponent);
		hostFixture.componentInstance.occurrences = occurrences;
		hostFixture.componentInstance.groupBy = groupBy;
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

	describe("labels de l'axe X selon la granularité (groupBy)", () => {
		it("T21: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
			setup([makeOccurrence(10, new Date(2026, 2, 16))], 'week');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("S12");
		});

		it("T22: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
			setup([makeOccurrence(10, new Date(2026, 2, 16))], 'month');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^[A-Z][a-z]{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("Mar");
		});
	});
});

describe("CardioDistanceChartComponent — regression overlay smoke tests", () => {
	function makeOccurrences(count: number): CardioOccurrence[] {
		return Array.from({ length: count }, (_, i) => ({
			date: new Date(2026, 0, i + 1),
			durationSeconds: 3600,
			distanceKm: 5 + i,
		}));
	}

	function setup(occurrences: CardioOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideTranslateService({ defaultLanguage: "fr" })],
		});
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = 'session';
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	it("should render regression-line when 6 occurrences with valid distanceKm", () => {
		const el = setup(makeOccurrences(6));
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("should NOT render regression-line when only 5 occurrences with valid distanceKm", () => {
		const el = setup(makeOccurrences(5));
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

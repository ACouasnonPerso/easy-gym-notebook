import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideTranslateService } from "@ngx-translate/core";
import { signal } from "@angular/core";
import { CardioSpeedChartComponent } from "./cardio-speed-chart.component";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

@Component({
	standalone: true,
	imports: [CardioSpeedChartComponent],
	template: `<app-cardio-speed-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: CardioOccurrence[] = [];
	groupBy: GroupBy = 'session';
}

function makeOccurrence(
	distanceKm: number | null,
	durationSeconds: number,
	date = new Date(2026, 0, 1)
): CardioOccurrence {
	return { date, durationSeconds, distanceKm };
}

describe("CardioSpeedChartComponent", () => {
	function setup(
		occurrences: CardioOccurrence[],
		unit: "metric" | "imperial" | "us" = "metric",
		groupBy: GroupBy = 'session'
	) {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [
				provideTranslateService({ defaultLanguage: "fr" }),
				{ provide: MassUnitService, useValue: { activeMassUnit: signal(unit) } },
			],
		});
		const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = groupBy;
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

	describe("labels de l'axe X selon la granularité (groupBy)", () => {
		it("T25: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
			const fixture = setup([makeOccurrence(10, 3600, new Date(2026, 2, 16))], "metric", 'week');
			const el = fixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("S12");
		});

		it("T26: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
			const fixture = setup([makeOccurrence(10, 3600, new Date(2026, 2, 16))], "metric", 'month');
			const el = fixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^[A-Z][a-z]{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("Mar");
		});
	});
});

describe("CardioSpeedChartComponent — regression overlay smoke tests", () => {
	function makeOccurrences(count: number): CardioOccurrence[] {
		return Array.from({ length: count }, (_, i) => ({
			date: new Date(2026, 0, i + 1),
			durationSeconds: 3600,
			distanceKm: 5 + i,
		}));
	}

	function setupSmoke(occurrences: CardioOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [
				provideTranslateService({ defaultLanguage: "fr" }),
				{ provide: MassUnitService, useValue: { activeMassUnit: signal("metric" as const) } },
			],
		});
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = 'session';
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	it("should render regression-line when 6 occurrences with valid distanceKm", () => {
		const el = setupSmoke(makeOccurrences(6));
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("should NOT render regression-line when only 5 occurrences with valid distanceKm", () => {
		const el = setupSmoke(makeOccurrences(5));
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

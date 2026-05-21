import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { CardioTimeChartComponent } from "./cardio-time-chart.component";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { provideTranslateService } from "@ngx-translate/core";

@Component({
	standalone: true,
	imports: [CardioTimeChartComponent],
	template: `<app-cardio-time-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: CardioOccurrence[] = [];
	groupBy: GroupBy = 'session';
}

describe("CardioTimeChartComponent — labels de l'axe X selon la granularité (groupBy)", () => {
	let hostFixture: ComponentFixture<HostComponent>;

	function setup(occurrences: CardioOccurrence[], groupBy: GroupBy = 'session') {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideTranslateService({ defaultLanguage: 'fr' })],
		});
		hostFixture = TestBed.createComponent(HostComponent);
		hostFixture.componentInstance.occurrences = occurrences;
		hostFixture.componentInstance.groupBy = groupBy;
		hostFixture.detectChanges();
	}

	it("T19: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
		setup([{ date: new Date(2026, 2, 16), durationSeconds: 1800, distanceKm: null }], 'week');
		const el = hostFixture.nativeElement as HTMLElement;
		const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
			/^S\d+$/.test(t.textContent?.trim() ?? "")
		);
		expect(labels.length).toBe(1);
		expect(labels[0].textContent?.trim()).toBe("S12");
	});

	it("T20: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
		setup([{ date: new Date(2026, 2, 16), durationSeconds: 1800, distanceKm: null }], 'month');
		const el = hostFixture.nativeElement as HTMLElement;
		const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
			/^[A-Z][a-z]{2}$/.test(t.textContent?.trim() ?? "")
		);
		expect(labels.length).toBe(1);
		expect(labels[0].textContent?.trim()).toBe("Mar");
	});
});

describe("CardioTimeChartComponent — regression overlay smoke tests", () => {
	function makeOccurrences(count: number): CardioOccurrence[] {
		return Array.from({ length: count }, (_, i) => ({
			date: new Date(2026, 0, i + 1),
			durationSeconds: 1800 + i * 60,
			distanceKm: null,
		}));
	}

	function setup(occurrences: CardioOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideTranslateService({ defaultLanguage: 'fr' })],
		});
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = 'session';
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	it("should render regression-line when 6 occurrences", () => {
		const el = setup(makeOccurrences(6));
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("should NOT render regression-line when only 5 occurrences", () => {
		const el = setup(makeOccurrences(5));
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

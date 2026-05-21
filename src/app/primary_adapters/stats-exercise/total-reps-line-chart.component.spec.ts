import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { TotalRepsLineChartComponent } from "./total-reps-line-chart.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

const FR_TRANSLATIONS = {
	common: { totalReps: "Total reps", noData: "Aucune donnée" },
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(FR_TRANSLATIONS as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n(): void {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");
}

@Component({
	standalone: true,
	imports: [TotalRepsLineChartComponent],
	template: `<app-total-reps-line-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: ExerciseOccurrence[] = [];
	groupBy: GroupBy = 'session';
}

function makeOccurrences(count: number, baseTotalReps = 100): ExerciseOccurrence[] {
	return Array.from({ length: count }, (_, i) => ({
		exerciseId: "ex1",
		sessionId: `sess${i}`,
		date: new Date(2026, 0, i + 1),
		name: "Squat",
		weightKg: 80,
		sets: 3,
		reps: 5,
		breakDurationSeconds: 90,
		volumeKg: 1200 + i * 10,
		totalReps: baseTotalReps + i * 10,
		status: "validated" as const,
		rating: null,
		comment: null,
		setBreakdown: [],
	}));
}

function repsLabels(el: HTMLElement): Element[] {
	return Array.from(el.querySelectorAll("text")).filter((t) => /^\d+$/.test(t.textContent?.trim() ?? ""));
}

function dateLabels(el: HTMLElement): Element[] {
	return Array.from(el.querySelectorAll("text")).filter((t) => /^\d{2}\/\d{2}$/.test(t.textContent?.trim() ?? ""));
}

describe("TotalRepsLineChartComponent — graphique de progression des reps totales", () => {
	let hostFixture: ComponentFixture<HostComponent>;

	function setup(occurrences: ExerciseOccurrence[], groupBy: GroupBy = 'session') {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
		});
		setupI18n();
		hostFixture = TestBed.createComponent(HostComponent);
		hostFixture.componentInstance.occurrences = occurrences;
		hostFixture.componentInstance.groupBy = groupBy;
		hostFixture.detectChanges();
	}

	it('devrait afficher "Aucune donnée" et aucun SVG quand le tableau d\'occurrences est vide', () => {
		setup([]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("Aucune donnée");
		expect(el.querySelector("svg")).toBeNull();
	});

	it("devrait afficher un cercle bleu clair (#38bdf8) quand il y a une seule occurrence", () => {
		const occurrence: ExerciseOccurrence = {
			exerciseId: "ex1",
			sessionId: "sess1",
			date: new Date("2026-01-15"),
			name: "Squat",
			weightKg: 80,
			sets: 3,
			reps: 5,
			breakDurationSeconds: 90,
			volumeKg: 1200,
			totalReps: 42,
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		const circles = el.querySelectorAll("circle");
		expect(circles.length).toBe(1);
		expect(circles[0].getAttribute("fill")).toBe("#38bdf8");
	});

	it("devrait afficher le label de reps en entier (sans 'kg') pour une occurrence avec totalReps: 42", () => {
		const occurrence: ExerciseOccurrence = {
			exerciseId: "ex1",
			sessionId: "sess1",
			date: new Date("2026-01-15"),
			name: "Squat",
			weightKg: 80,
			sets: 3,
			reps: 5,
			breakDurationSeconds: 90,
			volumeKg: 1200,
			totalReps: 42,
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("42");
		expect(el.textContent).not.toContain("42 kg");
	});

	it("devrait afficher une polyline avec stroke #38bdf8 pour plusieurs occurrences", () => {
		setup(makeOccurrences(3));

		const el: HTMLElement = hostFixture.nativeElement;
		const polyline = el.querySelector("polyline");
		expect(polyline).not.toBeNull();
		expect(polyline?.getAttribute("stroke")).toBe("#38bdf8");
	});

	it("ne devrait pas afficher de polyline pour une seule occurrence", () => {
		setup(makeOccurrences(1));

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("polyline")).toBeNull();
	});

	it("devrait afficher un linearGradient avec stop-color #38bdf8 et un polygon fill url(#blueGrad) pour plusieurs occurrences", () => {
		setup(makeOccurrences(3));

		const el: HTMLElement = hostFixture.nativeElement;
		const stops = el.querySelectorAll("stop");
		const hasBlueStop = Array.from(stops).some((s) => s.getAttribute("stop-color") === "#38bdf8");
		expect(hasBlueStop).toBeTrue();

		const polygon = el.querySelector("polygon");
		expect(polygon).not.toBeNull();
		expect(polygon?.getAttribute("fill")).toBe("url(#blueGrad)");
	});

	it("devrait avoir un .legend-dot avec background #38bdf8", () => {
		setup(makeOccurrences(2));

		const el: HTMLElement = hostFixture.nativeElement;
		const legendDot = el.querySelector(".legend-dot") as HTMLElement | null;
		expect(legendDot).not.toBeNull();
		expect(legendDot?.getAttribute("style")).toContain("#38bdf8");
	});

	describe("réduction de fréquence des labels de reps", () => {
		it("devrait afficher tous les labels de reps pour <= 10 occurrences", () => {
			setup(makeOccurrences(10));

			const el: HTMLElement = hostFixture.nativeElement;
			expect(repsLabels(el).length).toBe(10);
		});

		it("devrait afficher 1 label de reps sur 2 pour 11 occurrences (> 10)", () => {
			setup(makeOccurrences(11));

			const el: HTMLElement = hostFixture.nativeElement;
			// step=2 : index 0,2,4,6,8,10 => 6 labels
			expect(repsLabels(el).length).toBe(6);
		});

		it("devrait afficher 1 label de reps sur 5 pour 25 occurrences (> 20)", () => {
			setup(makeOccurrences(25));

			const el: HTMLElement = hostFixture.nativeElement;
			// step=5 : index 0,5,10,15,20 => 5 labels
			expect(repsLabels(el).length).toBe(5);
		});
	});

	describe("réduction de fréquence des labels de date (axe X)", () => {
		it("devrait afficher tous les labels de date pour <= 10 occurrences", () => {
			setup(makeOccurrences(10));

			const el: HTMLElement = hostFixture.nativeElement;
			expect(dateLabels(el).length).toBe(10);
		});

		it("devrait afficher 1 label de date sur 2 pour 11 occurrences (> 10)", () => {
			setup(makeOccurrences(11));

			const el: HTMLElement = hostFixture.nativeElement;
			// step=2 : index 0,2,4,6,8,10 => 6 labels
			expect(dateLabels(el).length).toBe(6);
		});

		it("devrait afficher 1 label de date sur 5 pour 25 occurrences (> 20)", () => {
			setup(makeOccurrences(25));

			const el: HTMLElement = hostFixture.nativeElement;
			// step=5 : index 0,5,10,15,20 => 5 labels
			expect(dateLabels(el).length).toBe(5);
		});
	});

	describe("labels de l'axe X selon la granularité (groupBy)", () => {
		const occ16Mar: ExerciseOccurrence = {
			exerciseId: "ex1",
			sessionId: "s1",
			date: new Date(2026, 2, 16),
			name: "Squat",
			weightKg: 80,
			sets: 3,
			reps: 5,
			breakDurationSeconds: 90,
			volumeKg: 1200,
			totalReps: 15,
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};

		it("T17: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
			setup([occ16Mar], 'week');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("S12");
		});

		it("T18: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
			setup([occ16Mar], 'month');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^[A-Z][a-z]{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("Mar");
		});
	});

	describe("ordre chronologique des dates sur l'axe X", () => {
		it("devrait afficher la date la plus ancienne à gauche et la plus récente à droite", () => {
			setup(makeOccurrences(3));

			const el: HTMLElement = hostFixture.nativeElement;
			const dateTexts = Array.from(el.querySelectorAll('text[y="126"]'));
			expect(dateTexts.length).toBe(3);

			const xs = dateTexts.map((t) => parseFloat(t.getAttribute("x") ?? "0"));
			expect(xs[0]).toBeLessThan(xs[1]);
			expect(xs[1]).toBeLessThan(xs[2]);
			expect(dateTexts[0].textContent?.trim()).toBe("01/01");
			expect(dateTexts[2].textContent?.trim()).toBe("03/01");
		});
	});
});

describe("TotalRepsLineChartComponent — regression overlay smoke tests", () => {
	function setup(occurrences: ExerciseOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
		});
		const translate = TestBed.inject(TranslateService);
		translate.setDefaultLang("fr");
		translate.use("fr");
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = 'session';
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	it("should render regression-line when 6 occurrences with varying totalReps", () => {
		const occs = makeOccurrences(6, 100);
		const el = setup(occs);
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("should NOT render regression-line when only 5 occurrences", () => {
		const occs = makeOccurrences(5, 100);
		const el = setup(occs);
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

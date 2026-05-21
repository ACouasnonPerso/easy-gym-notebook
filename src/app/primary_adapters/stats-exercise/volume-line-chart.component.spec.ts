import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { LinearRegressionService, RegressionResult } from "../../core_logic/stats-exercise/linear-regression.service";

const FR_TRANSLATIONS = {
	common: { volume: "Volume", noData: "Aucune donnée", numberThousandAbbreviation: "k" },
	statsExercise: { volumeFormula: "= Poids x Rep x Series" },
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
	imports: [VolumeLineChartComponent],
	template: `<app-volume-line-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: ExerciseOccurrence[] = [];
	groupBy: GroupBy = 'session';
}

function makeOccurrences(count: number, baseVolumeKg = 1200): ExerciseOccurrence[] {
	return Array.from({ length: count }, (_, i) => ({
		exerciseId: "ex1",
		sessionId: `sess${i}`,
		date: new Date(2026, 0, i + 1),
		name: "Squat",
		weightKg: 80,
		sets: 3,
		reps: 5,
		breakDurationSeconds: 90,
		volumeKg: baseVolumeKg + i * 10,
		status: "validated" as const,
		rating: null,
		comment: null,
		setBreakdown: [],
	}));
}

describe("VolumeLineChartComponent — graphique de progression du volume", () => {
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

	it('devrait afficher "Aucune donnée" quand le tableau d\'occurrences est vide', () => {
		setup([]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("Aucune donnée");
	});

	it("devrait afficher un cercle vert quand il y a une seule occurrence", () => {
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
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		const circles = el.querySelectorAll("circle");
		expect(circles.length).toBe(1);
		expect(circles[0].getAttribute("fill")).toBe("#22c55e");
	});

	it("devrait afficher le label de volume en kg sur chaque point", () => {
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
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("1.2k kg");
	});

	describe("réduction de fréquence des labels de volume", () => {
		it("devrait afficher tous les labels de volume pour <= 10 occurrences", () => {
			const occurrences = makeOccurrences(10);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const volumeTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			expect(volumeTexts.length).toBe(10);
		});

		it("devrait afficher 1 label de volume sur 2 pour 11 occurrences (> 10)", () => {
			const occurrences = makeOccurrences(11);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const volumeTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			// step=2 : index 0,2,4,6,8,10 => 6 labels
			expect(volumeTexts.length).toBe(6);
		});

		it("devrait afficher 1 label de volume sur 5 pour 25 occurrences (> 20)", () => {
			const occurrences = makeOccurrences(25);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const volumeTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			// step=5 : index 0,5,10,15,20 => 5 labels
			expect(volumeTexts.length).toBe(5);
		});
	});

	describe("réduction de fréquence des labels de date (axe X)", () => {
		it("devrait afficher tous les labels de date pour <= 10 occurrences", () => {
			const occurrences = makeOccurrences(10);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const dateTexts = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^\d{2}\/\d{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(dateTexts.length).toBe(10);
		});

		it("devrait afficher 1 label de date sur 2 pour 11 occurrences (> 10)", () => {
			const occurrences = makeOccurrences(11);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const dateTexts = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^\d{2}\/\d{2}$/.test(t.textContent?.trim() ?? "")
			);
			// step=2 : index 0,2,4,6,8,10 => 6 labels
			expect(dateTexts.length).toBe(6);
		});

		it("devrait afficher 1 label de date sur 5 pour 25 occurrences (> 20)", () => {
			const occurrences = makeOccurrences(25);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const dateTexts = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^\d{2}\/\d{2}$/.test(t.textContent?.trim() ?? "")
			);
			// step=5 : index 0,5,10,15,20 => 5 labels
			expect(dateTexts.length).toBe(5);
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
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};

		it("T10: avec groupBy='session' (défaut), les labels de l'axe X sont au format DD/MM", () => {
			setup([occ16Mar], 'session');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^\d{2}\/\d{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("16/03");
		});

		it("T11: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
			setup([occ16Mar], 'week');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("S12");
		});

		it("T12: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
			setup([occ16Mar], 'month');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^[A-Z][a-z]{2}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("Mar");
		});

		it("T13: avec groupBy='year', les labels de l'axe X sont l'année sur 4 chiffres", () => {
			setup([occ16Mar], 'year');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^\d{4}$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("2026");
		});

		it("T14: getLabelStep gouverne toujours la fréquence d'affichage avec groupBy='week' (11 occ → 6 labels)", () => {
			setup(makeOccurrences(11), 'week');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			// step=2 : indices 0,2,4,6,8,10 → 6 labels
			expect(labels.length).toBe(6);
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

describe("VolumeLineChartComponent — regression overlay", () => {
	const RESULT_20PCT: RegressionResult = { slope: 0.2, intercept: 30, startY: 50, endY: 60, percent: 20 };

	function setupWithSpy(
		occurrences: ExerciseOccurrence[],
		spyReturnValue: RegressionResult | null
	): { fixture: ComponentFixture<HostComponent>; el: HTMLElement } {
		const regressSpy = jasmine.createSpyObj<LinearRegressionService>("LinearRegressionService", ["compute"]);
		regressSpy.compute.and.returnValue(spyReturnValue);

		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
			providers: [{ provide: LinearRegressionService, useValue: regressSpy }],
		});
		setupI18n();
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = 'session';
		fixture.detectChanges();
		return { fixture, el: fixture.nativeElement as HTMLElement };
	}

	it("T1: no regression-line element when spy returns null and 5 occurrences", () => {
		const { el } = setupWithSpy(makeOccurrences(5), null);
		expect(el.querySelector(".regression-line")).toBeNull();
	});

	it("T2: regression-line element present when spy returns RESULT_20PCT and 6 occurrences", () => {
		const { el } = setupWithSpy(makeOccurrences(6), RESULT_20PCT);
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("T3: line x1 attribute is 40 for 6 evenly spaced occurrences", () => {
		const { el } = setupWithSpy(makeOccurrences(6), RESULT_20PCT);
		const line = el.querySelector(".regression-line");
		expect(line?.getAttribute("x1")).toBe("40");
	});

	it("T4: line x2 attribute is 280 for 6 evenly spaced occurrences", () => {
		const { el } = setupWithSpy(makeOccurrences(6), RESULT_20PCT);
		const line = el.querySelector(".regression-line");
		expect(line?.getAttribute("x2")).toBe("280");
	});

	it("T5: regression-label text content is +20% when percent=20", () => {
		const { el } = setupWithSpy(makeOccurrences(6), RESULT_20PCT);
		const label = el.querySelector(".regression-label");
		expect(label?.textContent?.trim()).toBe("+20%");
	});

	it("T6: regression-label text content is empty string when percent=3", () => {
		const { el } = setupWithSpy(makeOccurrences(6), { ...RESULT_20PCT, percent: 3 });
		const label = el.querySelector(".regression-label");
		expect(label?.textContent?.trim()).toBe("");
	});

	it("T7: regression-label text content is empty string when percent is null", () => {
		const { el } = setupWithSpy(makeOccurrences(6), { ...RESULT_20PCT, percent: null });
		const label = el.querySelector(".regression-label");
		expect(label?.textContent?.trim()).toBe("");
	});

	it("T8: no regression-line when spy returns null for 6 occurrences", () => {
		const { el } = setupWithSpy(makeOccurrences(6), null);
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

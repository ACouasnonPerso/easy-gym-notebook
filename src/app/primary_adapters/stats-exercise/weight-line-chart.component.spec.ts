import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { WeightLineChartComponent } from "./weight-line-chart.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";

const FR_TRANSLATIONS = {
	common: { weight: "Poids", noData: "Aucune donnée" },
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
	imports: [WeightLineChartComponent],
	template: `<app-weight-line-chart [occurrences]="occurrences" [groupBy]="groupBy" />`,
})
class HostComponent {
	occurrences: ExerciseOccurrence[] = [];
	groupBy: GroupBy = 'session';
}

function makeOccurrences(count: number, baseWeightKg = 80): ExerciseOccurrence[] {
	return Array.from({ length: count }, (_, i) => ({
		exerciseId: "ex1",
		sessionId: `sess${i}`,
		date: new Date(2026, 0, i + 1),
		name: "Squat",
		weightKg: baseWeightKg + i,
		sets: 3,
		reps: 5,
		breakDurationSeconds: 90,
		volumeKg: (baseWeightKg + i) * 15,
		status: "validated" as const,
		rating: null,
		comment: null,
		setBreakdown: [],
	}));
}

describe("WeightLineChartComponent — graphique de progression du poids", () => {
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

	it("devrait afficher un cercle orange quand il y a une seule occurrence", () => {
		const occurrence: ExerciseOccurrence = {
			exerciseId: "ex1",
			sessionId: "sess1",
			date: new Date("2026-01-15"),
			name: "Squat",
			weightKg: 80,
			sets: 4,
			reps: 8,
			breakDurationSeconds: 90,
			volumeKg: 2560,
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		const circles = el.querySelectorAll("circle");
		expect(circles.length).toBe(1);
		expect(circles[0].getAttribute("fill")).toBe("#f97316");
	});

	it("devrait afficher le label de poids en kg sur chaque point", () => {
		const occurrence: ExerciseOccurrence = {
			exerciseId: "ex1",
			sessionId: "sess1",
			date: new Date("2026-01-15"),
			name: "Squat",
			weightKg: 100,
			sets: 3,
			reps: 5,
			breakDurationSeconds: 90,
			volumeKg: 1500,
			status: "validated",
			rating: null,
			comment: null,
			setBreakdown: [],
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("100 kg");
	});

	describe("réduction de fréquence des labels", () => {
		it("devrait afficher tous les labels de poids pour <= 10 occurrences", () => {
			const occurrences = makeOccurrences(10, 80);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const weightTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			expect(weightTexts.length).toBe(10);
		});

		it("devrait afficher 1 label sur 2 pour 11 occurrences (> 10)", () => {
			const occurrences = makeOccurrences(11, 80);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const weightTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			// step=2 : index 0,2,4,6,8,10 => 6 labels
			expect(weightTexts.length).toBe(6);
		});

		it("devrait afficher 1 label sur 5 pour 25 occurrences (> 20)", () => {
			const occurrences = makeOccurrences(25, 80);
			setup(occurrences);

			const el: HTMLElement = hostFixture.nativeElement;
			const weightTexts = Array.from(el.querySelectorAll("text")).filter((t) => t.textContent?.includes("kg"));
			// step=5 : index 0,5,10,15,20 => 5 labels
			expect(weightTexts.length).toBe(5);
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

		it("T15: avec groupBy='week', les labels de l'axe X sont au format S{n}", () => {
			setup([occ16Mar], 'week');
			const el = hostFixture.nativeElement as HTMLElement;
			const labels = Array.from(el.querySelectorAll("text")).filter((t) =>
				/^S\d+$/.test(t.textContent?.trim() ?? "")
			);
			expect(labels.length).toBe(1);
			expect(labels[0].textContent?.trim()).toBe("S12");
		});

		it("T16: avec groupBy='month', les labels de l'axe X sont les noms de mois abrégés", () => {
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

describe("WeightLineChartComponent — regression overlay smoke tests", () => {
	function setup(occurrences: ExerciseOccurrence[], groupBy: GroupBy = 'session') {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
		});
		const translate = TestBed.inject(TranslateService);
		translate.setDefaultLang("fr");
		translate.use("fr");
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.occurrences = occurrences;
		fixture.componentInstance.groupBy = groupBy;
		fixture.detectChanges();
		return fixture.nativeElement as HTMLElement;
	}

	it("should render regression-line when 6 occurrences with varying weights", () => {
		const occs = makeOccurrences(6, 80);
		const el = setup(occs);
		expect(el.querySelector(".regression-line")).not.toBeNull();
	});

	it("should NOT render regression-line when only 5 occurrences", () => {
		const occs = makeOccurrences(5, 80);
		const el = setup(occs);
		expect(el.querySelector(".regression-line")).toBeNull();
	});
});

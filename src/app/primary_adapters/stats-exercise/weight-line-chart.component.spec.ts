import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { WeightLineChartComponent } from "./weight-line-chart.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

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
	template: `<app-weight-line-chart [occurrences]="occurrences" />`,
})
class HostComponent {
	occurrences: ExerciseOccurrence[] = [];
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

	function setup(occurrences: ExerciseOccurrence[]) {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
		});
		setupI18n();
		hostFixture = TestBed.createComponent(HostComponent);
		hostFixture.componentInstance.occurrences = occurrences;
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
});

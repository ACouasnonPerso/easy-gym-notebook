import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const FR_TRANSLATIONS = {
	common: { volume: "Volume", noData: "Aucune donnée" },
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
	template: `<app-volume-line-chart [occurrences]="occurrences" />`,
})
class HostComponent {
	occurrences: ExerciseOccurrence[] = [];
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
	}));
}

describe("VolumeLineChartComponent — graphique de progression du volume", () => {
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
		};
		setup([occurrence]);

		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.textContent).toContain("1200 kg");
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
});

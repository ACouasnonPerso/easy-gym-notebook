import { TestBed, ComponentFixture } from "@angular/core/testing";
import { signal } from "@angular/core";
import { StatsExerciseComponent } from "./stats-exercise.component";
import { GetExerciseStatsUseCase } from "../../primary_ports/stats-exercise/get-exercise-stats.usecase";
import { UpdateExerciseUseCase } from "../../primary_ports/session-detail/update-exercise.usecase";
import { ChartSelectionService } from "./chart-selection.service";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const FR_TRANSLATIONS = {
	common: { back: "Retour", volume: "Volume", weight: "Poids", noData: "Aucune donnée", duration: "Durée" },
	statsExercise: { distanceKm: "km", volumeFormula: "= Poids x Rep x Series" },
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

function makeUseCaseSpy() {
	return {
		occurrences: signal([]),
		cardioOccurrences: signal([]),
		isCardio: signal(false),
		execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()),
	};
}

describe("StatsExerciseComponent — rechargement après commentaire", () => {
	let fixture: ComponentFixture<StatsExerciseComponent>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let getExerciseStatsUseCaseSpy: any;

	beforeEach(() => {
		getExerciseStatsUseCaseSpy = makeUseCaseSpy();

		TestBed.configureTestingModule({
			imports: [StatsExerciseComponent, translateModuleConfig],
			providers: [
				{ provide: GetExerciseStatsUseCase, useValue: getExerciseStatsUseCaseSpy },
				{
					provide: UpdateExerciseUseCase,
					useValue: { execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()) },
				},
				{ provide: ActivatedRoute, useValue: { snapshot: { params: { exerciseName: "Bench%20Press" } } } },
				{ provide: Location, useValue: { back: jasmine.createSpy("back") } },
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseComponent);
		fixture.detectChanges();
	});

	it("should reload exercise stats after a comment is edited", async () => {
		const component = fixture.componentInstance;

		await component.onCommentEdited({ exerciseId: "ex-1", comment: "Great set" });

		expect(getExerciseStatsUseCaseSpy.execute).toHaveBeenCalledTimes(2); // once on init, once after save
	});
});

describe("StatsExerciseComponent — sélecteur de graphique", () => {
	let fixture: ComponentFixture<StatsExerciseComponent>;
	let chartSelectionService: ChartSelectionService;

	function setup(selectedChart: "volume" | "weight" = "volume") {
		localStorage.clear();
		if (selectedChart === "weight") localStorage.setItem("chart-selection", "weight");

		TestBed.configureTestingModule({
			imports: [StatsExerciseComponent, translateModuleConfig],
			providers: [
				{ provide: GetExerciseStatsUseCase, useValue: makeUseCaseSpy() },
				{
					provide: UpdateExerciseUseCase,
					useValue: { execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()) },
				},
				{ provide: ActivatedRoute, useValue: { snapshot: { params: { exerciseName: "Squat" } } } },
				{ provide: Location, useValue: { back: jasmine.createSpy("back") } },
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(StatsExerciseComponent);
		chartSelectionService = TestBed.inject(ChartSelectionService);
		fixture.detectChanges();
	}

	it("devrait afficher un sélecteur avec les options Volume et Poids", () => {
		setup();

		const el: HTMLElement = fixture.nativeElement;
		const buttons = Array.from(el.querySelectorAll("button"));
		const labels = buttons.map((b) => b.textContent?.trim());

		expect(labels).toContain("Volume");
		expect(labels).toContain("Poids");
	});

	it("devrait afficher le graphique Volume par défaut (app-volume-line-chart visible)", () => {
		setup("volume");

		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector("app-volume-line-chart")).not.toBeNull();
		expect(el.querySelector("app-weight-line-chart")).toBeNull();
	});

	it('devrait afficher le graphique Poids quand "weight" est sélectionné dans le localStorage', () => {
		setup("weight");

		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector("app-weight-line-chart")).not.toBeNull();
		expect(el.querySelector("app-volume-line-chart")).toBeNull();
	});
});

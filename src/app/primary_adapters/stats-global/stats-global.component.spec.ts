import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";
import { StatsGlobalComponent } from "./stats-global.component";
import { StatsExerciseListCardComponent } from "./stats-exercise-list-card.component";
import { GetGlobalStatsUseCase } from "../../primary_ports/stats-global/get-global-stats.usecase";
import { SelectMonthUseCase } from "../../primary_ports/stats-global/select-month.usecase";
import { SelectViewTypeUseCase } from "../../primary_ports/stats-global/select-view-type.usecase";
import { MergeExercisesUseCase } from "../../primary_ports/stats-global/merge-exercises.usecase";
import { ImportDataUseCase } from "../../primary_ports/stats-global/import-data.usecase";
import { Router } from "@angular/router";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

function makeRepoProviders() {
	return [
		{
			provide: SESSION_REPOSITORY,
			useValue: { getAll: jasmine.createSpy("getAll").and.returnValue(Promise.resolve([])) },
		},
		{
			provide: EXERCISE_REPOSITORY,
			useValue: { getAll: jasmine.createSpy("getAll").and.returnValue(Promise.resolve([])) },
		},
	];
}

const FR_TRANSLATIONS = {
	statsGlobal: {
		currentYear: "Annee en cours",
		total: "Total",
		trainingRecurrences: "Training recurrences",
		weekSummary: "Resume de la semaine",
		monthSummary: "Resume du mois",
		totalSummary: "Recap total",
		yearSummary: "Recap annee",
		workedMuscles: "Muscles sollicites",
		newNamePlaceholder: "Nouveau nom",
		mergeCount: "Fusionner ({{ count }})",
		confirmMergeTitle: "Confirmer la fusion",
		confirmMergeBody: "",
	},
	common: {
		cancel: "Annuler",
		confirm: "Confirmer",
		weight: "Poids",
		exercises: "Exercices",
		time: "Temps",
		sessions: "Sessions",
		merge: "Fusionner",
	},
	days: { mon: "L", tue: "M", wed: "M", thu: "J", fri: "V", sat: "S", sun: "D" },
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(FR_TRANSLATIONS as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n() {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("fr");
	translate.use("fr");
}

function makeGetGlobalStatsUseCaseSpy() {
	return {
		heatmapData: signal([]),
		monthSummary: signal({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 }),
		weekSummary: signal({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 }),
		weeklyAverage: signal({ avgWeightKg: 0, sessionsPerWeek: 0, avgDurationSeconds: 0 }),
		muscleGroupDistribution: signal([]),
		muscleGroupDetails: signal(new Map()),
		exerciseSummaries: signal([]),
		sessionDurationsInMonth: signal([] as { date: Date; durationSeconds: number }[]),
		selectedMonth: signal(new Date()),
		execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()),
	};
}

function makeMergeExercisesUseCaseSpy() {
	return {
		execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()),
	};
}

function makeImportDataUseCaseSpy() {
	return {
		importCount: signal(0),
		importError: signal<string | null>(null),
		importPending: signal(false),
		validate: jasmine.createSpy("validate").and.returnValue(Promise.resolve()),
		persist: jasmine.createSpy("persist").and.returnValue(Promise.resolve()),
	};
}

function makeProviders(
	overrides: {
		exerciseSummaries?: ReturnType<
			typeof signal<{ name: string; maxWeightKg: number; totalVolumeKg: number; occurrenceCount: number }[]>
		>;
	} = {}
) {
	const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
	if (overrides.exerciseSummaries) {
		statsUseCaseSpy.exerciseSummaries = overrides.exerciseSummaries as any;
	}
	return {
		statsUseCaseSpy,
		selectMonthUseCaseSpy: { execute: jasmine.createSpy("execute") },
		mergeUseCaseSpy: makeMergeExercisesUseCaseSpy(),
		routerSpy: { navigate: jasmine.createSpy("navigate") },
	};
}

describe("StatsGlobalComponent — formatDuration", () => {
	let component: StatsGlobalComponent;

	beforeEach(() => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		component = TestBed.createComponent(StatsGlobalComponent).componentInstance;
	});

	it('devrait afficher "0min" pour une durée de zéro seconde', () => {
		expect(component.formatDuration(0)).toBe("0min");
	});

	it('devrait afficher "11min" pour 660 secondes (11 minutes)', () => {
		expect(component.formatDuration(660)).toBe("11min");
	});

	it('devrait afficher "1h1" pour 3660 secondes (1h01 — sans zéro de remplissage)', () => {
		expect(component.formatDuration(3660)).toBe("1h1");
	});

	it('devrait afficher "1h10" pour 4200 secondes (1 heure 10 minutes)', () => {
		expect(component.formatDuration(4200)).toBe("1h10");
	});
});

describe("StatsGlobalComponent — sélecteur de vue (année en cours et total)", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;

	beforeEach(() => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();
	});

	it("devrait afficher la heatmap quand un mois normal est sélectionné (index 3)", () => {
		fixture.componentInstance.selectedMonthIndex.set(3);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const heatmapCard = Array.from(el.querySelectorAll(".stats-card-title")).find(
			(t) => t.textContent?.trim() === "Training recurrences"
		);

		expect(heatmapCard).toBeTruthy();
	});

	it("devrait masquer la heatmap quand 'Annee en cours' est sélectionné (index 0)", () => {
		fixture.componentInstance.selectedMonthIndex.set(0);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const heatmapCard = Array.from(el.querySelectorAll(".stats-card-title")).find(
			(t) => t.textContent?.trim() === "Training recurrences"
		);

		expect(heatmapCard).toBeUndefined();
	});

	it("devrait masquer la heatmap quand 'Total' est sélectionné (index 1)", () => {
		fixture.componentInstance.selectedMonthIndex.set(1);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const heatmapCard = Array.from(el.querySelectorAll(".stats-card-title")).find(
			(t) => t.textContent?.trim() === "Training recurrences"
		);

		expect(heatmapCard).toBeUndefined();
	});
});

describe("StatsGlobalComponent — résumé de la semaine", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;

	function setup(monthIndex: number) {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		// Make week != month so weekSameAsMonth() is false
		statsUseCaseSpy.weekSummary = signal({ totalWeightKg: 500, sessionCount: 1, totalDurationSeconds: 1800 });
		statsUseCaseSpy.monthSummary = signal({ totalWeightKg: 1000, sessionCount: 3, totalDurationSeconds: 5400 });
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges(); // triggers ngOnInit which sets selectedMonthIndex to 2
		fixture.componentInstance.selectedMonthIndex.set(monthIndex);
		fixture.detectChanges();
	}

	it("devrait afficher le résumé de la semaine quand le mois courant est sélectionné", () => {
		setup(3);

		const el: HTMLElement = fixture.nativeElement;
		const titles = Array.from(el.querySelectorAll(".stats-card-title"));
		const weekSummaryTitle = titles.find((t) => t.textContent?.trim() === "Resume de la semaine");

		expect(weekSummaryTitle).toBeTruthy();
	});

	it("devrait masquer le résumé de la semaine quand un mois passé est sélectionné", () => {
		setup(4);

		const el: HTMLElement = fixture.nativeElement;
		const titles = Array.from(el.querySelectorAll(".stats-card-title"));
		const weekSummaryTitle = titles.find((t) => t.textContent?.trim() === "Resume de la semaine");

		expect(weekSummaryTitle).toBeUndefined();
	});
});

describe("StatsGlobalComponent — merge d'exercices", () => {
	let fixture: ReturnType<typeof TestBed.createComponent<StatsGlobalComponent>>;
	let mergeUseCaseSpy: ReturnType<typeof makeMergeExercisesUseCaseSpy>;

	const twoExercises = signal([
		{ name: "Développé couché", maxWeightKg: 80, totalVolumeKg: 2560, occurrenceCount: 4 },
		{ name: "Squat", maxWeightKg: 100, totalVolumeKg: 3200, occurrenceCount: 3 },
	]);

	beforeEach(() => {
		const {
			statsUseCaseSpy,
			selectMonthUseCaseSpy,
			mergeUseCaseSpy: mu,
			routerSpy,
		} = makeProviders({ exerciseSummaries: twoExercises });
		mergeUseCaseSpy = mu;

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();
	});

	it('devrait afficher un bouton "Merge" dans la carte exercices', () => {
		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector('[data-testid="merge-btn"]');
		expect(mergeBtn).toBeTruthy();
	});

	it('devrait activer le mode merge quand on clique sur le bouton "Merge"', () => {
		const el: HTMLElement = fixture.nativeElement;
		const mergeBtn = el.querySelector<HTMLElement>('[data-testid="merge-btn"]')!;
		mergeBtn.click();
		fixture.detectChanges();

		const exerciseListCard = fixture.debugElement.query(By.directive(StatsExerciseListCardComponent)).componentInstance;
		expect(exerciseListCard.isMergeMode()).toBeTrue();
	});

	it("devrait afficher des cases à cocher sur chaque exercice en mode merge", () => {
		const exerciseListCard = fixture.debugElement.query(By.directive(StatsExerciseListCardComponent)).componentInstance;
		exerciseListCard.isMergeMode.set(true);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const checkboxes = el.querySelectorAll('[data-testid="exercise-merge-checkbox"]');
		expect(checkboxes.length).toBe(2);
	});

	it("devrait afficher la popup de confirmation quand on soumet le merge", () => {
		const exerciseListCard = fixture.debugElement.query(By.directive(StatsExerciseListCardComponent)).componentInstance;
		exerciseListCard.isMergeMode.set(true);
		exerciseListCard.mergeSelectedNames.set(new Set(["Développé couché", "Squat"]));
		exerciseListCard.mergeNewName.set("Compound");
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const submitBtn = el.querySelector<HTMLElement>('[data-testid="merge-submit-btn"]')!;
		submitBtn.click();
		fixture.detectChanges();

		const popup = el.querySelector('[data-testid="merge-confirm-popup"]');
		expect(popup).toBeTruthy();
	});

	it("devrait appeler MergeExercisesUseCase.execute avec les noms sélectionnés et le nouveau nom", async () => {
		const exerciseListCard = fixture.debugElement.query(By.directive(StatsExerciseListCardComponent)).componentInstance;
		exerciseListCard.isMergeMode.set(true);
		exerciseListCard.mergeSelectedNames.set(new Set(["Développé couché", "Squat"]));
		exerciseListCard.mergeNewName.set("Compound");
		exerciseListCard.showMergeConfirm.set(true);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const confirmBtn = el.querySelector<HTMLElement>('[data-testid="merge-confirm-ok-btn"]')!;
		confirmBtn.click();
		fixture.detectChanges();

		await fixture.whenStable();

		expect(mergeUseCaseSpy.execute).toHaveBeenCalledWith(
			jasmine.arrayContaining(["Développé couché", "Squat"]),
			"Compound"
		);
	});
});

describe("StatsGlobalComponent — sélecteur de vue (cette semaine)", () => {
	let component: StatsGlobalComponent;
	let selectViewTypeUseCaseSpy: { execute: jasmine.Spy };

	beforeEach(() => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		selectViewTypeUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: SelectViewTypeUseCase, useValue: selectViewTypeUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		component = TestBed.createComponent(StatsGlobalComponent).componentInstance;
		component.ngOnInit();
	});

	it("devrait appeler selectViewTypeUseCase.execute('current-week') quand 'cette semaine' est sélectionné (index 2)", () => {
		component.onMonthChange(2); // index 2 = "cette semaine"

		expect(selectViewTypeUseCaseSpy.execute).toHaveBeenCalledWith("current-week");
	});
});

describe("StatsGlobalComponent — titre du récap (summaryTitle)", () => {
	let component: StatsGlobalComponent;

	beforeEach(() => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		component = TestBed.createComponent(StatsGlobalComponent).componentInstance;
		component.ngOnInit();
	});

	it("devrait retourner 'statsGlobal.monthSummary' quand un mois normal est sélectionné", () => {
		component.selectedMonthIndex.set(3); // index 3 = premier mois normal (0=year, 1=total, 2=week)
		expect(component.summaryTitle()).toBe("statsGlobal.monthSummary");
	});

	it("devrait retourner 'statsGlobal.totalSummary' quand 'total' est sélectionné (index 1)", () => {
		component.selectedMonthIndex.set(1); // index 1 = total
		expect(component.summaryTitle()).toBe("statsGlobal.totalSummary");
	});

	it("devrait retourner 'statsGlobal.yearSummary' quand 'Annee en cours' est sélectionné (index 0)", () => {
		component.selectedMonthIndex.set(0); // index 0 = current-year
		expect(component.summaryTitle()).toBe("statsGlobal.yearSummary");
	});
});

describe("StatsGlobalComponent — titre du récap dans le DOM", () => {
	function setup(monthIndex: number) {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		const selectMonthUseCaseSpy = { execute: jasmine.createSpy("execute") };
		const mergeUseCaseSpy = makeMergeExercisesUseCaseSpy();
		const routerSpy = { navigate: jasmine.createSpy("navigate") };

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: selectMonthUseCaseSpy },
				{ provide: MergeExercisesUseCase, useValue: mergeUseCaseSpy },
				{ provide: Router, useValue: routerSpy },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		const fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();
		fixture.componentInstance.selectedMonthIndex.set(monthIndex);
		fixture.detectChanges();
		return fixture;
	}

	it("devrait afficher 'Recap total' dans le titre du récap quand 'Total' est sélectionné", () => {
		const fixture = setup(1);
		const el: HTMLElement = fixture.nativeElement;
		const titles = Array.from(el.querySelectorAll(".stats-card-title"));
		const summaryTitle = titles.find((t) => t.textContent?.trim() === "Recap total");
		expect(summaryTitle).toBeTruthy();
	});
});

describe("StatsGlobalComponent — liste des exercices (current-week)", () => {
	function setupWithCurrentWeekAndExercises() {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		statsUseCaseSpy.exerciseSummaries = signal([
			{ name: "Squat", maxWeightKg: 100, totalVolumeKg: 3200, occurrenceCount: 3 },
		]) as any;

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: { execute: jasmine.createSpy("execute") } },
				{ provide: SelectViewTypeUseCase, useValue: { execute: jasmine.createSpy("execute") } },
				{ provide: MergeExercisesUseCase, useValue: makeMergeExercisesUseCaseSpy() },
				{ provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});

		setupI18n();
		const fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();
		// index 2 = "current-week" (after current-year at 0, total at 1)
		fixture.componentInstance.selectedMonthIndex.set(2);
		fixture.detectChanges();
		return fixture;
	}

	it("devrait afficher la carte des exercices quand 'cette semaine' est sélectionné et qu'il y a des exercices", () => {
		const fixture = setupWithCurrentWeekAndExercises();
		const el: HTMLElement = fixture.nativeElement;
		const card = el.querySelector("app-stats-exercise-list-card");
		expect(card).toBeTruthy();
	});
});

describe("StatsGlobalComponent — graphique de durée des séances", () => {
	it("devrait masquer le bloc chart quand sessionDurationsInMonth est vide", () => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		statsUseCaseSpy.sessionDurationsInMonth = signal([]);

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: { execute: jasmine.createSpy("execute") } },
				{
					provide: MergeExercisesUseCase,
					useValue: { execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()) },
				},
				{ provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});
		setupI18n();

		const fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const chart = el.querySelector('[data-testid="training-time-bar-chart"]');
		expect(chart).toBeNull();
	});

	it("devrait afficher le bloc chart quand au moins une séance a une durée > 0", () => {
		const statsUseCaseSpy = makeGetGlobalStatsUseCaseSpy();
		statsUseCaseSpy.sessionDurationsInMonth = signal([{ date: new Date(2026, 2, 10), durationSeconds: 3600 }]);

		TestBed.configureTestingModule({
			imports: [StatsGlobalComponent, translateModuleConfig],
			providers: [
				{ provide: GetGlobalStatsUseCase, useValue: statsUseCaseSpy },
				{ provide: SelectMonthUseCase, useValue: { execute: jasmine.createSpy("execute") } },
				{
					provide: MergeExercisesUseCase,
					useValue: { execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()) },
				},
				{ provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
				{ provide: ImportDataUseCase, useValue: makeImportDataUseCaseSpy() },
				...makeRepoProviders(),
			],
		});
		setupI18n();

		const fixture = TestBed.createComponent(StatsGlobalComponent);
		fixture.detectChanges();

		const el: HTMLElement = fixture.nativeElement;
		const chart = el.querySelector('[data-testid="training-time-bar-chart"]');
		expect(chart).toBeTruthy();
	});
});

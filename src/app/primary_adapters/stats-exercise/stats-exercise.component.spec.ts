import { TestBed, ComponentFixture } from "@angular/core/testing";
import { signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { StatsExerciseComponent } from "./stats-exercise.component";
import { GetExerciseStatsUseCase } from "../../primary_ports/stats-exercise/get-exercise-stats.usecase";
import { UpdateExerciseUseCase } from "../../primary_ports/session-detail/update-exercise.usecase";
import { ChartSelectionService } from "./chart-selection.service";
import { StatsExerciseChartCardComponent } from "./stats-exercise-chart-card.component";
import { ExerciseHistoryListComponent } from "./exercise-history-list.component";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const FR_TRANSLATIONS = {
	common: { back: "Retour", volume: "Volume", weight: "Poids", noData: "Aucune donnée", duration: "Durée" },
	statsExercise: {
		distanceKm: "km",
		volumeFormula: "= Poids x Rep x Series",
		groupBy: { session: "Session", week: "Semaine", month: "Mois", year: "Année" },
	},
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

// ── Block A ───────────────────────────────────────────────────────────────────

describe("StatsExerciseComponent — rendu du sélecteur groupBy", () => {
	let fixture: ComponentFixture<StatsExerciseComponent>;

	function setup() {
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
		fixture.detectChanges();
	}

	it("should render app-group-by-selector in the page", () => {
		setup();
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector("app-group-by-selector")).not.toBeNull();
	});

	it("should render app-group-by-selector before app-stats-exercise-chart-card in DOM order", () => {
		setup();
		const page = fixture.nativeElement.querySelector(".page") as HTMLElement;
		const children = Array.from(page.children);
		const selectorIdx = children.findIndex((c) => c.tagName.toLowerCase() === "app-group-by-selector");
		const chartCardIdx = children.findIndex((c) => c.tagName.toLowerCase() === "app-stats-exercise-chart-card");
		expect(selectorIdx).toBeGreaterThanOrEqual(0);
		expect(chartCardIdx).toBeGreaterThanOrEqual(0);
		expect(selectorIdx).toBeLessThan(chartCardIdx);
	});

	it("should display 'Session' label in the selector trigger by default", () => {
		setup();
		const el: HTMLElement = fixture.nativeElement;
		const label = el.querySelector("app-group-by-selector .label");
		expect(label).not.toBeNull();
		expect(label!.textContent?.trim()).toBe("Session");
	});
});

// ── Block B ───────────────────────────────────────────────────────────────────

describe("StatsExerciseComponent — signal groupBy éphémère", () => {
	function buildProviders() {
		return [
			{ provide: GetExerciseStatsUseCase, useValue: makeUseCaseSpy() },
			{
				provide: UpdateExerciseUseCase,
				useValue: { execute: jasmine.createSpy("execute").and.returnValue(Promise.resolve()) },
			},
			{ provide: ActivatedRoute, useValue: { snapshot: { params: { exerciseName: "Squat" } } } },
			{ provide: Location, useValue: { back: jasmine.createSpy("back") } },
		];
	}

	function setup(): ComponentFixture<StatsExerciseComponent> {
		TestBed.configureTestingModule({
			imports: [StatsExerciseComponent, translateModuleConfig],
			providers: buildProviders(),
		});
		setupI18n();
		const f = TestBed.createComponent(StatsExerciseComponent);
		f.detectChanges();
		return f;
	}

	it("should expose a groupBy signal initialised to 'session'", () => {
		const f = setup();
		expect((f.componentInstance as unknown as { groupBy: () => GroupBy }).groupBy()).toBe("session");
	});

	it("should update groupBy signal to 'week' when onGroupByChange('week') is called", () => {
		const f = setup();
		const component = f.componentInstance as unknown as { groupBy: () => GroupBy; onGroupByChange: (v: GroupBy) => void };
		component.onGroupByChange("week");
		expect(component.groupBy()).toBe("week");
	});

	it("should not read from localStorage when initialising groupBy", () => {
		spyOn(window.localStorage, "getItem").and.callThrough();
		setup();
		const calls = (window.localStorage.getItem as jasmine.Spy).calls.allArgs();
		const groupKeyCalls = calls.filter((args: unknown[]) => typeof args[0] === "string" && (args[0] as string).toLowerCase().includes("group"));
		expect(groupKeyCalls.length).toBe(0);
	});

	it("should reset to 'session' on a new component instance", () => {
		const f1 = setup();
		const c1 = f1.componentInstance as unknown as { groupBy: () => GroupBy; onGroupByChange: (v: GroupBy) => void };
		c1.onGroupByChange("year");
		expect(c1.groupBy()).toBe("year");

		TestBed.resetTestingModule();

		TestBed.configureTestingModule({
			imports: [StatsExerciseComponent, translateModuleConfig],
			providers: buildProviders(),
		});
		setupI18n();
		const f2 = TestBed.createComponent(StatsExerciseComponent);
		f2.detectChanges();
		const c2 = f2.componentInstance as unknown as { groupBy: () => GroupBy };
		expect(c2.groupBy()).toBe("session");
	});
});

// ── Block C ───────────────────────────────────────────────────────────────────

describe("StatsExerciseComponent — transmission à la chart card et à la liste historique", () => {
	let fixture: ComponentFixture<StatsExerciseComponent>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let useCaseSpy: any;

	function setup() {
		useCaseSpy = makeUseCaseSpy();
		TestBed.configureTestingModule({
			imports: [StatsExerciseComponent, translateModuleConfig],
			providers: [
				{ provide: GetExerciseStatsUseCase, useValue: useCaseSpy },
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
		fixture.detectChanges();
	}

	it("should pass groupBy() value 'session' to the chart card by default", () => {
		setup();
		const chartCard = fixture.debugElement
			.query(By.directive(StatsExerciseChartCardComponent))
			.componentInstance as StatsExerciseChartCardComponent;
		expect(chartCard.groupBy()).toBe("session");
	});

	it("should propagate updated groupBy 'week' to the chart card after onGroupByChange('week') and detectChanges()", () => {
		setup();
		const component = fixture.componentInstance as unknown as { onGroupByChange: (v: GroupBy) => void };
		component.onGroupByChange("week");
		fixture.detectChanges();
		const chartCard = fixture.debugElement
			.query(By.directive(StatsExerciseChartCardComponent))
			.componentInstance as StatsExerciseChartCardComponent;
		expect(chartCard.groupBy()).toBe("week");
	});

	it("should pass raw useCase.occurrences() to exercise-history-list regardless of groupBy", () => {
		setup();
		const component = fixture.componentInstance as unknown as { onGroupByChange: (v: GroupBy) => void };
		component.onGroupByChange("month");
		fixture.detectChanges();
		const historyList = fixture.debugElement
			.query(By.directive(ExerciseHistoryListComponent))
			.componentInstance as ExerciseHistoryListComponent;
		expect(historyList.occurrences()).toEqual(useCaseSpy.occurrences());
	});
});

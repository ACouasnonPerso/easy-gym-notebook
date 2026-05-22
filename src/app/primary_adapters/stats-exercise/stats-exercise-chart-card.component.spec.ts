import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { StatsExerciseChartCardComponent } from "./stats-exercise-chart-card.component";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { ChartType } from "./chart-selection.service";
import { AggregationMode, GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { ExerciseOccurrenceGroupingService } from "../../core_logic/stats-exercise/exercise-occurrence-grouping.service";
import { VolumeLineChartComponent } from "./volume-line-chart.component";
import { CardioTimeChartComponent } from "./cardio-time-chart.component";
import { AggregationToggleComponent } from "./aggregation-toggle.component";
import { TranslateLoader, TranslateModule, TranslateService, TranslationObject } from "@ngx-translate/core";
import { Observable, of } from "rxjs";

const TRANSLATIONS = {
	common: {
		volume: "Volume",
		weight: "Weight",
		totalReps: "Total reps",
		duration: "Duration",
		distance: "Distance",
	},
	statsExercise: {
		pace: "Pace",
		speed: "Speed",
		aggregation: {
			average: "Average",
			sum: "Sum",
			sameToast: "Average = Sum for this period",
		},
	},
};

class FakeTranslateLoader implements TranslateLoader {
	getTranslation(_lang: string): Observable<TranslationObject> {
		return of(TRANSLATIONS as unknown as TranslationObject);
	}
}

const translateModuleConfig = TranslateModule.forRoot({
	loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
});

function setupI18n(): void {
	const translate = TestBed.inject(TranslateService);
	translate.setDefaultLang("en");
	translate.use("en");
}

@Component({
	standalone: true,
	imports: [StatsExerciseChartCardComponent],
	template: `
		<app-stats-exercise-chart-card
			[isCardio]="isCardio"
			[occurrences]="occurrences"
			[cardioOccurrences]="cardioOccurrences"
			[selectedChart]="selectedChart"
			[groupBy]="groupBy"
			(chartSelect)="lastChartSelect = $event"
		/>
	`,
})
class HostComponent {
	isCardio = false;
	occurrences: ExerciseOccurrence[] = [];
	cardioOccurrences: CardioOccurrence[] = [];
	selectedChart: ChartType = "volume";
	groupBy: GroupBy = "session";
	lastChartSelect: ChartType | null = null;
}

function makeOccurrences(count: number): ExerciseOccurrence[] {
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
		totalReps: 15,
		status: "validated" as const,
		rating: null,
		comment: null,
		setBreakdown: [],
	}));
}

function makeCardioOccurrences(count: number): CardioOccurrence[] {
	return Array.from({ length: count }, (_, i) => ({
		date: new Date(2026, 0, i + 1),
		durationSeconds: 1800,
		distanceKm: 5,
	}));
}

describe("StatsExerciseChartCardComponent", () => {
	let hostFixture: ComponentFixture<HostComponent>;
	let host: HostComponent;

	function setup(
		props: Partial<{
			isCardio: boolean;
			occurrences: ExerciseOccurrence[];
			cardioOccurrences: CardioOccurrence[];
			selectedChart: ChartType;
			groupBy: GroupBy;
		}> = {}
	) {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
		});
		setupI18n();
		hostFixture = TestBed.createComponent(HostComponent);
		host = hostFixture.componentInstance;
		if (props.isCardio !== undefined) host.isCardio = props.isCardio;
		if (props.occurrences !== undefined) host.occurrences = props.occurrences;
		if (props.cardioOccurrences !== undefined) host.cardioOccurrences = props.cardioOccurrences;
		if (props.selectedChart !== undefined) host.selectedChart = props.selectedChart;
		if (props.groupBy !== undefined) host.groupBy = props.groupBy;
		hostFixture.detectChanges();
	}

	// strength mode - tab bar structure
	it("should render exactly three tab buttons in strength mode", () => {
		setup({ isCardio: false, selectedChart: "volume" });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelectorAll(".tab-btn").length).toBe(3);
	});

	it("should render Volume, Weight, and Total Reps tabs in that order", () => {
		setup({ isCardio: false });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		const texts = tabs.map((t) => t.textContent?.trim());
		expect(texts).toEqual(["Volume", "Weight", "Total reps"]);
	});

	it("should use common.totalReps i18n key as the Total Reps tab label", () => {
		setup({ isCardio: false });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		expect(tabs[2].textContent?.trim()).toContain("Total reps");
	});

	// strength mode - active tab state
	it("should mark only Volume tab as active when selectedChart is volume", () => {
		setup({ isCardio: false, selectedChart: "volume" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		expect(tabs[0].classList.contains("active")).toBeTrue();
		expect(tabs[1].classList.contains("active")).toBeFalse();
		expect(tabs[2].classList.contains("active")).toBeFalse();
	});

	it("should mark only Weight tab as active when selectedChart is weight", () => {
		setup({ isCardio: false, selectedChart: "weight" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		expect(tabs[0].classList.contains("active")).toBeFalse();
		expect(tabs[1].classList.contains("active")).toBeTrue();
		expect(tabs[2].classList.contains("active")).toBeFalse();
	});

	it("should mark only Total Reps tab as active when selectedChart is reps", () => {
		setup({ isCardio: false, selectedChart: "reps" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		expect(tabs[0].classList.contains("active")).toBeFalse();
		expect(tabs[1].classList.contains("active")).toBeFalse();
		expect(tabs[2].classList.contains("active")).toBeTrue();
	});

	// strength mode - chart rendering
	it("should render app-volume-line-chart when selectedChart is volume", () => {
		setup({ isCardio: false, selectedChart: "volume" });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-volume-line-chart")).not.toBeNull();
		expect(el.querySelector("app-weight-line-chart")).toBeNull();
		expect(el.querySelector("app-total-reps-line-chart")).toBeNull();
	});

	it("should render app-weight-line-chart when selectedChart is weight", () => {
		setup({ isCardio: false, selectedChart: "weight" });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-weight-line-chart")).not.toBeNull();
		expect(el.querySelector("app-volume-line-chart")).toBeNull();
		expect(el.querySelector("app-total-reps-line-chart")).toBeNull();
	});

	it("should render app-total-reps-line-chart when selectedChart is reps", () => {
		setup({ isCardio: false, selectedChart: "reps" });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-total-reps-line-chart")).not.toBeNull();
		expect(el.querySelector("app-volume-line-chart")).toBeNull();
		expect(el.querySelector("app-weight-line-chart")).toBeNull();
	});

	it("should pass occurrences to app-total-reps-line-chart", () => {
		setup({ isCardio: false, selectedChart: "reps", occurrences: makeOccurrences(3) });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-total-reps-line-chart")).not.toBeNull();
		expect(el.querySelector("circle")).not.toBeNull();
	});

	// strength mode - tab click interactions
	it("should emit chartSelect(reps) when Total Reps tab clicked", () => {
		setup({ isCardio: false, selectedChart: "volume" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>(".tab-btn"));
		tabs[2].click();
		expect(host.lastChartSelect).toBe("reps");
	});

	it("should emit chartSelect(volume) when Volume tab clicked", () => {
		setup({ isCardio: false, selectedChart: "weight" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>(".tab-btn"));
		tabs[0].click();
		expect(host.lastChartSelect).toBe("volume");
	});

	it("should emit chartSelect(weight) when Weight tab clicked", () => {
		setup({ isCardio: false, selectedChart: "volume" });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>(".tab-btn"));
		tabs[1].click();
		expect(host.lastChartSelect).toBe("weight");
	});

	// cardio mode
	it("should render exactly four tab buttons in cardio mode", () => {
		setup({ isCardio: true, selectedChart: "volume", cardioOccurrences: makeCardioOccurrences(2) });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelectorAll(".tab-btn").length).toBe(4);
	});

	it("should render Duration, Distance, Pace, Speed tabs in cardio mode (no Total Reps)", () => {
		setup({ isCardio: true, selectedChart: "volume", cardioOccurrences: makeCardioOccurrences(2) });
		const el: HTMLElement = hostFixture.nativeElement;
		const tabs = Array.from(el.querySelectorAll(".tab-btn"));
		const texts = tabs.map((t) => t.textContent?.trim());
		expect(texts).toEqual(["Duration", "Distance", "Pace", "Speed"]);
		expect(texts).not.toContain("Total reps");
	});

	it("should not render app-total-reps-line-chart in cardio mode", () => {
		setup({ isCardio: true, selectedChart: "reps", cardioOccurrences: makeCardioOccurrences(2) });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-total-reps-line-chart")).toBeNull();
	});

	it("should render app-cardio-time-chart when cardio and selectedChart is volume", () => {
		setup({ isCardio: true, selectedChart: "volume", cardioOccurrences: makeCardioOccurrences(2) });
		const el: HTMLElement = hostFixture.nativeElement;
		expect(el.querySelector("app-cardio-time-chart")).not.toBeNull();
	});
});

// ── Block D ───────────────────────────────────────────────────────────────────

describe("StatsExerciseChartCardComponent — groupBy input, mode musculation", () => {
	let hostFixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let groupingSpy: jasmine.SpyObj<ExerciseOccurrenceGroupingService>;

	beforeEach(() => {
		groupingSpy = jasmine.createSpyObj<ExerciseOccurrenceGroupingService>("ExerciseOccurrenceGroupingService", [
			"groupExercise",
			"groupCardio",
		]);
		groupingSpy.groupExercise.and.callFake((occ) => occ);
		groupingSpy.groupCardio.and.callFake((occ) => occ);

		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
			providers: [{ provide: ExerciseOccurrenceGroupingService, useValue: groupingSpy }],
		});
		setupI18n();
	});

	function create(groupBy: GroupBy = "session") {
		hostFixture = TestBed.createComponent(HostComponent);
		host = hostFixture.componentInstance;
		host.groupBy = groupBy;
		hostFixture.detectChanges();
	}

	it("should call ExerciseOccurrenceGroupingService.groupExercise with occurrences and 'session' on first render", () => {
		create("session");
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith([], "session", "average");
	});

	it("should call groupExercise with 'week' when groupBy input is 'week'", () => {
		create("week");
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith([], "week", "average");
	});

	it("should call groupExercise with 'month' when groupBy input is 'month'", () => {
		create("month");
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith([], "month", "average");
	});

	it("should re-call groupExercise when groupBy changes from 'session' to 'year'", () => {
		create("session");
		groupingSpy.groupExercise.calls.reset();
		host.groupBy = "year";
		hostFixture.detectChanges();
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith([], "year", "average");
	});

	it("should pass the return value of groupExercise to the rendered strength chart", () => {
		const specificResult = makeOccurrences(2);
		groupingSpy.groupExercise.and.returnValue(specificResult);
		create("session");
		const volumeChart = hostFixture.debugElement
			.query(By.directive(VolumeLineChartComponent))
			.componentInstance as VolumeLineChartComponent;
		expect(volumeChart.occurrences()).toBe(specificResult);
	});
});

// ── Block E ───────────────────────────────────────────────────────────────────

describe("StatsExerciseChartCardComponent — groupBy input, mode cardio", () => {
	let hostFixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let groupingSpy: jasmine.SpyObj<ExerciseOccurrenceGroupingService>;

	beforeEach(() => {
		groupingSpy = jasmine.createSpyObj<ExerciseOccurrenceGroupingService>("ExerciseOccurrenceGroupingService", [
			"groupExercise",
			"groupCardio",
		]);
		groupingSpy.groupExercise.and.callFake((occ) => occ);
		groupingSpy.groupCardio.and.callFake((occ) => occ);

		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
			providers: [{ provide: ExerciseOccurrenceGroupingService, useValue: groupingSpy }],
		});
		setupI18n();
	});

	function create(groupBy: GroupBy = "session") {
		hostFixture = TestBed.createComponent(HostComponent);
		host = hostFixture.componentInstance;
		host.isCardio = true;
		host.cardioOccurrences = makeCardioOccurrences(2);
		host.groupBy = groupBy;
		hostFixture.detectChanges();
	}

	it("should call groupCardio with occurrences and 'session' in cardio mode", () => {
		create("session");
		expect(groupingSpy.groupCardio).toHaveBeenCalledWith(jasmine.any(Array), "session");
	});

	it("should call groupCardio with 'week' when groupBy is 'week' in cardio mode", () => {
		create("week");
		expect(groupingSpy.groupCardio).toHaveBeenCalledWith(jasmine.any(Array), "week");
	});

	it("should pass the return value of groupCardio to the rendered cardio chart", () => {
		const specificCardioResult = makeCardioOccurrences(3);
		groupingSpy.groupCardio.and.returnValue(specificCardioResult);
		create("session");
		const cardioChart = hostFixture.debugElement
			.query(By.directive(CardioTimeChartComponent))
			.componentInstance as CardioTimeChartComponent;
		expect(cardioChart.occurrences()).toEqual(specificCardioResult);
	});
});

// ── Aggregation toggle ────────────────────────────────────────────────────────

describe("StatsExerciseChartCardComponent -- aggregation toggle", () => {
	let hostFixture: ComponentFixture<HostComponent>;
	let host: HostComponent;
	let groupingSpy: jasmine.SpyObj<ExerciseOccurrenceGroupingService>;

	beforeEach(() => {
		groupingSpy = jasmine.createSpyObj<ExerciseOccurrenceGroupingService>("ExerciseOccurrenceGroupingService", [
			"groupExercise",
			"groupCardio",
		]);
		groupingSpy.groupExercise.and.callFake((occ) => occ);
		groupingSpy.groupCardio.and.callFake((occ) => occ);

		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
			providers: [{ provide: ExerciseOccurrenceGroupingService, useValue: groupingSpy }],
		});
		setupI18n();
	});

	function create(props: Partial<{ groupBy: GroupBy; selectedChart: ChartType }> = {}) {
		hostFixture = TestBed.createComponent(HostComponent);
		host = hostFixture.componentInstance;
		host.isCardio = false;
		if (props.groupBy !== undefined) host.groupBy = props.groupBy;
		if (props.selectedChart !== undefined) host.selectedChart = props.selectedChart;
		hostFixture.detectChanges();
	}

	// Test 1 - visibility
	it("should render toggle for volume chart when groupBy is week", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect(toggle).not.toBeNull();
	});

	// Test 2 - visibility
	it("should not render toggle for volume chart when groupBy is session", () => {
		create({ groupBy: "session", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect(toggle).toBeNull();
	});

	// Test 3 - visibility
	it("should not render toggle for weight chart even when groupBy is month", () => {
		create({ groupBy: "month", selectedChart: "weight" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect(toggle).toBeNull();
	});

	// Test 4 - visibility
	it("should render toggle for reps chart when groupBy is year", () => {
		create({ groupBy: "year", selectedChart: "reps" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect(toggle).not.toBeNull();
	});

	// Test 5 - default
	it("should have toggle with value average by default on volume chart", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((toggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 6 - default
	it("should have toggle with value average by default on reps chart", () => {
		create({ groupBy: "week", selectedChart: "reps" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((toggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 7 - independence
	it("should keep repsMode as average when volumeMode changes to sum", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		const volumeToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(volumeToggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		host.selectedChart = "reps";
		hostFixture.detectChanges();
		const repsToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((repsToggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 8 - independence
	it("should keep volumeMode as average when repsMode changes to sum", () => {
		create({ groupBy: "week", selectedChart: "reps" });
		const repsToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(repsToggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		host.selectedChart = "volume";
		hostFixture.detectChanges();
		const volumeToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((volumeToggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 9 - reset
	it("should reset volumeMode to average when groupBy goes from week to session", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(toggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		host.groupBy = "session";
		hostFixture.detectChanges();
		host.groupBy = "week";
		hostFixture.detectChanges();
		const newToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((newToggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 10 - reset
	it("should reset repsMode to average when groupBy goes from month to session", () => {
		create({ groupBy: "month", selectedChart: "reps" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(toggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		host.groupBy = "session";
		hostFixture.detectChanges();
		host.groupBy = "month";
		hostFixture.detectChanges();
		const newToggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((newToggle.componentInstance as AggregationToggleComponent).value()).toBe("average" as AggregationMode);
	});

	// Test 11 - redraw
	it("should call groupExercise with (array, week, average) for volume chart initially", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith(jasmine.any(Array), "week", "average");
	});

	// Test 12 - redraw
	it("should call groupExercise with (array, week, sum) for volume chart after aggregationChange to sum", () => {
		create({ groupBy: "week", selectedChart: "volume" });
		groupingSpy.groupExercise.calls.reset();
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(toggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith(jasmine.any(Array), "week", "sum");
	});

	// Test 13 - redraw
	it("should call groupExercise with (array, month, average) for reps chart initially", () => {
		create({ groupBy: "month", selectedChart: "reps" });
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith(jasmine.any(Array), "month", "average");
	});

	// Test 14 - redraw
	it("should call groupExercise with (array, month, sum) for reps chart after aggregationChange to sum", () => {
		create({ groupBy: "month", selectedChart: "reps" });
		groupingSpy.groupExercise.calls.reset();
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		(toggle.componentInstance as AggregationToggleComponent).aggregationChange.emit("sum");
		hostFixture.detectChanges();
		expect(groupingSpy.groupExercise).toHaveBeenCalledWith(jasmine.any(Array), "month", "sum");
	});
});

// ── Block F ───────────────────────────────────────────────────────────────────

describe("StatsExerciseChartCardComponent — averageEqualsSum computeds", () => {
	let hostFixture: ComponentFixture<HostComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HostComponent, translateModuleConfig],
			providers: [ExerciseOccurrenceGroupingService],
		});
		setupI18n();
	});

	function create(props: Partial<{ occurrences: ExerciseOccurrence[]; groupBy: GroupBy; selectedChart: ChartType }> = {}) {
		hostFixture = TestBed.createComponent(HostComponent);
		const host = hostFixture.componentInstance;
		host.isCardio = false;
		if (props.occurrences !== undefined) host.occurrences = props.occurrences;
		if (props.groupBy !== undefined) host.groupBy = props.groupBy;
		if (props.selectedChart !== undefined) host.selectedChart = props.selectedChart;
		hostFixture.detectChanges();
	}

	it("should pass averageEqualsSum=false to the volume toggle when a week bucket contains multiple occurrences", () => {
		// Two occurrences in the SAME ISO week (UTC dates: Mon Jan 5 and Wed Jan 7): bucket has 2 — average differs from sum
		const occurrences: ExerciseOccurrence[] = [
			{
				exerciseId: "ex1", sessionId: "s1", date: new Date(Date.UTC(2026, 0, 5)),
				name: "Squat", weightKg: 80, sets: 3, reps: 5, breakDurationSeconds: 90,
				volumeKg: 1200, totalReps: 15, status: "validated" as const,
				rating: null, comment: null, setBreakdown: [],
			},
			{
				exerciseId: "ex1", sessionId: "s2", date: new Date(Date.UTC(2026, 0, 7)),
				name: "Squat", weightKg: 80, sets: 3, reps: 5, breakDurationSeconds: 90,
				volumeKg: 1300, totalReps: 15, status: "validated" as const,
				rating: null, comment: null, setBreakdown: [],
			},
		];
		create({ occurrences, groupBy: "week", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((toggle.componentInstance as AggregationToggleComponent).averageEqualsSum()).toBeFalse();
	});

	it("should pass averageEqualsSum=true to the volume toggle when each week bucket has exactly one occurrence", () => {
		// Two occurrences in different ISO weeks (UTC: Mon Jan 5 and Mon Jan 12): each bucket has exactly 1 — average equals sum
		const occurrences: ExerciseOccurrence[] = [
			{
				exerciseId: "ex1", sessionId: "s1", date: new Date(Date.UTC(2026, 0, 5)),
				name: "Squat", weightKg: 80, sets: 3, reps: 5, breakDurationSeconds: 90,
				volumeKg: 1200, totalReps: 15, status: "validated" as const,
				rating: null, comment: null, setBreakdown: [],
			},
			{
				exerciseId: "ex1", sessionId: "s2", date: new Date(Date.UTC(2026, 0, 12)),
				name: "Squat", weightKg: 80, sets: 3, reps: 5, breakDurationSeconds: 90,
				volumeKg: 1300, totalReps: 15, status: "validated" as const,
				rating: null, comment: null, setBreakdown: [],
			},
		];
		create({ occurrences, groupBy: "week", selectedChart: "volume" });
		const toggle = hostFixture.debugElement.query(By.directive(AggregationToggleComponent));
		expect((toggle.componentInstance as AggregationToggleComponent).averageEqualsSum()).toBeTrue();
	});
});

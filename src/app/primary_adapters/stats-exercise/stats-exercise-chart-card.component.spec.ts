import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component } from "@angular/core";
import { StatsExerciseChartCardComponent } from "./stats-exercise-chart-card.component";
import { ExerciseOccurrence, CardioOccurrence } from "../../core_logic/shared/models";
import { ChartType } from "./chart-selection.service";
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
			(chartSelect)="lastChartSelect = $event"
		/>
	`,
})
class HostComponent {
	isCardio = false;
	occurrences: ExerciseOccurrence[] = [];
	cardioOccurrences: CardioOccurrence[] = [];
	selectedChart: ChartType = "volume";
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

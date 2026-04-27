import { TestBed } from "@angular/core/testing";
import { provideTranslateService } from "@ngx-translate/core";
import { signal } from "@angular/core";
import { DonutChartComponent } from "./donut-chart.component";
import { MuscleGroup, Exercise, Session } from "../../core_logic/shared/models";
import { StatsService } from "../../core_logic/stats-global/stats.service";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "e1",
		sessionId: "s1",
		name: "Bench Press",
		muscleGroup: MuscleGroup.Chest,
		muscleGroups: [MuscleGroup.Chest],
		weightKg: 100,
		sets: 3,
		reps: 10,
		breakDurationSeconds: 90,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
		...overrides,
	};
}

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "s1",
		date: new Date(2026, 2, 15),
		status: "completed",
		durationSeconds: 3600,
		muscleGroup: MuscleGroup.Chest,
		exercises: [],
		...overrides,
	};
}

describe("DonutChartComponent — isLegendItemDimmed", () => {
	let component: DonutChartComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);
		component = fixture.componentInstance;
	});

	it("should return false for any group when no group is selected", () => {
		expect(component.isLegendItemDimmed(MuscleGroup.Chest)).toBe(false);
	});

	it("should return false for the selected group itself", () => {
		component.onSegmentClick(MuscleGroup.Chest);

		expect(component.isLegendItemDimmed(MuscleGroup.Chest)).toBe(false);
	});

	it("should return true for a non-selected group when another group is selected", () => {
		component.onSegmentClick(MuscleGroup.Chest);

		expect(component.isLegendItemDimmed(MuscleGroup.Back)).toBe(true);
	});

	it("should return false for all groups once the selection is cleared", () => {
		component.onSegmentClick(MuscleGroup.Chest);
		component.onSegmentClick(MuscleGroup.Chest);

		expect(component.isLegendItemDimmed(MuscleGroup.Back)).toBe(false);
	});
});

describe("DonutChartComponent — legend opacity in template", () => {
	it("should apply opacity 0.35 to legend items that are not selected when a group is highlighted", async () => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);
		const component = fixture.componentInstance;

		fixture.componentRef.setInput(
			"distribution",
			new Map([
				[MuscleGroup.Chest, 60],
				[MuscleGroup.Back, 40],
			])
		);
		fixture.detectChanges();

		component.onSegmentClick(MuscleGroup.Chest);
		fixture.detectChanges();

		const legendItems: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(".legend-item");
		// First item is Chest (selected) — no dim; second is Back (not selected) — dimmed
		expect(legendItems[0].style.opacity).toBe("");
		expect(legendItems[1].style.opacity).toBe("0.35");
	});
});

describe("DonutChartComponent — selectedGroup state", () => {
	let component: DonutChartComponent;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);
		component = fixture.componentInstance;
	});

	it("should have selectedGroup null by default", () => {
		expect(component.selectedGroup()).toBeNull();
	});

	it("should set selectedGroup to Chest when onSegmentClick(Chest) is called", () => {
		component.onSegmentClick(MuscleGroup.Chest);

		expect(component.selectedGroup()).toBe(MuscleGroup.Chest);
	});

	it("should reset selectedGroup to null when onSegmentClick is called twice on the same group", () => {
		component.onSegmentClick(MuscleGroup.Chest);
		component.onSegmentClick(MuscleGroup.Chest);

		expect(component.selectedGroup()).toBeNull();
	});

	it("should update selectedGroup to the new group when a different group is clicked", () => {
		component.onSegmentClick(MuscleGroup.Chest);
		component.onSegmentClick(MuscleGroup.Back);

		expect(component.selectedGroup()).toBe(MuscleGroup.Back);
	});
});

describe("DonutChartComponent — totalLoad", () => {
	function createComponent(detailsMap: Map<MuscleGroup, { percentage: number; sessionCount: number; totalLoadKg: number }>) {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);
		fixture.componentRef.setInput("details", detailsMap);
		fixture.detectChanges();
		return fixture.componentInstance;
	}

	it("should display '0 kg' as total when details map is empty", () => {
		const component = createComponent(new Map());

		expect(component.totalLoad()).toBe("0 kg");
	});

	it("should display total in kg when combined load is below 1 tonne", () => {
		const component = createComponent(
			new Map([[MuscleGroup.Chest, { percentage: 100, sessionCount: 1, totalLoadKg: 500 }]])
		);

		expect(component.totalLoad()).toBe("500 kg");
	});

	it("should round to nearest kg when sub-tonne total is fractional", () => {
		const component = createComponent(
			new Map([[MuscleGroup.Chest, { percentage: 100, sessionCount: 1, totalLoadKg: 500.7 }]])
		);

		expect(component.totalLoad()).toBe("501 kg");
	});

	it("should display total in tonnes when combined load meets or exceeds 1 tonne", () => {
		const component = createComponent(
			new Map([[MuscleGroup.Chest, { percentage: 100, sessionCount: 1, totalLoadKg: 2000 }]])
		);

		expect(component.totalLoad()).toBe("2 t");
	});

	it("should display up to 2 decimal places for a fractional tonne total (99.37 t fixture)", () => {
		const component = createComponent(
			new Map([[MuscleGroup.Chest, { percentage: 100, sessionCount: 1, totalLoadKg: 99370 }]])
		);

		expect(component.totalLoad()).toBe("99.37 t");
	});

	it("should match the sum that per-group formatLoad calls would produce across multiple groups", () => {
		// 50000 + 49370 = 99370 kg = 99.37 t
		const detailsMap = new Map([
			[MuscleGroup.Chest, { percentage: 51, sessionCount: 2, totalLoadKg: 50000 }],
			[MuscleGroup.Back, { percentage: 49, sessionCount: 1, totalLoadKg: 49370 }],
		]);
		const component = createComponent(detailsMap);

		const expectedTotal = component.formatLoad(50000 + 49370);

		expect(component.totalLoad()).toBe(expectedTotal);
		expect(component.totalLoad()).toBe("99.37 t");
	});
});

describe("DonutChartComponent — legend % vs popover % cross-consistency", () => {
	it("should display the correct percentage in the legend for a single muscle group when the distribution and details agree", () => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);

		fixture.componentRef.setInput(
			"distribution",
			new Map([[MuscleGroup.Chest, 100]])
		);
		fixture.componentRef.setInput(
			"details",
			new Map([[MuscleGroup.Chest, { percentage: 100, sessionCount: 1, totalLoadKg: 500 }]])
		);
		fixture.detectChanges();

		const legendItems: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(".legend-item");
		const legendPct = legendItems[0].querySelector(".legend-pct")!.textContent?.trim();
		const detailPct = fixture.componentInstance.details().get(MuscleGroup.Chest)?.percentage + "%";

		expect(legendPct).toBe(detailPct);
	});

	it("should display the same percentage in the legend as shown in the popover for every group when the fixture contains three muscle groups with whole-number volume shares", () => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);

		// 50 / 30 / 20 — whole numbers, no rounding ambiguity
		fixture.componentRef.setInput(
			"distribution",
			new Map([
				[MuscleGroup.Chest, 50],
				[MuscleGroup.Back, 30],
				[MuscleGroup.Quads, 20],
			])
		);
		fixture.componentRef.setInput(
			"details",
			new Map([
				[MuscleGroup.Chest, { percentage: 50, sessionCount: 2, totalLoadKg: 1000 }],
				[MuscleGroup.Back, { percentage: 30, sessionCount: 1, totalLoadKg: 600 }],
				[MuscleGroup.Quads, { percentage: 20, sessionCount: 1, totalLoadKg: 400 }],
			])
		);
		fixture.detectChanges();

		const legendItems: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(".legend-item");
		const groups = [MuscleGroup.Chest, MuscleGroup.Back, MuscleGroup.Quads];

		groups.forEach((group, i) => {
			const legendPct = legendItems[i].querySelector(".legend-pct")!.textContent?.trim();
			const detailPct = fixture.componentInstance.details().get(group)?.percentage + "%";
			expect(legendPct).withContext(`legend % for ${group} should match popover %`).toBe(detailPct);
		});
	});

	it("should display the same percentage in the legend as shown in the popover for every group when one group's volume share has a fractional .5 part", () => {
		TestBed.configureTestingModule({
			imports: [DonutChartComponent],
			providers: [provideTranslateService()],
		});
		const fixture = TestBed.createComponent(DonutChartComponent);

		// volumes: Chest=70, Back=65, Legs=65 → total=200
		// raw shares: 35% / 32.5% / 32.5%
		// LRM rounds: one tied group gets +1 → 35 / 33 / 32 (or 35 / 32 / 33)
		// Both distribution and details must use the same rounded values from StatsService
		fixture.componentRef.setInput(
			"distribution",
			new Map([
				[MuscleGroup.Chest, 35],
				[MuscleGroup.Back, 33],
				[MuscleGroup.Quads, 32],
			])
		);
		fixture.componentRef.setInput(
			"details",
			new Map([
				[MuscleGroup.Chest, { percentage: 35, sessionCount: 3, totalLoadKg: 1400 }],
				[MuscleGroup.Back, { percentage: 33, sessionCount: 2, totalLoadKg: 1300 }],
				[MuscleGroup.Quads, { percentage: 32, sessionCount: 2, totalLoadKg: 1300 }],
			])
		);
		fixture.detectChanges();

		const legendItems: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(".legend-item");
		const groups = [MuscleGroup.Chest, MuscleGroup.Back, MuscleGroup.Quads];

		groups.forEach((group, i) => {
			const legendPct = legendItems[i].querySelector(".legend-pct")!.textContent?.trim();
			const detailPct = fixture.componentInstance.details().get(group)?.percentage + "%";
			expect(legendPct).withContext(`legend % for ${group} should match popover % even with .5 fractional share`).toBe(detailPct);
		});
	});
});

describe("StatsService — muscleGroupDetails", () => {
	let service: StatsService;

	function setupService(sessions: Session[], exercises: Exercise[]): void {
		TestBed.configureTestingModule({
			providers: [
				StatsService,
				{
					provide: SESSION_REPOSITORY,
					useValue: { getAll: () => Promise.resolve(sessions) },
				},
				{
					provide: EXERCISE_REPOSITORY,
					useValue: { getAll: () => Promise.resolve(exercises) },
				},
			],
		});
		service = TestBed.inject(StatsService);
		service._allSessions.set(sessions);
		service._allExercises.set(exercises);
		service.setMonth(new Date(2026, 2, 1));
	}

	it("should return an empty Map when there are no exercises", () => {
		setupService([], []);

		const result = service.muscleGroupDetails();

		expect(result.size).toBe(0);
	});

	it("should return correct percentage, sessionCount and totalLoadKg for 2 muscle groups", () => {
		const chestSession = makeSession({ id: "s1", date: new Date(2026, 2, 10) });
		const backSession = makeSession({ id: "s2", date: new Date(2026, 2, 12), muscleGroup: MuscleGroup.Back });
		const chestEx1 = makeExercise({
			id: "e1",
			sessionId: "s1",
			muscleGroup: MuscleGroup.Chest,
			weightKg: 100,
			sets: 3,
			reps: 10,
		});
		const chestEx2 = makeExercise({
			id: "e2",
			sessionId: "s1",
			muscleGroup: MuscleGroup.Chest,
			weightKg: 80,
			sets: 4,
			reps: 8,
		});
		const backEx1 = makeExercise({
			id: "e3",
			sessionId: "s2",
			muscleGroup: MuscleGroup.Back,
			weightKg: 60,
			sets: 3,
			reps: 12,
		});

		setupService([chestSession, backSession], [chestEx1, chestEx2, backEx1]);

		const result = service.muscleGroupDetails();

		const chest = result.get(MuscleGroup.Chest);
		const back = result.get(MuscleGroup.Back);

		expect(chest).toBeDefined();
		expect(back).toBeDefined();

		// 2 chest exercises, 1 back exercise => chest 67%, back 33%
		expect(chest!.percentage).toBe(67);
		expect(back!.percentage).toBe(33);

		// sessionCount: distinct sessions per muscle group
		expect(chest!.sessionCount).toBe(1);
		expect(back!.sessionCount).toBe(1);

		// totalLoadKg: sum of computeVolume
		// chest: 100*3*10 + 80*4*8 = 3000 + 2560 = 5560
		// back: 60*3*12 = 2160
		expect(chest!.totalLoadKg).toBe(5560);
		expect(back!.totalLoadKg).toBe(2160);
	});
});

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
		const chestEx1 = makeExercise({ id: "e1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 3, reps: 10 });
		const chestEx2 = makeExercise({ id: "e2", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 80, sets: 4, reps: 8 });
		const backEx1 = makeExercise({ id: "e3", sessionId: "s2", muscleGroup: MuscleGroup.Back, weightKg: 60, sets: 3, reps: 12 });

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

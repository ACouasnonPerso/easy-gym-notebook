import { TestBed } from "@angular/core/testing";
import { StatsService, MonthSummary } from "./stats.service";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Session, Exercise, MuscleGroup } from "../shared/models";
import { SessionDuration } from "./stats.service";

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "session-1",
		date: new Date(),
		status: "completed",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Développé couché",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 1,
		reps: 1,
		breakDurationSeconds: 60,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		...overrides,
	} as Exercise;
}

/** Returns a Date for Monday of the current week at midnight */
function getMondayOfCurrentWeek(): Date {
	const d = new Date();
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

describe("StatsService", () => {
	let service: StatsService;
	let sessionRepoSpy: jasmine.SpyObj<{
		getAll: () => Promise<Session[]>;
		getById: (id: string) => Promise<Session | null>;
		save: (s: Session) => Promise<void>;
		delete: (id: string) => Promise<void>;
	}>;
	let exerciseRepoSpy: jasmine.SpyObj<{
		getAll: () => Promise<Exercise[]>;
		getBySessionId: () => Promise<Exercise[]>;
		save: (e: Exercise) => Promise<void>;
		delete: (id: string) => Promise<void>;
	}>;

	beforeEach(() => {
		sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);

		TestBed.configureTestingModule({
			providers: [
				StatsService,
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
			],
		});

		service = TestBed.inject(StatsService);
	});

	describe("monthSummary — pyramid volume", () => {
		it("should compute the total monthly volume using the flat formula for all standard exercises", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", weightKg: 80, sets: 4, reps: 8, isPyramid: false, pyramidSets: [] }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.monthSummary();

			expect(result.totalWeightKg).toBe(80 * 4 * 8);
		});

		it("should compute the total monthly volume using per-set weights and reps for all pyramid exercises", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({
					sessionId: "s1",
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 60, reps: 12 },
						{ weightKg: 80, reps: 8 },
						{ weightKg: 100, reps: 4 },
					],
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.monthSummary();

			expect(result.totalWeightKg).toBe(60 * 12 + 80 * 8 + 100 * 4);
		});

		it("should compute the correct total monthly volume when the session contains a mix of standard and pyramid exercises", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", weightKg: 60, sets: 3, reps: 10, isPyramid: false, pyramidSets: [] }),
				makeExercise({
					id: "ex-2",
					sessionId: "s1",
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 80, reps: 8 },
						{ weightKg: 100, reps: 4 },
					],
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.monthSummary();

			expect(result.totalWeightKg).toBe(60 * 3 * 10 + 80 * 8 + 100 * 4);
		});

		it("should compute the weekly volume summary using the same pyramid-aware formula", () => {
			const monday = getMondayOfCurrentWeek();
			service._allSessions.set([makeSession({ id: "s1", date: monday })]);
			service._allExercises.set([
				makeExercise({
					sessionId: "s1",
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 60, reps: 12 },
						{ weightKg: 80, reps: 8 },
					],
				}),
			]);

			const result = service.weekSummary();

			expect(result.totalWeightKg).toBe(60 * 12 + 80 * 8);
		});
	});

	describe("sessionDurationsInMonth", () => {
		it("should return [] when all durationSeconds are 0", () => {
			const march10 = new Date(2026, 2, 10);
			const march15 = new Date(2026, 2, 15);
			service._allSessions.set([
				makeSession({ id: "s1", date: march10, durationSeconds: 0 }),
				makeSession({ id: "s2", date: march15, durationSeconds: 0 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result: SessionDuration[] = service.sessionDurationsInMonth();

			expect(result).toEqual([]);
		});

		it("should exclude sessions outside the selected month", () => {
			const march10 = new Date(2026, 2, 10);
			const feb15 = new Date(2026, 1, 15);
			const april5 = new Date(2026, 3, 5);
			service._allSessions.set([
				makeSession({ id: "s1", date: march10, durationSeconds: 3600 }),
				makeSession({ id: "s2", date: feb15, durationSeconds: 1800 }),
				makeSession({ id: "s3", date: april5, durationSeconds: 2700 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result: SessionDuration[] = service.sessionDurationsInMonth();

			expect(result.length).toBe(1);
			expect(result[0].durationSeconds).toBe(3600);
		});

		it("should return sessions of the selected month sorted by date with correct durationSeconds", () => {
			const march10 = new Date(2026, 2, 10);
			const march5 = new Date(2026, 2, 5);
			const march20 = new Date(2026, 2, 20);
			service._allSessions.set([
				makeSession({ id: "s1", date: march10, durationSeconds: 3600 }),
				makeSession({ id: "s2", date: march5, durationSeconds: 1800 }),
				makeSession({ id: "s3", date: march20, durationSeconds: 2700 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result: SessionDuration[] = service.sessionDurationsInMonth();

			expect(result.length).toBe(3);
			expect(result[0]).toEqual({ date: march5, durationSeconds: 1800 });
			expect(result[1]).toEqual({ date: march10, durationSeconds: 3600 });
			expect(result[2]).toEqual({ date: march20, durationSeconds: 2700 });
		});
	});

	describe("weekSummary", () => {
		it("should return zeros when there are no sessions", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);

			const result = service.weekSummary();

			expect(result).toEqual({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 });
		});

		it("should count a session that falls in the current week", () => {
			const monday = getMondayOfCurrentWeek();
			service._allSessions.set([makeSession({ id: "session-1", date: monday, durationSeconds: 0 })]);
			service._allExercises.set([]);

			const result = service.weekSummary();

			expect(result.sessionCount).toBe(1);
		});

		it("should sum totalWeightKg from validated exercises in the current week", () => {
			const monday = getMondayOfCurrentWeek();
			service._allSessions.set([makeSession({ id: "session-1", date: monday })]);
			service._allExercises.set([
				makeExercise({ sessionId: "session-1", weightKg: 80, sets: 4, reps: 8, status: "validated" }),
			]);

			const result = service.weekSummary();

			expect(result.totalWeightKg).toBe(80 * 4 * 8);
		});

		it("should sum totalDurationSeconds from sessions in the current week", () => {
			const monday = getMondayOfCurrentWeek();
			service._allSessions.set([
				makeSession({ id: "session-1", date: monday, durationSeconds: 3600 }),
				makeSession({ id: "session-2", date: monday, durationSeconds: 1800 }),
			]);
			service._allExercises.set([]);

			const result = service.weekSummary();

			expect(result.totalDurationSeconds).toBe(5400);
		});

		it("should exclude sessions outside the current week", () => {
			const monday = getMondayOfCurrentWeek();
			const lastWeekDate = new Date(monday);
			lastWeekDate.setDate(lastWeekDate.getDate() - 1); // Sunday of last week

			service._allSessions.set([makeSession({ id: "session-last-week", date: lastWeekDate, durationSeconds: 3600 })]);
			service._allExercises.set([]);

			const result = service.weekSummary();

			expect(result.sessionCount).toBe(0);
			expect(result.totalDurationSeconds).toBe(0);
		});
	});

	describe("heatmapData — tags from exercises", () => {
		it("should include all muscleGroups from a single exercise in the cell tags", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", muscleGroups: [MuscleGroup.Chest, MuscleGroup.Triceps] }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.tags).toContain("Chest");
			expect(cell.tags).toContain("Triceps");
		});

		it("should aggregate muscleGroups from two sessions on the same day", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 }), makeSession({ id: "s2", date: march10 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroups: [MuscleGroup.Chest] }),
				makeExercise({ id: "ex-2", sessionId: "s2", muscleGroups: [MuscleGroup.Back] }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.tags).toContain("Chest");
			expect(cell.tags).toContain("Back");
		});

		it("should deduplicate muscleGroups when multiple exercises share the same muscle group", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroups: [MuscleGroup.Chest] }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroups: [MuscleGroup.Chest] }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.tags.filter((t) => t === "Chest").length).toBe(1);
		});
	});

	describe("heatmapData — hasCardio", () => {
		it("should set hasCardio to false when no exercises on that day are cardio", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", isCardio: false })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.hasCardio).toBe(false);
		});

		it("should set hasCardio to true when at least one exercise on that day has isCardio true", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", isCardio: true })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.hasCardio).toBe(true);
		});

		it("should set hasCardio to true when there is a mix of cardio and non-cardio exercises on the same day", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", isCardio: false }),
				makeExercise({ id: "ex-2", sessionId: "s1", isCardio: true }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service
				.heatmapData()
				.find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2 && c.date.getFullYear() === 2026)!;

			expect(cell.hasCardio).toBe(true);
		});
	});

	describe("muscleGroupDistribution — percentage rounding", () => {
		it("should make percentages sum to exactly 100 when three muscle groups have equal counts (33.33% each)", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Back }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			const total = Array.from(result.values()).reduce((sum, pct) => sum + pct, 0);

			expect(total).toBe(100);
		});

		it("should make percentages sum to exactly 100 when seven muscle groups have equal counts (14.28% each)", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			const muscleGroups = [
				MuscleGroup.Chest,
				MuscleGroup.Back,
				MuscleGroup.Shoulders,
				MuscleGroup.Biceps,
				MuscleGroup.Triceps,
				MuscleGroup.Quads,
				MuscleGroup.Abs,
			];
			service._allExercises.set(
				muscleGroups.map((mg, i) => makeExercise({ id: `ex-${i + 1}`, sessionId: "s1", muscleGroup: mg }))
			);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			const total = Array.from(result.values()).reduce((sum, pct) => sum + pct, 0);

			expect(total).toBe(100);
		});

		it("should assign each segment its exact integer percentage when the distribution divides evenly (20%+20%+60%)", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Chest }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Back }),
				makeExercise({ id: "ex-4", sessionId: "s1", muscleGroup: MuscleGroup.Back }),
				makeExercise({ id: "ex-5", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
				makeExercise({ id: "ex-6", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
				makeExercise({ id: "ex-7", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
				makeExercise({ id: "ex-8", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
				makeExercise({ id: "ex-9", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
				makeExercise({ id: "ex-10", sessionId: "s1", muscleGroup: MuscleGroup.Quads }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();

			expect(result.get(MuscleGroup.Chest)).toBe(20);
			expect(result.get(MuscleGroup.Back)).toBe(20);
			expect(result.get(MuscleGroup.Quads)).toBe(60);
			const total = Array.from(result.values()).reduce((sum, pct) => sum + pct, 0);
			expect(total).toBe(100);
		});
	});

	describe("exerciseSummaries — maxWeightKg", () => {
		it("should use weightKg for a standard exercise", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", weightKg: 80, sets: 3, reps: 10, isPyramid: false, pyramidSets: [] }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();

			expect(result[0].maxWeightKg).toBe(80);
		});

		it("should use the max pyramidSet weightKg for a pyramid exercise", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({
					sessionId: "s1",
					weightKg: 0,
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 60, reps: 12 },
						{ weightKg: 80, reps: 8 },
						{ weightKg: 100, reps: 4 },
					],
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();

			expect(result[0].maxWeightKg).toBe(100);
		});

		it("should return the highest maxWeightKg across multiple pyramid occurrences", () => {
			const march1 = new Date(2026, 2, 1);
			const march15 = new Date(2026, 2, 15);
			service._allSessions.set([makeSession({ id: "s1", date: march1 }), makeSession({ id: "s2", date: march15 })]);
			service._allExercises.set([
				makeExercise({
					id: "ex-1",
					sessionId: "s1",
					name: "Squat",
					weightKg: 0,
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 80, reps: 8 },
						{ weightKg: 100, reps: 4 },
					],
				}),
				makeExercise({
					id: "ex-2",
					sessionId: "s2",
					name: "Squat",
					weightKg: 0,
					isPyramid: true,
					pyramidSets: [
						{ weightKg: 90, reps: 8 },
						{ weightKg: 120, reps: 3 },
					],
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();

			expect(result[0].maxWeightKg).toBe(120);
		});
	});
});

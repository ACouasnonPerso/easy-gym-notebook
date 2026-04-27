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
		rating: null,
		comment: null,
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
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
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
				muscleGroups.map((mg, i) =>
					makeExercise({ id: `ex-${i + 1}`, sessionId: "s1", muscleGroup: mg, weightKg: 100, sets: 1, reps: 1 })
				)
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
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-4", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-5", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-6", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-7", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-8", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-9", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-10", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
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

	describe("setMonth()", () => {
		it("met à jour selectedMonth avec la nouvelle date", () => {
			const feb = new Date(2026, 1, 1);
			service.setMonth(feb);
			expect(service.selectedMonth().getMonth()).toBe(1);
			expect(service.selectedMonth().getFullYear()).toBe(2026);
		});

		it("filtre les sessions selon le nouveau mois sélectionné", () => {
			const march1 = new Date(2026, 2, 1);
			const feb1 = new Date(2026, 1, 1);
			service._allSessions.set([
				makeSession({ id: "s-march", date: march1, durationSeconds: 0 }),
				makeSession({ id: "s-feb", date: feb1, durationSeconds: 0 }),
			]);
			service._allExercises.set([]);

			service.setMonth(new Date(2026, 2, 1));
			expect(service.monthSummary().sessionCount).toBe(1);

			service.setMonth(new Date(2026, 1, 1));
			expect(service.monthSummary().sessionCount).toBe(1);
		});
	});

	describe("monthSummary — sessionCount et totalDurationSeconds", () => {
		it("retourne sessionCount = 0 quand il n'y a aucune session", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.monthSummary().sessionCount).toBe(0);
		});

		it("retourne sessionCount correct pour plusieurs sessions dans le mois", () => {
			const march1 = new Date(2026, 2, 1);
			const march15 = new Date(2026, 2, 15);
			service._allSessions.set([makeSession({ id: "s1", date: march1 }), makeSession({ id: "s2", date: march15 })]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.monthSummary().sessionCount).toBe(2);
		});

		it("additionne totalDurationSeconds de toutes les sessions du mois", () => {
			const march1 = new Date(2026, 2, 1);
			const march15 = new Date(2026, 2, 15);
			service._allSessions.set([
				makeSession({ id: "s1", date: march1, durationSeconds: 3600 }),
				makeSession({ id: "s2", date: march15, durationSeconds: 1800 }),
			]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.monthSummary().totalDurationSeconds).toBe(5400);
		});

		it("exclut les exercices non validés du volume total", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", weightKg: 100, sets: 3, reps: 10, status: "validated" }),
				makeExercise({ id: "ex-2", sessionId: "s1", weightKg: 50, sets: 3, reps: 10, status: "pending" }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.monthSummary().totalWeightKg).toBe(100 * 3 * 10);
		});
	});

	describe("weeklyAverage", () => {
		it("divise les totaux du mois par le nombre de semaines", () => {
			const march1 = new Date(2026, 2, 1); // March 2026 → ceil(31/7) = 5 weeks
			service._allSessions.set([makeSession({ id: "s1", date: march1, durationSeconds: 5000 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", weightKg: 100, sets: 5, reps: 10 })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.weeklyAverage();
			const weeks = Math.ceil(31 / 7); // 5
			expect(result.avgWeightKg).toBe((100 * 5 * 10) / weeks);
			expect(result.sessionsPerWeek).toBe(1 / weeks);
			expect(result.avgDurationSeconds).toBe(5000 / weeks);
		});

		it("retourne des zéros quand il n'y a aucune session", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.weeklyAverage();
			expect(result.avgWeightKg).toBe(0);
			expect(result.sessionsPerWeek).toBe(0);
			expect(result.avgDurationSeconds).toBe(0);
		});
	});

	describe("muscleGroupDetails", () => {
		it("retourne une map vide si aucun exercice dans le mois", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.muscleGroupDetails().size).toBe(0);
		});

		it("calcule le bon pourcentage pour chaque groupe musculaire", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 1, reps: 1 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDetails();
			expect(result.get(MuscleGroup.Chest)?.percentage).toBe(67);
			expect(result.get(MuscleGroup.Back)?.percentage).toBe(33);
			const total = Array.from(result.values()).reduce((sum, d) => sum + d.percentage, 0);
			expect(total).toBe(100);
		});

		it("calcule sessionCount = nombre de sessions distinctes avec ce groupe musculaire", () => {
			const march1 = new Date(2026, 2, 1);
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march1 }), makeSession({ id: "s2", date: march10 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-2", sessionId: "s2", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDetails();
			expect(result.get(MuscleGroup.Chest)?.sessionCount).toBe(2);
		});

		it("calcule totalLoadKg = somme des volumes pour ce groupe musculaire", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 80, sets: 3, reps: 10 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 60, sets: 4, reps: 8 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDetails();
			expect(result.get(MuscleGroup.Chest)?.totalLoadKg).toBe(80 * 3 * 10 + 60 * 4 * 8);
		});

		it("retourne une map vide si tous les exercices ont muscleGroup null", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: null })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.muscleGroupDetails().size).toBe(0);
		});
	});

	describe("exerciseSummaries — occurrenceCount, totalVolumeKg, isCardio, totalDistanceKm, muscleGroups", () => {
		it("compte correctement le nombre d'occurrences d'un exercice", () => {
			const march1 = new Date(2026, 2, 1);
			const march8 = new Date(2026, 2, 8);
			const march15 = new Date(2026, 2, 15);
			service._allSessions.set([
				makeSession({ id: "s1", date: march1 }),
				makeSession({ id: "s2", date: march8 }),
				makeSession({ id: "s3", date: march15 }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", name: "Squat", weightKg: 80, sets: 4, reps: 8 }),
				makeExercise({ id: "ex-2", sessionId: "s2", name: "Squat", weightKg: 90, sets: 4, reps: 6 }),
				makeExercise({ id: "ex-3", sessionId: "s3", name: "Squat", weightKg: 100, sets: 3, reps: 5 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].occurrenceCount).toBe(3);
		});

		it("calcule totalVolumeKg comme somme de tous les volumes d'un exercice", () => {
			const march1 = new Date(2026, 2, 1);
			const march8 = new Date(2026, 2, 8);
			service._allSessions.set([makeSession({ id: "s1", date: march1 }), makeSession({ id: "s2", date: march8 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", name: "Bench Press", weightKg: 80, sets: 4, reps: 8 }),
				makeExercise({ id: "ex-2", sessionId: "s2", name: "Bench Press", weightKg: 90, sets: 3, reps: 6 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].totalVolumeKg).toBe(80 * 4 * 8 + 90 * 3 * 6);
		});

		it("retourne les résultats triés par totalVolumeKg décroissant", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", name: "Light", weightKg: 10, sets: 1, reps: 10 }),
				makeExercise({ id: "ex-2", sessionId: "s1", name: "Heavy", weightKg: 100, sets: 5, reps: 10 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].name).toBe("Heavy");
			expect(result[1].name).toBe("Light");
		});

		it("marque isCardio = true pour un exercice cardio", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", name: "Run", isCardio: true, durationSeconds: 1800, distanceKm: 5 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].isCardio).toBe(true);
		});

		it("totalDistanceKm est non null quand isCardio et distanceKm > 0", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", name: "Run", isCardio: true, distanceKm: 5 }),
				makeExercise({ id: "ex-2", sessionId: "s1", name: "Run", isCardio: true, distanceKm: 3 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].totalDistanceKm).toBe(8);
		});

		it("totalDistanceKm est null quand l'exercice n'est pas cardio", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", name: "Squat", isCardio: false, distanceKm: null })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].totalDistanceKm).toBeNull();
		});

		it("totalDurationSeconds est la somme des durées de toutes les occurrences", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", name: "Run", isCardio: true, durationSeconds: 1800 }),
				makeExercise({ id: "ex-2", sessionId: "s1", name: "Run", isCardio: true, durationSeconds: 900 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].totalDurationSeconds).toBe(2700);
		});

		it("muscleGroups est l'union dédupliquée des muscleGroups de toutes les occurrences", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({
					id: "ex-1",
					sessionId: "s1",
					name: "Compound",
					muscleGroups: [MuscleGroup.Chest, MuscleGroup.Triceps],
				}),
				makeExercise({
					id: "ex-2",
					sessionId: "s1",
					name: "Compound",
					muscleGroups: [MuscleGroup.Chest, MuscleGroup.Shoulders],
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.exerciseSummaries();
			expect(result[0].muscleGroups).toContain(MuscleGroup.Chest);
			expect(result[0].muscleGroups).toContain(MuscleGroup.Triceps);
			expect(result[0].muscleGroups).toContain(MuscleGroup.Shoulders);
			expect(result[0].muscleGroups.filter((mg) => mg === MuscleGroup.Chest).length).toBe(1);
		});

		it("retourne un tableau vide quand il n'y a pas d'exercices dans le mois", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.exerciseSummaries()).toEqual([]);
		});
	});

	describe("heatmapData — hasSession et isCurrentMonth", () => {
		it("hasSession est true pour les jours ayant une session", () => {
			const march10 = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s1", date: march10 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", muscleGroups: [MuscleGroup.Chest] })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service.heatmapData().find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2)!;
			expect(cell.hasSession).toBe(true);
		});

		it("hasSession est false pour les jours sans session", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cell = service.heatmapData().find((c) => c.date.getDate() === 10 && c.date.getMonth() === 2)!;
			expect(cell.hasSession).toBe(false);
		});

		it("isCurrentMonth est false pour les jours hors du mois sélectionné", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1)); // March 2026

			// March 2026 starts on Monday the 2nd; grid may include Feb 23 - March 1
			const cells = service.heatmapData();
			const outsideCells = cells.filter((c) => c.date.getMonth() !== 2);
			outsideCells.forEach((c) => expect(c.isCurrentMonth).toBe(false));
		});

		it("isCurrentMonth est true pour tous les jours du mois sélectionné", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const cells = service.heatmapData();
			const marchCells = cells.filter((c) => c.date.getMonth() === 2 && c.date.getFullYear() === 2026);
			expect(marchCells.length).toBe(31);
			marchCells.forEach((c) => expect(c.isCurrentMonth).toBe(true));
		});
	});

	describe("muscleGroupDistribution — cas limites", () => {
		it("retourne une map vide si aucun exercice dans le mois", () => {
			service._allSessions.set([]);
			service._allExercises.set([]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.muscleGroupDistribution().size).toBe(0);
		});

		it("retourne une map vide si tous les exercices ont muscleGroup null", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([makeExercise({ sessionId: "s1", muscleGroup: null })]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			expect(service.muscleGroupDistribution().size).toBe(0);
		});

		it("retourne 100% pour un seul groupe musculaire", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			expect(result.get(MuscleGroup.Chest)).toBe(100);
		});
	});

	describe("muscleGroupDetails — volume-based percentage consistency", () => {
		it("should return the same percentage for a group as muscleGroupDistribution returns, on the same input", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				// Chest: 1 exercise, volume = 500 * 2 * 5 = 5000 kg
				makeExercise({
					id: "ex-chest",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Chest,
					weightKg: 500,
					sets: 2,
					reps: 5,
				}),
				// Back: 3 exercises, each 100 * 5 * 1 = 500 kg → total 1500 kg
				makeExercise({
					id: "ex-back-1",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
				makeExercise({
					id: "ex-back-2",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
				makeExercise({
					id: "ex-back-3",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const distribution = service.muscleGroupDistribution();
			const details = service.muscleGroupDetails();

			expect(details.get(MuscleGroup.Chest)?.percentage).toBe(distribution.get(MuscleGroup.Chest));
			expect(details.get(MuscleGroup.Back)?.percentage).toBe(distribution.get(MuscleGroup.Back));
		});
	});

	describe("muscleGroupDistribution — volume-based percentage", () => {
		it("should assign 100% to the only muscle group when all exercises belong to that group and have non-zero volume", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 80, sets: 3, reps: 10 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			expect(result.get(MuscleGroup.Chest)).toBe(100);
		});

		it("should assign equal percentages to two groups when each has the same total volume", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 3, reps: 10 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 3, reps: 10 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			expect(result.get(MuscleGroup.Chest)).toBe(result.get(MuscleGroup.Back));
		});

		it("should make all percentages sum to exactly 100 when individual volumes produce fractional shares (three equal-volume groups → 33+33+34 = 100)", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				// Three groups each with volume = 100*1*1 = 100 kg → each share = 33.33%
				makeExercise({ id: "ex-1", sessionId: "s1", muscleGroup: MuscleGroup.Chest, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-2", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 100, sets: 1, reps: 1 }),
				makeExercise({ id: "ex-3", sessionId: "s1", muscleGroup: MuscleGroup.Quads, weightKg: 100, sets: 1, reps: 1 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			const total = Array.from(result.values()).reduce((sum, pct) => sum + pct, 0);
			expect(total).toBe(100);
		});

		it("should exclude a group from the map when all its exercises have zero volume", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				// Back: volume = 0*3*10 = 0 → should be excluded
				makeExercise({ id: "ex-back", sessionId: "s1", muscleGroup: MuscleGroup.Back, weightKg: 0, sets: 3, reps: 10 }),
				// Chest: volume = 80*3*10 = 2400 → should be present at 100%
				makeExercise({
					id: "ex-chest",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Chest,
					weightKg: 80,
					sets: 3,
					reps: 10,
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			expect(result.has(MuscleGroup.Back)).toBeFalse();
			expect(result.get(MuscleGroup.Chest)).toBe(100);
		});

		it("should assign a higher % to the group with greater total volume even when it has fewer exercises (1 chest @ 5000 kg vs 3 back @ 1500 kg total → chest% > back%)", () => {
			const march1 = new Date(2026, 2, 1);
			service._allSessions.set([makeSession({ id: "s1", date: march1 })]);
			service._allExercises.set([
				// Chest: 1 exercise, volume = 500 * 2 * 5 = 5000 kg
				makeExercise({
					id: "ex-chest",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Chest,
					weightKg: 500,
					sets: 2,
					reps: 5,
				}),
				// Back: 3 exercises, each 100 * 5 * 1 = 500 kg → total 1500 kg
				makeExercise({
					id: "ex-back-1",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
				makeExercise({
					id: "ex-back-2",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
				makeExercise({
					id: "ex-back-3",
					sessionId: "s1",
					muscleGroup: MuscleGroup.Back,
					weightKg: 100,
					sets: 5,
					reps: 1,
				}),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));

			const result = service.muscleGroupDistribution();
			expect(result.get(MuscleGroup.Chest)!).toBeGreaterThan(result.get(MuscleGroup.Back)!);
		});
	});

	describe("setViewType() + exerciseSummaries — filtrage par type de durée", () => {
		it("should include exercises from all months when viewType is 'total'", async () => {
			const jan = new Date(2026, 0, 10);
			const march = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s-jan", date: jan }), makeSession({ id: "s-march", date: march })]);
			service._allExercises.set([
				makeExercise({ id: "ex-jan", sessionId: "s-jan", name: "Squat" }),
				makeExercise({ id: "ex-march", sessionId: "s-march", name: "Développé couché" }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));
			service.setViewType("total");

			const summaries = service.exerciseSummaries();

			expect(summaries.length).toBe(2);
			expect(summaries.map((s) => s.name)).toContain("Squat");
			expect(summaries.map((s) => s.name)).toContain("Développé couché");
		});

		it("should include only exercises from the current year when viewType is 'current-year'", async () => {
			const lastYear = new Date(2025, 5, 15);
			const thisYear = new Date(2026, 2, 10);
			service._allSessions.set([
				makeSession({ id: "s-lastyear", date: lastYear }),
				makeSession({ id: "s-thisyear", date: thisYear }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-lastyear", sessionId: "s-lastyear", name: "Squat" }),
				makeExercise({ id: "ex-thisyear", sessionId: "s-thisyear", name: "Développé couché" }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));
			service.setViewType("current-year");

			const summaries = service.exerciseSummaries();

			expect(summaries.length).toBe(1);
			expect(summaries[0].name).toBe("Développé couché");
		});

		it("should filter by selected month when viewType is 'month' (existing behaviour preserved)", async () => {
			const jan = new Date(2026, 0, 10);
			const march = new Date(2026, 2, 10);
			service._allSessions.set([makeSession({ id: "s-jan", date: jan }), makeSession({ id: "s-march", date: march })]);
			service._allExercises.set([
				makeExercise({ id: "ex-jan", sessionId: "s-jan", name: "Squat" }),
				makeExercise({ id: "ex-march", sessionId: "s-march", name: "Développé couché" }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));
			service.setViewType("month");

			const summaries = service.exerciseSummaries();

			expect(summaries.length).toBe(1);
			expect(summaries[0].name).toBe("Développé couché");
		});

		it("should include exercises from all months in monthSummary when viewType is 'total'", async () => {
			const jan = new Date(2026, 0, 10);
			const march = new Date(2026, 2, 10);
			service._allSessions.set([
				makeSession({ id: "s-jan", date: jan, durationSeconds: 1800 }),
				makeSession({ id: "s-march", date: march, durationSeconds: 3600 }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-jan", sessionId: "s-jan", weightKg: 50, sets: 3, reps: 10 }),
				makeExercise({ id: "ex-march", sessionId: "s-march", weightKg: 80, sets: 4, reps: 8 }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));
			service.setViewType("total");

			const summary = service.monthSummary();

			expect(summary.sessionCount).toBe(2);
			expect(summary.totalDurationSeconds).toBe(1800 + 3600);
		});

		it("should include only current-year sessions in monthSummary when viewType is 'current-year'", async () => {
			const lastYear = new Date(2025, 5, 15);
			const thisYear = new Date(2026, 2, 10);
			service._allSessions.set([
				makeSession({ id: "s-lastyear", date: lastYear, durationSeconds: 1800 }),
				makeSession({ id: "s-thisyear", date: thisYear, durationSeconds: 3600 }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-lastyear", sessionId: "s-lastyear" }),
				makeExercise({ id: "ex-thisyear", sessionId: "s-thisyear" }),
			]);
			service.selectedMonth.set(new Date(2026, 2, 1));
			service.setViewType("current-year");

			const summary = service.monthSummary();

			expect(summary.sessionCount).toBe(1);
			expect(summary.totalDurationSeconds).toBe(3600);
		});

		it("should include only current-week sessions in monthSummary when viewType is 'current-week'", () => {
			const monday = getMondayOfCurrentWeek(); // Mon 30 Mar 2026
			const thisWeek = new Date(monday);

			const lastWeekMonday = new Date(monday);
			lastWeekMonday.setDate(monday.getDate() - 7); // Mon 23 Mar — same month, previous week

			service._allSessions.set([
				makeSession({ id: "s-thisweek", date: thisWeek, durationSeconds: 3600 }),
				makeSession({ id: "s-lastweek", date: lastWeekMonday, durationSeconds: 1800 }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-thisweek", sessionId: "s-thisweek" }),
				makeExercise({ id: "ex-lastweek", sessionId: "s-lastweek" }),
			]);
			service.selectedMonth.set(new Date(monday.getFullYear(), monday.getMonth(), 1));
			service.setViewType("current-week");

			const summary = service.monthSummary();

			expect(summary.sessionCount).toBe(1);
			expect(summary.totalDurationSeconds).toBe(3600);
		});

		it("should include only exercises from the current ISO week when viewType is 'current-week'", () => {
			// Place both sessions in the same calendar month so the month filter cannot distinguish them.
			// Current week: Mon 30 Mar – Sun 5 Apr 2026. Both dates are in March or April.
			// We use Monday (30 Mar) as the in-week date and a prior Monday (23 Mar) as the out-of-week date.
			// Both are in the same month (March) so a plain month filter would return both.
			const monday = getMondayOfCurrentWeek(); // Mon 30 Mar 2026
			const thisWeek = new Date(monday); // still 30 Mar — in current week

			const lastWeekMonday = new Date(monday);
			lastWeekMonday.setDate(monday.getDate() - 7); // Mon 23 Mar — same month, previous week

			service._allSessions.set([
				makeSession({ id: "s-thisweek", date: thisWeek }),
				makeSession({ id: "s-lastweek", date: lastWeekMonday }),
			]);
			service._allExercises.set([
				makeExercise({ id: "ex-thisweek", sessionId: "s-thisweek", name: "Développé couché" }),
				makeExercise({ id: "ex-lastweek", sessionId: "s-lastweek", name: "Squat" }),
			]);
			service.selectedMonth.set(new Date(monday.getFullYear(), monday.getMonth(), 1));
			service.setViewType("current-week");

			const summaries = service.exerciseSummaries();

			expect(summaries.length).toBe(1);
			expect(summaries[0].name).toBe("Développé couché");
		});
	});
});

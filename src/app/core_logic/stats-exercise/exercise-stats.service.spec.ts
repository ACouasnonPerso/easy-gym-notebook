import { TestBed } from "@angular/core/testing";
import { ExerciseStatsService } from "./exercise-stats.service";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Exercise, Session } from "../shared/models";

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "session-1",
		date: new Date("2026-01-01"),
		status: "completed",
		durationSeconds: 3600,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Course à pied",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 0,
		reps: 0,
		breakDurationSeconds: 0,
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

describe("ExerciseStatsService", () => {
	let service: ExerciseStatsService;
	let sessionRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Session[]> }>;
	let exerciseRepoSpy: jasmine.SpyObj<{ getAll: () => Promise<Exercise[]> }>;

	beforeEach(() => {
		sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll"]);
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "getBySessionId", "save", "delete"]);

		TestBed.configureTestingModule({
			providers: [
				ExerciseStatsService,
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
			],
		});

		service = TestBed.inject(ExerciseStatsService);
	});

	describe("pyramid occurrences", () => {
		it("pour un exercice normal (non-pyramide), weightKg et volumeKg doivent utiliser la formule standard", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Squat",
				isCardio: false,
				isPyramid: false,
				weightKg: 80,
				sets: 4,
				reps: 5,
				pyramidSets: [],
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Squat");

			expect(service.occurrences()[0].weightKg).toBe(80);
			// 80 × 4 × 5 = 1600
			expect(service.occurrences()[0].volumeKg).toBe(1600);
		});

		it("pour un exercice pyramide avec 2 séries, weightKg doit être la moyenne des poids", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Squat",
				isCardio: false,
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 80, reps: 5 },
					{ weightKg: 100, reps: 3 },
				],
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Squat");

			expect(service.occurrences()[0].weightKg).toBe(90);
		});

		it("pour un exercice pyramide avec 2 séries, volumeKg doit être la somme de (reps_i × poids_i)", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Squat",
				isCardio: false,
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 80, reps: 5 },
					{ weightKg: 100, reps: 3 },
				],
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Squat");

			// (5 × 80) + (3 × 100) = 400 + 300 = 700
			expect(service.occurrences()[0].volumeKg).toBe(700);
		});

		it("pour un exercice pyramide avec 1 série, volumeKg doit être reps × poids de cette série", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Squat",
				isCardio: false,
				isPyramid: true,
				pyramidSets: [{ weightKg: 80, reps: 5 }],
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Squat");

			// 5 × 80 = 400
			expect(service.occurrences()[0].volumeKg).toBe(400);
		});

		it("pour un exercice pyramide avec 1 série, weightKg doit être le poids de cette série", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Squat",
				isCardio: false,
				isPyramid: true,
				pyramidSets: [{ weightKg: 90, reps: 5 }],
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Squat");

			expect(service.occurrences()[0].weightKg).toBe(90);
		});
	});

	describe("cardio occurrences", () => {
		it("should populate cardioOccurrences and leave occurrences empty for a cardio exercise", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				name: "Course à pied",
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: 5,
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Course à pied");

			expect(service.cardioOccurrences().length).toBe(1);
			expect(service.occurrences().length).toBe(0);
		});

		it("should set durationSeconds and distanceKm on cardio occurrences", async () => {
			const session = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const exercise = makeExercise({
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: 5,
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exercise]));

			await service.loadForExercise("Course à pied");

			const occ = service.cardioOccurrences()[0];
			expect(occ.durationSeconds).toBe(1800);
			expect(occ.distanceKm).toBe(5);
		});

		it("should exclude occurrences with distanceKm = 0 from the km series but include them in the time series", async () => {
			const session1 = makeSession({ id: "session-1", date: new Date("2026-01-01") });
			const session2 = makeSession({ id: "session-2", date: new Date("2026-01-08") });
			const exWithDistance = makeExercise({
				id: "ex-1",
				sessionId: "session-1",
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: 5,
				status: "validated",
			});
			const exWithoutDistance = makeExercise({
				id: "ex-2",
				sessionId: "session-2",
				isCardio: true,
				durationSeconds: 2400,
				distanceKm: null,
				status: "validated",
			});

			sessionRepoSpy.getAll.and.returnValue(Promise.resolve([session1, session2]));
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([exWithDistance, exWithoutDistance]));

			await service.loadForExercise("Course à pied");

			expect(service.cardioOccurrences().length).toBe(2);
			const kmSeries = service.cardioOccurrences().filter((o) => o.distanceKm !== null);
			expect(kmSeries.length).toBe(1);
			expect(kmSeries[0].distanceKm).toBe(5);
		});
	});
});

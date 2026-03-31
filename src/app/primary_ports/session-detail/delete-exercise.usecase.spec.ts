import { TestBed } from "@angular/core/testing";
import { DeleteExerciseUseCase } from "./delete-exercise.usecase";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionService } from "../../core_logic/session/session.service";
import { Exercise, MuscleGroup, Session } from "../../core_logic/shared/models";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { SESSION_REPOSITORY } from "../../secondary_ports/session/session.repository.interface";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Pompes",
		muscleGroup: MuscleGroup.Chest,
		muscleGroups: [MuscleGroup.Chest],
		weightKg: 0,
		sets: 3,
		reps: 10,
		breakDurationSeconds: 60,
		status: "pending",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		...overrides,
	} as Exercise;
}

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "session-1",
		date: new Date("2026-03-26"),
		status: "active",
		durationSeconds: 0,
		muscleGroup: MuscleGroup.Chest,
		exercises: [],
		...overrides,
	};
}

describe("DeleteExerciseUseCase", () => {
	let useCase: DeleteExerciseUseCase;
	let exerciseService: ExerciseService;
	let sessionService: SessionService;
	let exerciseRepoSpy: jasmine.SpyObj<{
		getBySessionId: (id: string) => Promise<Exercise[]>;
		save: (e: Exercise) => Promise<void>;
		delete: (id: string) => Promise<void>;
	}>;

	beforeEach(() => {
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getBySessionId", "save", "delete"]);
		exerciseRepoSpy.delete.and.returnValue(Promise.resolve());
		exerciseRepoSpy.getBySessionId.and.returnValue(Promise.resolve([]));

		const sessionRepoSpy = jasmine.createSpyObj("SessionRepository", ["getAll", "getById", "save", "delete"]);
		sessionRepoSpy.getAll.and.returnValue(Promise.resolve([]));

		TestBed.configureTestingModule({
			providers: [
				DeleteExerciseUseCase,
				ExerciseService,
				SessionService,
				{ provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy },
				{ provide: SESSION_REPOSITORY, useValue: sessionRepoSpy },
			],
		});

		useCase = TestBed.inject(DeleteExerciseUseCase);
		exerciseService = TestBed.inject(ExerciseService);
		sessionService = TestBed.inject(SessionService);
	});

	describe("session list synchronization after exercise deletion", () => {
		it("should remove the deleted exercise from the sessions list", async () => {
			const exercise = makeExercise({ id: "ex-1", sessionId: "session-1", muscleGroup: MuscleGroup.Chest });
			const session = makeSession({ id: "session-1", exercises: [exercise] });
			sessionService._sessions.set([session]);
			exerciseService["_exercises"].set([exercise]);

			await useCase.execute("ex-1");

			const updatedSession = sessionService._sessions().find((s) => s.id === "session-1");
			expect(updatedSession?.exercises.some((e) => e.id === "ex-1")).toBeFalse();
		});

		it("should keep the remaining exercises of the same session after deletion", async () => {
			const exerciseToDelete = makeExercise({ id: "ex-1", sessionId: "session-1", muscleGroup: MuscleGroup.Chest });
			const exerciseToKeep = makeExercise({ id: "ex-2", sessionId: "session-1", muscleGroup: MuscleGroup.Back });
			const session = makeSession({ id: "session-1", exercises: [exerciseToDelete, exerciseToKeep] });
			sessionService._sessions.set([session]);
			exerciseService["_exercises"].set([exerciseToDelete, exerciseToKeep]);

			await useCase.execute("ex-1");

			const updatedSession = sessionService._sessions().find((s) => s.id === "session-1");
			expect(updatedSession?.exercises.some((e) => e.id === "ex-2")).toBeTrue();
		});

		it("should not affect exercises in other sessions", async () => {
			const exerciseInSession1 = makeExercise({ id: "ex-1", sessionId: "session-1", muscleGroup: MuscleGroup.Chest });
			const exerciseInSession2 = makeExercise({ id: "ex-2", sessionId: "session-2", muscleGroup: MuscleGroup.Back });
			const session1 = makeSession({ id: "session-1", exercises: [exerciseInSession1] });
			const session2 = makeSession({ id: "session-2", exercises: [exerciseInSession2] });
			sessionService._sessions.set([session1, session2]);
			exerciseService["_exercises"].set([exerciseInSession1]);

			await useCase.execute("ex-1");

			const updatedSession2 = sessionService._sessions().find((s) => s.id === "session-2");
			expect(updatedSession2?.exercises.some((e) => e.id === "ex-2")).toBeTrue();
		});
	});
});

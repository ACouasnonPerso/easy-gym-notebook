import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { SessionExerciseEffectsService } from "./session-exercise-effects.service";
import { SessionService } from "../session/session.service";
import { ExerciseService } from "./exercise.service";
import { SessionChronoService } from "../chrono/session-chrono.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { Exercise, MuscleGroup, Session } from "../shared/models";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: crypto.randomUUID(),
		sessionId: "target",
		name: "Biceps curl",
		muscleGroup: MuscleGroup.Biceps,
		muscleGroups: [MuscleGroup.Biceps],
		weightKg: 20,
		sets: 5,
		reps: 10,
		breakDurationSeconds: 90,
		status: "pending",
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

const run = (o: Partial<Exercise> = {}) =>
	makeExercise({ name: "Course", isCardio: true, muscleGroup: null, muscleGroups: [], sets: 0, ...o });

describe("SessionExerciseEffectsService", () => {
	let currentSession: ReturnType<typeof signal<Session | null>>;
	let exercises: Exercise[];
	let updateCurrentSession: jasmine.Spy;
	let overrideElapsedForSession: jasmine.Spy;
	let trackSessionStarted: jasmine.Spy;
	let trackSessionUpdated: jasmine.Spy;
	let service: SessionExerciseEffectsService;

	beforeEach(() => {
		currentSession = signal<Session | null>({
			id: "target",
			date: new Date(),
			status: "active",
			durationSeconds: 0,
			muscleGroup: null,
			exercises: [],
		});
		exercises = [];
		updateCurrentSession = jasmine.createSpy("updateCurrentSession").and.callFake(async (changes: Partial<Session>) => {
			currentSession.set({ ...currentSession()!, ...changes });
		});
		overrideElapsedForSession = jasmine.createSpy("overrideElapsedForSession");
		trackSessionStarted = jasmine.createSpy("trackSessionStarted");
		trackSessionUpdated = jasmine.createSpy("trackSessionUpdated");

		TestBed.configureTestingModule({
			providers: [
				{ provide: SessionService, useValue: { currentSession, updateCurrentSession } },
				{ provide: ExerciseService, useValue: { exercises: () => exercises } },
				{ provide: SessionChronoService, useValue: { overrideElapsedForSession } },
				{ provide: AnalyticsService, useValue: { trackSessionStarted, trackSessionUpdated } },
			],
		});
		service = TestBed.inject(SessionExerciseEffectsService);
	});

	it("sets the session muscle group from the first strength exercise and tracks the session start", async () => {
		await service.afterExercisesAdded(
			[run(), makeExercise({ muscleGroup: MuscleGroup.Triceps }), makeExercise()],
			true
		);

		expect(updateCurrentSession).toHaveBeenCalledWith({ muscleGroup: MuscleGroup.Triceps });
		expect(trackSessionStarted).toHaveBeenCalledTimes(1);
	});

	it("keeps the session muscle group when it already has one", async () => {
		currentSession.set({ ...currentSession()!, muscleGroup: MuscleGroup.Chest });

		await service.afterExercisesAdded([makeExercise()], true);

		expect(updateCurrentSession).not.toHaveBeenCalledWith(
			jasmine.objectContaining({ muscleGroup: jasmine.anything() })
		);
		expect(trackSessionStarted).not.toHaveBeenCalled();
	});

	it("sets the session duration and chrono to the total cardio duration when an empty session starts with cardio", async () => {
		await service.afterExercisesAdded([run({ durationSeconds: 600 }), run({ durationSeconds: 1800 })], true);

		expect(currentSession()!.durationSeconds).toBe(2400);
		expect(overrideElapsedForSession).toHaveBeenCalledWith("target", 2400);
	});

	it("does not override the chrono of a completed session", async () => {
		currentSession.set({ ...currentSession()!, status: "completed" });

		await service.afterExercisesAdded([run({ durationSeconds: 1800 })], true);

		expect(currentSession()!.durationSeconds).toBe(1800);
		expect(overrideElapsedForSession).not.toHaveBeenCalled();
	});

	it("does not touch the duration when the session was not empty or does not start with cardio", async () => {
		await service.afterExercisesAdded([run({ durationSeconds: 1800 })], false);
		await service.afterExercisesAdded([makeExercise(), run({ durationSeconds: 1800 })], true);

		expect(currentSession()!.durationSeconds).toBe(0);
		expect(overrideElapsedForSession).not.toHaveBeenCalled();
	});

	it("tracks the session update with the validated exercise names", async () => {
		exercises = [makeExercise({ name: "Done", status: "validated" }), makeExercise({ name: "Todo" })];

		await service.afterExercisesAdded([makeExercise()], true);

		expect(trackSessionUpdated).toHaveBeenCalledWith(currentSession(), ["Done"]);
	});

	it("does nothing when no exercise was added", async () => {
		await service.afterExercisesAdded([], true);

		expect(updateCurrentSession).not.toHaveBeenCalled();
		expect(trackSessionUpdated).not.toHaveBeenCalled();
	});
});

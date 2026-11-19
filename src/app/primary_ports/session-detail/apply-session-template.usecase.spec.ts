import { TestBed } from "@angular/core/testing";
import { ApplySessionTemplateUseCase } from "./apply-session-template.usecase";
import { ExerciseService } from "../../core_logic/session-detail/exercise.service";
import { SessionExerciseEffectsService } from "../../core_logic/session-detail/session-exercise-effects.service";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Exercise, MuscleGroup } from "../../core_logic/shared/models";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "src-1",
		sessionId: "source",
		name: "Biceps curl",
		muscleGroup: MuscleGroup.Biceps,
		muscleGroups: [MuscleGroup.Biceps],
		weightKg: 20,
		sets: 5,
		reps: 10,
		breakDurationSeconds: 90,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: 15,
		comment: "dur",
		...overrides,
	};
}

describe("ApplySessionTemplateUseCase", () => {
	let sourceExercises: Exercise[];
	let currentExercises: Exercise[];
	let addMany: jasmine.Spy;
	let afterExercisesAdded: jasmine.Spy;

	beforeEach(() => {
		sourceExercises = [
			makeExercise({ id: "a", name: "Biceps curl" }),
			makeExercise({ id: "b", name: "Leg curl", status: "cancelled" }),
			makeExercise({ id: "c", name: "Abandoned", status: "pending" }),
			makeExercise({ id: "d", name: "Triceps poulie", muscleGroup: MuscleGroup.Triceps }),
		];
		currentExercises = [];
		addMany = jasmine.createSpy("addMany").and.resolveTo();
		afterExercisesAdded = jasmine.createSpy("afterExercisesAdded").and.resolveTo();

		TestBed.configureTestingModule({
			providers: [
				{ provide: EXERCISE_REPOSITORY, useValue: { getBySessionId: async () => sourceExercises } },
				{ provide: ExerciseService, useValue: { addMany, exercises: () => currentExercises } },
				{ provide: SessionExerciseEffectsService, useValue: { afterExercisesAdded } },
			],
		});
	});

	it("copies only the validated exercises of the source session, in one batch, as pending exercises", async () => {
		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(addMany).toHaveBeenCalledTimes(1);
		const added: Exercise[] = addMany.calls.mostRecent().args[0];
		expect(added.map((e) => e.name)).toEqual(["Biceps curl", "Triceps poulie"]);
		for (const exercise of added) {
			expect(exercise.sessionId).toBe("target");
			expect(exercise.status).toBe("pending");
			expect(exercise.rating).toBeNull();
			expect(exercise.comment).toBeNull();
			expect(["a", "d"]).not.toContain(exercise.id);
		}
		expect(added[0].sets).toBe(5);
		expect(added[0].weightKg).toBe(20);
	});

	it("applies the shared session effects to the copied exercises, telling whether the session was empty", async () => {
		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(afterExercisesAdded).toHaveBeenCalledOnceWith(addMany.calls.mostRecent().args[0], true);
	});

	it("tells the shared effects the session was not empty when it already has exercises", async () => {
		currentExercises = [makeExercise({ id: "existing", sessionId: "target" })];

		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(afterExercisesAdded.calls.mostRecent().args[1]).toBeFalse();
	});

	it("does nothing when the source session has no validated exercise", async () => {
		sourceExercises = [makeExercise({ status: "pending" })];

		await TestBed.inject(ApplySessionTemplateUseCase).execute("target", "source");

		expect(addMany).not.toHaveBeenCalled();
		expect(afterExercisesAdded).not.toHaveBeenCalled();
	});
});

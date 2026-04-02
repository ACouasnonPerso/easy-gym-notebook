import { TestBed } from "@angular/core/testing";
import { MergeExercisesService } from "./merge-exercises.service";
import { EXERCISE_REPOSITORY } from "../../secondary_ports/exercise/exercise.repository.interface";
import { Exercise } from "../shared/models";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Développé couché",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 80,
		sets: 4,
		reps: 8,
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

describe("MergeExercisesService", () => {
	let service: MergeExercisesService;
	let exerciseRepoSpy: jasmine.SpyObj<{
		getAll: () => Promise<Exercise[]>;
		save: (e: Exercise) => Promise<void>;
	}>;

	beforeEach(() => {
		exerciseRepoSpy = jasmine.createSpyObj("ExerciseRepository", ["getAll", "save"]);
		exerciseRepoSpy.save.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [MergeExercisesService, { provide: EXERCISE_REPOSITORY, useValue: exerciseRepoSpy }],
		});

		service = TestBed.inject(MergeExercisesService);
	});

	describe("merge()", () => {
		it("devrait ne rien faire quand la liste des noms sources est vide", async () => {
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve([]));

			await service.merge([], "Nouveau nom");

			expect(exerciseRepoSpy.save).not.toHaveBeenCalled();
		});

		it("devrait renommer tous les exercices dont le nom correspond au nom source", async () => {
			const exercises = [
				makeExercise({ id: "ex-1", name: "Développé couché" }),
				makeExercise({ id: "ex-2", name: "Développé couché" }),
				makeExercise({ id: "ex-3", name: "Squat" }),
			];
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve(exercises));

			await service.merge(["Développé couché"], "Bench Press");

			expect(exerciseRepoSpy.save).toHaveBeenCalledTimes(2);
			expect(exerciseRepoSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ id: "ex-1", name: "Bench Press" }));
			expect(exerciseRepoSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ id: "ex-2", name: "Bench Press" }));
		});

		it("devrait renommer les exercices de plusieurs noms sources différents", async () => {
			const exercises = [
				makeExercise({ id: "ex-1", name: "DC" }),
				makeExercise({ id: "ex-2", name: "Squat" }),
				makeExercise({ id: "ex-3", name: "Tirage" }),
			];
			exerciseRepoSpy.getAll.and.returnValue(Promise.resolve(exercises));

			await service.merge(["DC", "Squat"], "Compound");

			expect(exerciseRepoSpy.save).toHaveBeenCalledTimes(2);
			expect(exerciseRepoSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ id: "ex-1", name: "Compound" }));
			expect(exerciseRepoSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ id: "ex-2", name: "Compound" }));
			expect(exerciseRepoSpy.save).not.toHaveBeenCalledWith(jasmine.objectContaining({ id: "ex-3" }));
		});
	});
});

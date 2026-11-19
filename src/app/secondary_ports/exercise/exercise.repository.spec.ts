import { TestBed } from "@angular/core/testing";
import { ExerciseRepository } from "./exercise.repository";
import { ExerciseMapper } from "../../secondary_adapters/exercise/exercise.mapper";
import { Exercise, MuscleGroup } from "../../core_logic/shared/models";

function makeExercise(id: string, name: string): Exercise {
	return {
		id,
		sessionId: "s1",
		name,
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
	};
}

describe("ExerciseRepository", () => {
	let repo: ExerciseRepository;

	beforeEach(() => {
		localStorage.removeItem("egn_exercises");
		TestBed.configureTestingModule({ providers: [ExerciseRepository, ExerciseMapper] });
		repo = TestBed.inject(ExerciseRepository);
	});

	afterEach(() => localStorage.removeItem("egn_exercises"));

	it("saveMany adds new exercises and updates existing ones in a single write, keeping their order", async () => {
		await repo.save(makeExercise("a", "Curl"));
		const setItem = spyOn(localStorage, "setItem").and.callThrough();

		await repo.saveMany([makeExercise("b", "Dips"), makeExercise("a", "Curl marteau"), makeExercise("c", "Pushdown")]);

		expect(setItem).toHaveBeenCalledTimes(1);
		expect((await repo.getAll()).map((e) => `${e.id}:${e.name}`)).toEqual(["a:Curl marteau", "b:Dips", "c:Pushdown"]);
	});
});

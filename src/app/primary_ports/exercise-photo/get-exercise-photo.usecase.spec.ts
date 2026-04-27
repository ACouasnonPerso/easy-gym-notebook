import { TestBed } from "@angular/core/testing";
import { GetExercisePhotoUseCase } from "./get-exercise-photo.usecase";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";
import { ExercisePhoto } from "../../core_logic/shared/models";

const aPhoto: ExercisePhoto = {
	exerciseName: "Squat",
	dataUrl: "data:image/jpeg;base64,squat",
	capturedAt: new Date("2026-01-01T10:00:00.000Z"),
};

describe("GetExercisePhotoUseCase", () => {
	let useCase: GetExercisePhotoUseCase;
	let store: ExercisePhotoStore;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [GetExercisePhotoUseCase, ExercisePhotoStore],
		});
		useCase = TestBed.inject(GetExercisePhotoUseCase);
		store = TestBed.inject(ExercisePhotoStore);
	});

	it("should return undefined when no photo exists for the given name in an empty store", () => {
		const result = useCase.photoFor("Squat");

		expect(result).toBeUndefined();
	});

	it("should return the photo data URL when the store has a matching entry for the given name", () => {
		store.setAll([aPhoto]);

		const result = useCase.photoFor("Squat");

		expect(result).toBe(aPhoto.dataUrl);
	});

	it("should return undefined when asking for a name that differs from what is stored", () => {
		store.setAll([aPhoto]);

		const result = useCase.photoFor("Bench Press");

		expect(result).toBeUndefined();
	});

	it("should return the updated data URL after the store is updated for the same name", () => {
		store.setAll([aPhoto]);
		expect(useCase.photoFor("Squat")).toBe(aPhoto.dataUrl);

		const updatedPhoto: ExercisePhoto = {
			exerciseName: "Squat",
			dataUrl: "data:image/jpeg;base64,squat-updated",
			capturedAt: new Date("2026-01-05T10:00:00.000Z"),
		};
		store.setForName("Squat", updatedPhoto);

		expect(useCase.photoFor("Squat")).toBe("data:image/jpeg;base64,squat-updated");
	});
});

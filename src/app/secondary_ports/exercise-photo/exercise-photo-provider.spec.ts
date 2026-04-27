import { TestBed } from "@angular/core/testing";
import { EXERCISE_PHOTO_REPOSITORY } from "./exercise-photo.repository.interface";
import { ExercisePhotoRepository } from "./exercise-photo.repository";

describe("ExercisePhotoRepository provider", () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ExercisePhotoRepository,
				{ provide: EXERCISE_PHOTO_REPOSITORY, useClass: ExercisePhotoRepository },
			],
		});
	});

	it("should resolve the exercise photo repository from the DI container", () => {
		const repository = TestBed.inject(EXERCISE_PHOTO_REPOSITORY);

		expect(repository).toBeTruthy();
	});

	it("should resolve to the IndexedDB-backed implementation when injecting the token", () => {
		const repository = TestBed.inject(EXERCISE_PHOTO_REPOSITORY);

		expect(repository instanceof ExercisePhotoRepository).toBeTrue();
	});
});

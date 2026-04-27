import { TestBed } from "@angular/core/testing";
import { RemoveExercisePhotoUseCase } from "./remove-exercise-photo.usecase";
import { ExercisePhotoService } from "../../core_logic/exercise-photo/exercise-photo.service";

describe("RemoveExercisePhotoUseCase", () => {
	let useCase: RemoveExercisePhotoUseCase;
	let serviceSpy: jasmine.SpyObj<ExercisePhotoService>;

	beforeEach(() => {
		serviceSpy = jasmine.createSpyObj<ExercisePhotoService>("ExercisePhotoService", ["removeForName"]);
		serviceSpy.removeForName.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				RemoveExercisePhotoUseCase,
				{ provide: ExercisePhotoService, useValue: serviceSpy },
			],
		});
		useCase = TestBed.inject(RemoveExercisePhotoUseCase);
	});

	it("should delegate to the service removeForName with the given exercise name", async () => {
		await useCase.execute("Squat");

		expect(serviceSpy.removeForName).toHaveBeenCalledWith("Squat");
	});

	it("should delegate with the correct name when removing a different exercise", async () => {
		await useCase.execute("Bench Press");

		expect(serviceSpy.removeForName).toHaveBeenCalledWith("Bench Press");
	});
});

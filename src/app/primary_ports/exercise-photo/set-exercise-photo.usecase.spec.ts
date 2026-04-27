import { TestBed } from "@angular/core/testing";
import { SetExercisePhotoUseCase } from "./set-exercise-photo.usecase";
import { ExercisePhotoService } from "../../core_logic/exercise-photo/exercise-photo.service";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";
import { EXERCISE_PHOTO_REPOSITORY } from "../../secondary_ports/exercise-photo/exercise-photo.repository.interface";
import { ImageDownscalerService } from "../../core_logic/exercise-photo/image-downscaler.service";

describe("SetExercisePhotoUseCase", () => {
	let useCase: SetExercisePhotoUseCase;
	let serviceSpy: jasmine.SpyObj<ExercisePhotoService>;

	beforeEach(() => {
		serviceSpy = jasmine.createSpyObj<ExercisePhotoService>("ExercisePhotoService", ["setForName"]);
		serviceSpy.setForName.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				SetExercisePhotoUseCase,
				{ provide: ExercisePhotoService, useValue: serviceSpy },
			],
		});
		useCase = TestBed.inject(SetExercisePhotoUseCase);
	});

	it("should not call the service when the file mime type is not image/*", async () => {
		const file = new File(["content"], "document.pdf", { type: "application/pdf" });

		await useCase.execute("Squat", file);

		expect(serviceSpy.setForName).not.toHaveBeenCalled();
	});

	it("should delegate to the service when the file mime type is image/jpeg", async () => {
		const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

		await useCase.execute("Squat", file);

		expect(serviceSpy.setForName).toHaveBeenCalledWith("Squat", file);
	});

	it("should delegate to the service when the file mime type is image/png", async () => {
		const file = new File(["content"], "photo.png", { type: "image/png" });

		await useCase.execute("Squat", file);

		expect(serviceSpy.setForName).toHaveBeenCalledWith("Squat", file);
	});

	it("should not call the service when the mime type is a non-image type", async () => {
		const file = new File(["content"], "video.mp4", { type: "video/mp4" });

		await useCase.execute("Squat", file);

		expect(serviceSpy.setForName).not.toHaveBeenCalled();
	});
});

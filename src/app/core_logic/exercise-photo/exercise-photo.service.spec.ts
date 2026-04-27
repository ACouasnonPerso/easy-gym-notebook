import { TestBed } from "@angular/core/testing";
import { ExercisePhotoService } from "./exercise-photo.service";
import { ExercisePhotoStore } from "../../stores/exercise-photo.store";
import { EXERCISE_PHOTO_REPOSITORY, IExercisePhotoRepository } from "../../secondary_ports/exercise-photo/exercise-photo.repository.interface";
import { ImageDownscalerService } from "./image-downscaler.service";
import { ExercisePhoto } from "../shared/models";

const aPhoto: ExercisePhoto = {
	exerciseName: "Squat",
	dataUrl: "data:image/jpeg;base64,squat",
	capturedAt: new Date("2026-01-01T10:00:00.000Z"),
};

const anotherPhoto: ExercisePhoto = {
	exerciseName: "Bench Press",
	dataUrl: "data:image/jpeg;base64,bench",
	capturedAt: new Date("2026-01-02T10:00:00.000Z"),
};

class FakeExercisePhotoRepository implements IExercisePhotoRepository {
	private _allPhotos: ExercisePhoto[] = [];

	setPhotos(photos: ExercisePhoto[]): void {
		this._allPhotos = photos;
	}

	async getAllPhotos(): Promise<ExercisePhoto[]> {
		return [...this._allPhotos];
	}

	async getAll(exerciseName: string): Promise<ExercisePhoto[]> {
		return this._allPhotos.filter((p) => p.exerciseName === exerciseName);
	}

	async save(photo: ExercisePhoto): Promise<void> {
		const index = this._allPhotos.findIndex((p) => p.exerciseName === photo.exerciseName);
		if (index >= 0) {
			this._allPhotos[index] = photo;
		} else {
			this._allPhotos.push(photo);
		}
	}

	async delete(exerciseName: string, capturedAt: Date): Promise<void> {
		this._allPhotos = this._allPhotos.filter(
			(p) => !(p.exerciseName === exerciseName && p.capturedAt.getTime() === capturedAt.getTime())
		);
	}
}

describe("ExercisePhotoService", () => {
	let service: ExercisePhotoService;
	let store: ExercisePhotoStore;
	let fakeRepo: FakeExercisePhotoRepository;
	let downscalerSpy: jasmine.SpyObj<ImageDownscalerService>;

	beforeEach(() => {
		fakeRepo = new FakeExercisePhotoRepository();
		downscalerSpy = jasmine.createSpyObj<ImageDownscalerService>("ImageDownscalerService", ["downscale"]);

		TestBed.configureTestingModule({
			providers: [
				ExercisePhotoService,
				ExercisePhotoStore,
				{ provide: EXERCISE_PHOTO_REPOSITORY, useValue: fakeRepo },
				{ provide: ImageDownscalerService, useValue: downscalerSpy },
			],
		});

		service = TestBed.inject(ExercisePhotoService);
		store = TestBed.inject(ExercisePhotoStore);
	});

	it("should expose an empty photo list before any load has been requested", () => {
		expect(store.photos()).toEqual([]);
	});

	it("should populate the photo list with all persisted photos when loadAll() is called", async () => {
		fakeRepo.setPhotos([aPhoto, anotherPhoto]);

		await service.loadAll();

		expect(store.photos()).toEqual([aPhoto, anotherPhoto]);
	});

	it("should leave the photo list empty when the repository contains no photos", async () => {
		await service.loadAll();

		expect(store.photos()).toEqual([]);
	});

	it("should replace the photo for a name in the store when a small image is saved", async () => {
		const file = new File([""], "squat.jpg", { type: "image/jpeg" });
		downscalerSpy.downscale.and.resolveTo("data:image/jpeg;base64,squat-downscaled");

		await service.setForName("Squat", file);

		const stored = store.getByName("Squat");
		expect(stored).toBeTruthy();
		expect(stored!.exerciseName).toBe("Squat");
		expect(stored!.dataUrl).toBe("data:image/jpeg;base64,squat-downscaled");
	});

	it("should keep other photos intact when a photo is saved for a specific name", async () => {
		store.setAll([anotherPhoto]);
		const file = new File([""], "squat.jpg", { type: "image/jpeg" });
		downscalerSpy.downscale.and.resolveTo("data:image/jpeg;base64,squat-downscaled");

		await service.setForName("Squat", file);

		expect(store.getByName("Bench Press")).toEqual(anotherPhoto);
	});

	it("should limit the image to 1024 px on the longest edge when saving a photo wider than 1024 px", async () => {
		const file = new File([""], "wide.jpg", { type: "image/jpeg" });
		downscalerSpy.downscale.and.resolveTo("data:image/jpeg;base64,wide-resized");

		await service.setForName("Squat", file);

		expect(downscalerSpy.downscale).toHaveBeenCalledWith(file, 1024);
		expect(store.getByName("Squat")!.dataUrl).toBe("data:image/jpeg;base64,wide-resized");
	});

	it("should not alter image dimensions when saving a photo whose longest edge is <= 1024 px", async () => {
		const file = new File([""], "small.jpg", { type: "image/jpeg" });
		downscalerSpy.downscale.and.resolveTo("data:image/jpeg;base64,small-unchanged");

		await service.setForName("Squat", file);

		expect(downscalerSpy.downscale).toHaveBeenCalledWith(file, 1024);
		expect(store.getByName("Squat")!.dataUrl).toBe("data:image/jpeg;base64,small-unchanged");
	});

	it("should remove the photo from the store when removeForName() is called", async () => {
		store.setAll([aPhoto, anotherPhoto]);

		await service.removeForName("Squat");

		expect(store.getByName("Squat")).toBeUndefined();
	});

	it("should leave other photos in the store when the photo for a specific name is removed", async () => {
		store.setAll([aPhoto, anotherPhoto]);

		await service.removeForName("Squat");

		expect(store.getByName("Bench Press")).toEqual(anotherPhoto);
	});
});

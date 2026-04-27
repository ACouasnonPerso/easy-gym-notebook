import "fake-indexeddb/auto";
import { TestBed } from "@angular/core/testing";
import { ExercisePhotoRepository } from "./exercise-photo.repository";
import { ExercisePhoto } from "../../core_logic/shared/models";

const aPhoto: ExercisePhoto = {
	exerciseName: "Squat",
	dataUrl: "data:image/jpeg;base64,/9j/test",
	capturedAt: new Date("2026-01-01T10:00:00.000Z"),
};

describe("ExercisePhotoRepository", () => {
	let repository: ExercisePhotoRepository;

	beforeEach(async () => {
		TestBed.configureTestingModule({ providers: [ExercisePhotoRepository] });
		repository = TestBed.inject(ExercisePhotoRepository);
	});

	afterEach(async () => {
		await repository.close();
		await new Promise<void>((resolve, reject) => {
			const req = indexedDB.deleteDatabase("easy-gym-photos");
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
			req.onblocked = () => resolve();
		});
	});

	it("should return an empty list when no photos have been saved", async () => {
		const result = await repository.getAll("Squat");

		expect(result).toEqual([]);
	});

	it("should return the saved photo when one photo is saved", async () => {
		await repository.save(aPhoto);

		const result = await repository.getAll("Squat");

		expect(result.length).toBe(1);
		expect(result[0].exerciseName).toBe("Squat");
		expect(result[0].dataUrl).toBe(aPhoto.dataUrl);
	});

	it("should return only the matching photo when multiple names are stored", async () => {
		const benchPhoto: ExercisePhoto = { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,bench", capturedAt: new Date("2026-01-02T10:00:00.000Z") };
		await repository.save(aPhoto);
		await repository.save(benchPhoto);

		const result = await repository.getAll("Squat");

		expect(result.length).toBe(1);
		expect(result[0].exerciseName).toBe("Squat");
	});

	it("should replace the existing photo when saving again under the same name", async () => {
		const updatedPhoto: ExercisePhoto = { exerciseName: "Squat", dataUrl: "data:image/jpeg;base64,updated", capturedAt: new Date("2026-01-03T10:00:00.000Z") };
		await repository.save(aPhoto);
		await repository.save(updatedPhoto);

		const result = await repository.getAll("Squat");

		expect(result.length).toBe(1);
		expect(result[0].dataUrl).toBe("data:image/jpeg;base64,updated");
	});

	it("should return an empty list after the only saved photo is deleted", async () => {
		await repository.save(aPhoto);
		await repository.delete(aPhoto.exerciseName, aPhoto.capturedAt);

		const result = await repository.getAll("Squat");

		expect(result).toEqual([]);
	});

	it("should leave other photos intact when one specific photo is deleted", async () => {
		const benchPhoto: ExercisePhoto = { exerciseName: "Bench Press", dataUrl: "data:image/jpeg;base64,bench", capturedAt: new Date("2026-01-02T10:00:00.000Z") };
		await repository.save(aPhoto);
		await repository.save(benchPhoto);
		await repository.delete(aPhoto.exerciseName, aPhoto.capturedAt);

		const squatResult = await repository.getAll("Squat");
		const benchResult = await repository.getAll("Bench Press");

		expect(squatResult).toEqual([]);
		expect(benchResult.length).toBe(1);
		expect(benchResult[0].exerciseName).toBe("Bench Press");
	});
});

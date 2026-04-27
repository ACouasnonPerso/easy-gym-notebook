import { ExercisePhotoStore } from "./exercise-photo.store";
import { ExercisePhoto } from "../core_logic/shared/models";

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

describe("ExercisePhotoStore", () => {
	let store: ExercisePhotoStore;

	beforeEach(() => {
		store = new ExercisePhotoStore();
	});

	it("should expose an empty photo list when no photos have been loaded", () => {
		expect(store.photos()).toEqual([]);
	});

	it("should expose all loaded photos when photos are set in bulk", () => {
		store.setAll([aPhoto, anotherPhoto]);

		expect(store.photos()).toEqual([aPhoto, anotherPhoto]);
	});

	it("should return no photo when looking up a name that has no photo loaded", () => {
		expect(store.getByName("Squat")).toBeUndefined();
	});

	it("should return the correct photo when looking up a name that has a photo loaded", () => {
		store.setAll([aPhoto, anotherPhoto]);

		expect(store.getByName("Squat")).toEqual(aPhoto);
	});

	it("should reflect the new photo when a single photo is updated by name", () => {
		store.setAll([aPhoto]);
		const updatedPhoto: ExercisePhoto = {
			exerciseName: "Squat",
			dataUrl: "data:image/jpeg;base64,squat-updated",
			capturedAt: new Date("2026-01-05T10:00:00.000Z"),
		};

		store.setForName("Squat", updatedPhoto);

		expect(store.getByName("Squat")).toEqual(updatedPhoto);
	});

	it("should leave other photos unchanged when a single photo is updated by name", () => {
		store.setAll([aPhoto, anotherPhoto]);
		const updatedPhoto: ExercisePhoto = {
			exerciseName: "Squat",
			dataUrl: "data:image/jpeg;base64,squat-updated",
			capturedAt: new Date("2026-01-05T10:00:00.000Z"),
		};

		store.setForName("Squat", updatedPhoto);

		expect(store.getByName("Bench Press")).toEqual(anotherPhoto);
	});

	it("should remove a photo from the store when it is cleared by name", () => {
		store.setAll([aPhoto, anotherPhoto]);

		store.clearForName("Squat");

		expect(store.getByName("Squat")).toBeUndefined();
		expect(store.photos().length).toBe(1);
	});

	it("should replace all previously loaded photos when setAll is called a second time", () => {
		store.setAll([aPhoto, anotherPhoto]);
		const newPhoto: ExercisePhoto = {
			exerciseName: "Deadlift",
			dataUrl: "data:image/jpeg;base64,deadlift",
			capturedAt: new Date("2026-01-03T10:00:00.000Z"),
		};

		store.setAll([newPhoto]);

		expect(store.photos()).toEqual([newPhoto]);
	});
});

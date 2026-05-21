import { LocalStorageRecentHighlightsRepository } from "./local-storage-recent-highlights.repository";

const STORAGE_KEY = "highlight_stats_recent_highlights";

describe("LocalStorageRecentHighlightsRepository", () => {
	let repo: LocalStorageRecentHighlightsRepository;

	beforeEach(() => {
		localStorage.clear();
		repo = new LocalStorageRecentHighlightsRepository();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("should return [] when storage key is absent", () => {
		expect(repo.getRecent()).toEqual([]);
	});

	it("should return [] when stored value is not valid JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{");
		expect(repo.getRecent()).toEqual([]);
	});

	it("should return [] when stored value is JSON but not an array", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: "x" }));
		expect(repo.getRecent()).toEqual([]);
	});

	it("should return the stored entries when the key contains a valid array", () => {
		const entries = [
			{ id: "a", exerciseName: "Squat" },
			{ id: "b", exerciseName: "Bench" },
		];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
		expect(repo.getRecent()).toEqual(entries);
	});

	it("should persist a single entry and getRecent() returns it", () => {
		repo.pushRecent([{ id: "x", exerciseName: "Deadlift" }]);
		expect(repo.getRecent()).toEqual([{ id: "x", exerciseName: "Deadlift" }]);
	});

	it("should append new entries to the end, preserving existing ones", () => {
		repo.pushRecent([{ id: "a", exerciseName: "Squat" }]);
		repo.pushRecent([{ id: "b", exerciseName: "Bench" }]);
		expect(repo.getRecent()).toEqual([
			{ id: "a", exerciseName: "Squat" },
			{ id: "b", exerciseName: "Bench" },
		]);
	});

	it("should drop oldest entries when the buffer exceeds 6", () => {
		for (let i = 1; i <= 7; i++) {
			repo.pushRecent([{ id: `e${i}`, exerciseName: `Ex${i}` }]);
		}
		const recent = repo.getRecent();
		expect(recent.length).toBe(6);
		expect(recent.map((e) => e.id)).toEqual(["e2", "e3", "e4", "e5", "e6", "e7"]);
	});

	it("should accept entries with no exerciseName field (optional property)", () => {
		repo.pushRecent([{ id: "noname" }]);
		expect(repo.getRecent()).toEqual([{ id: "noname" }]);
	});

	it("should be a no-op when pushing zero entries", () => {
		repo.pushRecent([{ id: "a" }]);
		repo.pushRecent([]);
		expect(repo.getRecent()).toEqual([{ id: "a" }]);
	});

	it("should append all entries in order when pushing multiple at once", () => {
		repo.pushRecent([
			{ id: "a", exerciseName: "Squat" },
			{ id: "b", exerciseName: "Bench" },
			{ id: "c", exerciseName: "Press" },
		]);
		expect(repo.getRecent()).toEqual([
			{ id: "a", exerciseName: "Squat" },
			{ id: "b", exerciseName: "Bench" },
			{ id: "c", exerciseName: "Press" },
		]);
	});

	it("should apply ring buffer cap when a multi-entry push causes total to exceed 6", () => {
		repo.pushRecent([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }]);
		repo.pushRecent([{ id: "e" }, { id: "f" }, { id: "g" }]);
		const recent = repo.getRecent();
		expect(recent.length).toBe(6);
		expect(recent.map((e) => e.id)).toEqual(["b", "c", "d", "e", "f", "g"]);
	});

	it("should not throw when localStorage.setItem throws (e.g. storage full)", () => {
		spyOn(Storage.prototype, "setItem").and.throwError("QuotaExceededError");
		expect(() => repo.pushRecent([{ id: "x" }])).not.toThrow();
	});

	it("should filter non-object entries from stored array (malformed elements)", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "a" }, "bad", 42, null]));
		expect(repo.getRecent()).toEqual([{ id: "a" }]);
	});

	it("should filter stored entries that lack an id field", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ id: "a" }, { exerciseName: "NoId" }, { id: "b" }]),
		);
		expect(repo.getRecent()).toEqual([{ id: "a" }, { id: "b" }]);
	});
});

import { ImportMapper } from "./import.mapper";
import { RawSession, RawExercise } from "../../core_logic/shared/models";

function makeRawSessionJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: "session-1",
		date: "2026-03-01T00:00:00.000Z",
		status: "completed",
		durationSeconds: 3600,
		muscleGroup: null,
		...overrides,
	};
}

function makeRawExerciseJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Développé couché",
		muscleGroup: null,
		weightKg: 80,
		sets: 4,
		reps: 8,
		breakDurationSeconds: 90,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
rating: null,
...overrides,
	};
}

describe("ImportMapper", () => {
	let mapper: ImportMapper;

	beforeEach(() => {
		mapper = new ImportMapper();
	});

	describe("mapSession()", () => {
		it("should map a minimal valid raw JSON session node to a RawSession", () => {
			const raw = makeRawSessionJson();

			const result = mapper.mapSession(raw);

			expect(result).toEqual({
				id: "session-1",
				date: "2026-03-01T00:00:00.000Z",
				status: "completed",
				durationSeconds: 3600,
				muscleGroup: null,
			} as RawSession);
		});

		it('should return null when the session node is missing required field "id"', () => {
			const raw = makeRawSessionJson();
			delete raw["id"];

			const result = mapper.mapSession(raw);

			expect(result).toBeNull();
		});
	});

	describe("mapExercise()", () => {
		it("should map a raw JSON exercise node with all optional fields present", () => {
			const raw = makeRawExerciseJson({
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: 5,
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
			});

			const result = mapper.mapExercise(raw);

			expect(result).toEqual({
				id: "ex-1",
				sessionId: "session-1",
				name: "Développé couché",
				muscleGroup: null,
				weightKg: 80,
				sets: 4,
				reps: 8,
				breakDurationSeconds: 90,
				status: "validated",
				isCardio: true,
				durationSeconds: 1800,
				distanceKm: 5,
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
				rating: null,
			} as RawExercise);
		});

		it("should default isCardio to false when absent from the raw JSON exercise node", () => {
			const raw = makeRawExerciseJson();
			delete raw["isCardio"];

			const result = mapper.mapExercise(raw);

			expect(result).not.toBeNull();
			expect(result!.isCardio).toBeFalse();
		});

		it("should default isPyramid to false and pyramidSets to [] when absent from raw JSON", () => {
			const raw = makeRawExerciseJson();
			delete raw["isPyramid"];
			delete raw["pyramidSets"];

			const result = mapper.mapExercise(raw);

			expect(result).not.toBeNull();
			expect(result!.isPyramid).toBeFalse();
			expect(result!.pyramidSets).toEqual([]);
		});

		it('should return null when the exercise node is missing required field "id"', () => {
			const raw = makeRawExerciseJson();
			delete raw["id"];

			const result = mapper.mapExercise(raw);

			expect(result).toBeNull();
		});
	});
});

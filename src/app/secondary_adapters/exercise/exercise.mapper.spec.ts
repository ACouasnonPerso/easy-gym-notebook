import { TestBed } from "@angular/core/testing";
import { ExerciseMapper } from "./exercise.mapper";
import { Exercise, RawExercise } from "../../core_logic/shared/models";

function makeRawExercise(overrides: Partial<RawExercise> = {}): RawExercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Course à pied",
		muscleGroup: null,
		weightKg: 0,
		sets: 0,
		reps: 0,
		breakDurationSeconds: 0,
		status: "pending",
		isCardio: true,
		durationSeconds: 1800,
		distanceKm: 5,
		...overrides,
	};
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Course à pied",
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 0,
		reps: 0,
		breakDurationSeconds: 0,
		status: "pending",
		isCardio: true,
		durationSeconds: 1800,
		distanceKm: 5,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		...overrides,
	} as Exercise;
}

describe("ExerciseMapper — pyramid fields", () => {
	let mapper: ExerciseMapper;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [ExerciseMapper] });
		mapper = TestBed.inject(ExerciseMapper);
	});

	describe("toDomain — pyramid", () => {
		it("should map pyramid mode as inactive and the set list as empty when converting a legacy storage record that has no pyramid fields", () => {
			const raw = makeRawExercise();
			delete (raw as any).isPyramid;
			delete (raw as any).pyramidSets;

			const result = mapper.toDomain(raw);

			expect(result.isPyramid).toBeFalse();
			expect(result.pyramidSets).toEqual([]);
		});

		it("should map pyramid mode as active and preserve all set rows when converting a full pyramid storage record", () => {
			const raw = makeRawExercise({
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
			});

			const result = mapper.toDomain(raw);

			expect(result.isPyramid).toBeTrue();
			expect(result.pyramidSets).toEqual([
				{ weightKg: 60, reps: 12 },
				{ weightKg: 80, reps: 8 },
			]);
		});
	});

	describe("toStorage — pyramid", () => {
		it("should write pyramid mode and all set rows to storage when saving a pyramid exercise", () => {
			const exercise = makeExercise({
				isPyramid: true,
				pyramidSets: [
					{ weightKg: 60, reps: 12 },
					{ weightKg: 80, reps: 8 },
				],
			});

			const result = mapper.toStorage(exercise);

			expect(result.isPyramid).toBeTrue();
			expect(result.pyramidSets).toEqual([
				{ weightKg: 60, reps: 12 },
				{ weightKg: 80, reps: 8 },
			]);
		});

		it("should write pyramid mode as inactive and the set list as empty to storage when saving a standard exercise", () => {
			const exercise = makeExercise({ isPyramid: false, pyramidSets: [] });

			const result = mapper.toStorage(exercise);

			expect(result.isPyramid).toBeFalse();
			expect(result.pyramidSets).toEqual([]);
		});
	});
});

describe("ExerciseMapper", () => {
	let mapper: ExerciseMapper;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [ExerciseMapper] });
		mapper = TestBed.inject(ExerciseMapper);
	});

	describe("toDomain", () => {
		it("should map durationSeconds and distanceKm from raw to domain", () => {
			const raw = makeRawExercise({ durationSeconds: 1800, distanceKm: 5 });

			const result = mapper.toDomain(raw);

			expect(result.durationSeconds).toBe(1800);
			expect(result.distanceKm).toBe(5);
		});

		it("should map isCardio from raw to domain", () => {
			const raw = makeRawExercise({ isCardio: true });

			const result = mapper.toDomain(raw);

			expect(result.isCardio).toBeTrue();
		});

		it("should map distanceKm as null when raw distanceKm is null", () => {
			const raw = makeRawExercise({ distanceKm: null });

			const result = mapper.toDomain(raw);

			expect(result.distanceKm).toBeNull();
		});

		it("should default isCardio to false when raw does not have the field", () => {
			const raw = makeRawExercise({ isCardio: false });

			const result = mapper.toDomain(raw);

			expect(result.isCardio).toBeFalse();
		});
	});

	describe("toStorage", () => {
		it("should map durationSeconds and distanceKm from domain to storage", () => {
			const exercise = makeExercise({ durationSeconds: 3600, distanceKm: 10 });

			const result = mapper.toStorage(exercise);

			expect(result.durationSeconds).toBe(3600);
			expect(result.distanceKm).toBe(10);
		});

		it("should map isCardio from domain to storage", () => {
			const exercise = makeExercise({ isCardio: true });

			const result = mapper.toStorage(exercise);

			expect(result.isCardio).toBeTrue();
		});

		it("should map distanceKm as null when domain distanceKm is null", () => {
			const exercise = makeExercise({ distanceKm: null });

			const result = mapper.toStorage(exercise);

			expect(result.distanceKm).toBeNull();
		});
	});
});

describe("ExerciseMapper -- rating field", () => {
	let mapper: ExerciseMapper;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [ExerciseMapper] });
		mapper = TestBed.inject(ExerciseMapper);
	});

	describe("toDomain -- rating", () => {
		it("should default rating to null when raw exercise has no rating field (backward compat)", () => {
			const raw = makeRawExercise();
			delete (raw as any).rating;

			const result = mapper.toDomain(raw);

			expect(result.rating).toBeNull();
		});

		it("should map rating value when present in raw exercise", () => {
			const raw = makeRawExercise({ rating: 16 } as any);

			const result = mapper.toDomain(raw);

			expect(result.rating).toBe(16);
		});
	});

	describe("toStorage -- rating", () => {
		it("should include rating when exercise has a rating value", () => {
			const exercise = makeExercise({ rating: 18 });

			const result = mapper.toStorage(exercise);

			expect(result.rating).toBe(18);
		});

		it("should include rating as null when exercise rating is null", () => {
			const exercise = makeExercise({ rating: null });

			const result = mapper.toStorage(exercise);

			expect(result.rating).toBeNull();
		});
	});
});


describe("ExerciseMapper -- comment field", () => {
	let mapper: ExerciseMapper;

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [ExerciseMapper] });
		mapper = TestBed.inject(ExerciseMapper);
	});

	describe("toDomain -- comment", () => {
		it("should default comment to null when raw exercise has no comment field (backward compat)", () => {
			const raw = makeRawExercise();
			delete (raw as any).comment;

			const result = mapper.toDomain(raw);

			expect(result.comment).toBeNull();
		});

		it("should map comment string when present in raw exercise", () => {
			const raw = makeRawExercise({ comment: "Great set today" } as any);

			const result = mapper.toDomain(raw);

			expect(result.comment).toBe("Great set today");
		});
	});

	describe("toStorage -- comment", () => {
		it("should include comment when exercise has a comment value", () => {
			const exercise = makeExercise({ comment: "Heavy day" } as any);

			const result = mapper.toStorage(exercise);

			expect((result as any).comment).toBe("Heavy day");
		});

		it("should include comment as null when exercise comment is null", () => {
			const exercise = makeExercise({ comment: null } as any);

			const result = mapper.toStorage(exercise);

			expect((result as any).comment).toBeNull();
		});
	});
});

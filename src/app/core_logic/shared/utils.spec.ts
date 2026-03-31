import { computeVolume, formatSummaryDuration } from "./utils";
import { Exercise } from "./models";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "ex-1",
		sessionId: "session-1",
		name: "Bench Press",
		muscleGroup: null,
		muscleGroups: [],
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
		...overrides,
	};
}

describe("formatSummaryDuration", () => {
	it("should return minutes format when the duration is less than one hour", () => {
		const result = formatSummaryDuration(45 * 60);

		expect(result).toBe("45min");
	});

	it("should return hours-only format when the duration is a whole number of hours", () => {
		const result = formatSummaryDuration(2 * 3600);

		expect(result).toBe("2h");
	});

	it("should return hours and minutes format when the duration has both hours and minutes under 24h", () => {
		const result = formatSummaryDuration(2 * 3600 + 30 * 60);

		expect(result).toBe("2h30");
	});

	it("should return days-hours-minutes format when the duration is exactly 24 hours", () => {
		const result = formatSummaryDuration(24 * 3600);

		expect(result).toBe("1d0h00");
	});

	it("should return days-hours-minutes format with minutes padded to 2 digits when the duration is 1 day 17 hours and 6 minutes", () => {
		const result = formatSummaryDuration(1 * 24 * 3600 + 17 * 3600 + 6 * 60);

		expect(result).toBe("1d17h06");
	});

	it("should return days-hours-minutes format for durations spanning more than 2 days", () => {
		const result = formatSummaryDuration(2 * 24 * 3600 + 3 * 3600 + 45 * 60);

		expect(result).toBe("2d3h45");
	});
});

describe("computeVolume", () => {
	it("should compute volume as weight multiplied by sets multiplied by reps when the exercise uses standard mode", () => {
		const exercise = makeExercise({ weightKg: 80, sets: 4, reps: 8, isPyramid: false, pyramidSets: [] });

		const result = computeVolume(exercise);

		expect(result).toBe(80 * 4 * 8);
	});

	it("should compute volume as the sum of each set's weight multiplied by its reps when the exercise uses pyramid mode", () => {
		const exercise = makeExercise({
			isPyramid: true,
			pyramidSets: [
				{ weightKg: 60, reps: 12 },
				{ weightKg: 80, reps: 8 },
				{ weightKg: 100, reps: 4 },
			],
		});

		const result = computeVolume(exercise);

		expect(result).toBe(60 * 12 + 80 * 8 + 100 * 4);
	});

	it("should compute volume as weight multiplied by sets multiplied by reps when the exercise uses pyramid mode but the pyramid set list is empty", () => {
		const exercise = makeExercise({ weightKg: 70, sets: 3, reps: 10, isPyramid: true, pyramidSets: [] });

		const result = computeVolume(exercise);

		expect(result).toBe(70 * 3 * 10);
	});

	it("should return zero when a standard exercise has zero weight", () => {
		const exercise = makeExercise({ weightKg: 0, sets: 3, reps: 10, isPyramid: false, pyramidSets: [] });

		const result = computeVolume(exercise);

		expect(result).toBe(0);
	});
});

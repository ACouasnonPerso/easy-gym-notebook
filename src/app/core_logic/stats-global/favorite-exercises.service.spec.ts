import { computeFavoriteBonuses } from "./favorite-exercises.service";
import { Session, Exercise } from "../shared/models";

function makeSession(id: string, daysAgo: number, today: Date = new Date()): Session {
	const date = new Date(today);
	date.setDate(date.getDate() - daysAgo);
	return {
		id,
		date,
		status: "completed",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
	};
}

function makeExercise(name: string, sessionId: string): Exercise {
	return {
		id: `${name}-${sessionId}`,
		sessionId,
		name,
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 1,
		reps: 1,
		breakDurationSeconds: 60,
		status: "validated",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
	};
}

describe("computeFavoriteBonuses", () => {
	const today = new Date(2024, 0, 31); // fixed date for determinism

	it("should return zero bonus for all exercises when there are no sessions", () => {
		const bonuses = computeFavoriteBonuses([], [], today);
		expect(bonuses.size).toBe(0);
	});

	it("should return zero bonus for an exercise not present in any session within the last 90 days", () => {
		const session = makeSession("s1", 91, today); // 91 days ago — outside window
		const exercise = makeExercise("Squat", "s1");
		const bonuses = computeFavoriteBonuses([session], [exercise], today);
		expect(bonuses.get("Squat")).toBeUndefined();
	});

	it("should return 30% bonus for the most frequent exercise in the last 90 days", () => {
		const s1 = makeSession("s1", 10, today);
		const s2 = makeSession("s2", 20, today);
		const s3 = makeSession("s3", 30, today);
		const exercises = [
			makeExercise("Squat", "s1"),
			makeExercise("Squat", "s2"),
			makeExercise("Squat", "s3"),
			makeExercise("Bench", "s1"),
		];
		const bonuses = computeFavoriteBonuses([s1, s2, s3], exercises, today);
		expect(bonuses.get("Squat")).toBe(0.3);
	});

	it("should return 15% bonus for the second and third most frequent exercises", () => {
		const s1 = makeSession("s1", 5, today);
		const s2 = makeSession("s2", 10, today);
		const s3 = makeSession("s3", 15, today);
		const exercises = [
			makeExercise("Squat", "s1"),
			makeExercise("Squat", "s2"),
			makeExercise("Squat", "s3"),
			makeExercise("Bench", "s1"),
			makeExercise("Bench", "s2"),
			makeExercise("Deadlift", "s1"),
			makeExercise("Deadlift", "s2"),
		];
		const bonuses = computeFavoriteBonuses([s1, s2, s3], exercises, today);
		expect(bonuses.get("Bench")).toBe(0.15);
		expect(bonuses.get("Deadlift")).toBe(0.15);
	});

	it("should return 5% bonus for exercises ranked 4 through 10", () => {
		const sessions = Array.from({ length: 12 }, (_, i) => makeSession(`s${i}`, i + 1, today));
		// rank 1: 12 occurrences
		// rank 2: 11, rank 3: 10, rank 4: 9, ..., rank 12: 1
		const exercises = sessions.flatMap((s, i) => {
			const rank = i + 1;
			const names = Array.from({ length: 12 - i }, (_, j) => `Exercise${j + 1}`);
			return names.map((name) => makeExercise(name, s.id));
		});
		const bonuses = computeFavoriteBonuses(sessions, exercises, today);
		// Exercise1 appears 12 times → rank 1 → 30%
		expect(bonuses.get("Exercise1")).toBe(0.3);
		// Exercise4 appears 9 times → rank 4 → 5%
		expect(bonuses.get("Exercise4")).toBe(0.05);
		// Exercise10 appears 3 times → rank 10 → 5%
		expect(bonuses.get("Exercise10")).toBe(0.05);
	});

	it("should return 0% bonus for exercises beyond rank 10", () => {
		const sessions = Array.from({ length: 12 }, (_, i) => makeSession(`s${i}`, i + 1, today));
		const exercises = sessions.flatMap((s, i) => {
			const rank = i + 1;
			const names = Array.from({ length: 12 - i }, (_, j) => `Exercise${j + 1}`);
			return names.map((name) => makeExercise(name, s.id));
		});
		const bonuses = computeFavoriteBonuses(sessions, exercises, today);
		// Exercise11 appears 2 times → rank 11 → 0%
		expect(bonuses.get("Exercise11")).toBeUndefined();
		// Exercise12 appears 1 time → rank 12 → 0%
		expect(bonuses.get("Exercise12")).toBeUndefined();
	});

	it("should exclude sessions older than 90 days from the frequency count", () => {
		const recentSession = makeSession("s1", 89, today);
		const oldSession = makeSession("s2", 91, today);
		const exercises = [
			makeExercise("Squat", "s1"),
			makeExercise("Bench", "s2"), // old session — excluded
			makeExercise("Bench", "s2"),
			makeExercise("Bench", "s2"),
		];
		const bonuses = computeFavoriteBonuses([recentSession, oldSession], exercises, today);
		// Squat appears 1 time in recent sessions → rank 1 → 30%
		expect(bonuses.get("Squat")).toBe(0.3);
		// Bench only in old sessions → not counted
		expect(bonuses.get("Bench")).toBeUndefined();
	});

	it("should resolve ties deterministically by exercise name alphabetical order", () => {
		const s1 = makeSession("s1", 5, today);
		const s2 = makeSession("s2", 10, today);
		// "Alpha" and "Zebra" both appear twice → tie → alphabetical: Alpha rank 1, Zebra rank 2
		const exercises = [
			makeExercise("Alpha", "s1"),
			makeExercise("Alpha", "s2"),
			makeExercise("Zebra", "s1"),
			makeExercise("Zebra", "s2"),
		];
		const bonuses = computeFavoriteBonuses([s1, s2], exercises, today);
		expect(bonuses.get("Alpha")).toBe(0.3); // rank 1
		expect(bonuses.get("Zebra")).toBe(0.15); // rank 2
	});

	it("should handle fewer than 10 distinct exercises without throwing", () => {
		const s1 = makeSession("s1", 5, today);
		const exercises = [
			makeExercise("ExA", "s1"),
			makeExercise("ExB", "s1"),
		];
		expect(() => computeFavoriteBonuses([s1], exercises, today)).not.toThrow();
		const bonuses = computeFavoriteBonuses([s1], exercises, today);
		expect(bonuses.size).toBe(2);
	});
});

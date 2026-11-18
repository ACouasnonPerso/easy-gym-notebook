import { Exercise, MuscleGroup, Session } from "../shared/models";
import { buildWatchSnapshot, findWatchActiveSession, WatchSnapshotContext } from "./watch-snapshot.builder";

const NOW = new Date("2026-11-18T18:00:00Z");

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "s1",
		date: new Date("2026-11-18T17:00:00Z"),
		status: "active",
		durationSeconds: 0,
		muscleGroup: null,
		exercises: [],
		...overrides,
	};
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
	return {
		id: "e1",
		sessionId: "s1",
		name: "Développé couché",
		muscleGroup: MuscleGroup.Chest,
		muscleGroups: [MuscleGroup.Chest],
		weightKg: 60,
		sets: 4,
		reps: 10,
		breakDurationSeconds: 120,
		status: "pending",
		isCardio: false,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
		...overrides,
	};
}

function makeContext(overrides: Partial<WatchSnapshotContext> = {}): WatchSnapshotContext {
	return {
		translate: (key) => `t(${key})`,
		labels: { sessionTitle: "Séance", bodyweight: "PDC" },
		massUnit: "metric",
		appliedActionIds: [],
		...overrides,
	};
}

describe("findWatchActiveSession", () => {
	it("returns null when there is no session", () => {
		expect(findWatchActiveSession([], NOW)).toBeNull();
	});

	it("ignores completed sessions", () => {
		const completed = makeSession({ status: "completed" });
		expect(findWatchActiveSession([completed], NOW)).toBeNull();
	});

	it("ignores active sessions older than 12 hours", () => {
		const abandoned = makeSession({ date: new Date("2026-11-17T05:00:00Z") });
		expect(findWatchActiveSession([abandoned], NOW)).toBeNull();
	});

	it("returns the most recent active session", () => {
		const older = makeSession({ id: "old", date: new Date("2026-11-18T10:00:00Z") });
		const newer = makeSession({ id: "new", date: new Date("2026-11-18T17:30:00Z") });
		expect(findWatchActiveSession([older, newer], NOW)?.id).toBe("new");
	});
});

describe("buildWatchSnapshot", () => {
	it("sends a null session when no session is active", () => {
		const snapshot = buildWatchSnapshot(null, [], makeContext());
		expect(snapshot.session).toBeNull();
		expect(snapshot.ratingOptions.length).toBe(12);
	});

	it("titles the session with its muscle group", () => {
		const snapshot = buildWatchSnapshot(makeSession({ muscleGroup: MuscleGroup.Back }), [], makeContext());
		expect(snapshot.session?.title).toBe("t(muscleGroups.Back)");
	});

	it("falls back to the first exercise muscle group, then to the default title", () => {
		const withExercise = buildWatchSnapshot(makeSession(), [makeExercise()], makeContext());
		expect(withExercise.session?.title).toBe("t(muscleGroups.Chest)");

		const empty = buildWatchSnapshot(makeSession(), [], makeContext());
		expect(empty.session?.title).toBe("Séance");
	});

	it("maps a strength exercise", () => {
		const snapshot = buildWatchSnapshot(makeSession(), [makeExercise({ rating: 16 })], makeContext());
		expect(snapshot.session?.exercises[0]).toEqual({
			id: "e1",
			name: "Développé couché",
			muscleLabel: "t(muscleGroups.Chest)",
			muscleColor: "#e74c3c",
			sets: 4,
			reps: 10,
			loadLabel: "60 kg",
			isCardio: false,
			breakDurationSeconds: 120,
			status: "pending",
			rating: 16,
		});
	});

	it("excludes cancelled exercises and exercises of other sessions", () => {
		const exercises = [
			makeExercise({ id: "keep" }),
			makeExercise({ id: "cancelled", status: "cancelled" }),
			makeExercise({ id: "other", sessionId: "s2" }),
		];
		const snapshot = buildWatchSnapshot(makeSession(), exercises, makeContext());
		expect(snapshot.session?.exercises.map((e) => e.id)).toEqual(["keep"]);
	});

	it("uses the bodyweight label when there is no load", () => {
		const snapshot = buildWatchSnapshot(makeSession(), [makeExercise({ weightKg: 0 })], makeContext());
		expect(snapshot.session?.exercises[0].loadLabel).toBe("PDC");
	});

	it("converts the load to pounds for imperial users", () => {
		const snapshot = buildWatchSnapshot(makeSession(), [makeExercise()], makeContext({ massUnit: "us" }));
		expect(snapshot.session?.exercises[0].loadLabel).toBe("132 lb");
	});

	it("uses 90 seconds of rest when the exercise has none", () => {
		const snapshot = buildWatchSnapshot(makeSession(), [makeExercise({ breakDurationSeconds: 0 })], makeContext());
		expect(snapshot.session?.exercises[0].breakDurationSeconds).toBe(90);
	});

	it("derives sets, reps and max load from pyramid sets", () => {
		const pyramid = makeExercise({
			isPyramid: true,
			pyramidSets: [
				{ weightKg: 40, reps: 12 },
				{ weightKg: 50, reps: 10 },
				{ weightKg: 60, reps: 8 },
			],
		});
		const watchExercise = buildWatchSnapshot(makeSession(), [pyramid], makeContext()).session?.exercises[0];
		expect(watchExercise?.sets).toBe(3);
		expect(watchExercise?.reps).toBe(12);
		expect(watchExercise?.loadLabel).toBe("60 kg");
	});

	it("describes cardio with its duration and distance", () => {
		const cardio = makeExercise({
			isCardio: true,
			muscleGroups: [],
			muscleGroup: null,
			durationSeconds: 1800,
			distanceKm: 5,
		});
		const watchExercise = buildWatchSnapshot(makeSession(), [cardio], makeContext()).session?.exercises[0];
		expect(watchExercise?.muscleLabel).toBe("t(common.cardio)");
		expect(watchExercise?.loadLabel).toBe("30 t(common.unitMin) · 5 km");
	});

	it("exposes rating options with translated labels and range display", () => {
		const snapshot = buildWatchSnapshot(null, [], makeContext());
		expect(snapshot.ratingOptions[0]).toEqual({ value: 20, display: "20", label: "t(rating.20)" });
		expect(snapshot.ratingOptions[9]).toEqual({ value: 11, display: "10-11", label: "t(rating.10_11)" });
	});

	it("forwards the acknowledged action ids", () => {
		const snapshot = buildWatchSnapshot(null, [], makeContext({ appliedActionIds: ["a1", "a2"] }));
		expect(snapshot.appliedActionIds).toEqual(["a1", "a2"]);
	});
});

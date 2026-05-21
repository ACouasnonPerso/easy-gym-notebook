import { weightPrDetector } from "./weight-pr.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Session, Exercise } from "../../shared/models";

const TODAY = new Date(2024, 0, 31); // Jan 31 2024

function makeSession(id: string, date: Date): Session {
	return { id, date, status: "completed", durationSeconds: 0, muscleGroup: null, exercises: [] };
}

function makeExercise(overrides: Partial<Exercise> & { sessionId: string; name: string }): Exercise {
	return {
		id: overrides.name + "-" + overrides.sessionId,
		muscleGroup: null,
		muscleGroups: [],
		weightKg: 0,
		sets: 3,
		reps: 8,
		breakDurationSeconds: 60,
		status: "validated",
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

function makeCtx(sessions: Session[], exercises: Exercise[]): DetectorContext {
	return { sessions, exercises, today: TODAY, favoriteBonus: () => 0 };
}

describe("weightPrDetector", () => {
	it("should return [] when there are no sessions", () => {
		expect(weightPrDetector(makeCtx([], []))).toEqual([]);
	});

	it("should return [] when there are no sessions on today's date", () => {
		const yesterday = new Date(2024, 0, 30);
		const session = makeSession("s1", yesterday);
		const ex = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		expect(weightPrDetector(makeCtx([session], [ex]))).toEqual([]);
	});

	it("should return [] when today's max does not beat the previous max by 2.5 kg", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 102 }); // gain 2 kg < 2.5
		expect(weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]))).toEqual([]);
	});

	it("should return [] when today's max equals the previous max (not a PR)", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 100 });
		expect(weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]))).toEqual([]);
	});

	it("should detect a weight PR when today's max exceeds previous max by exactly 2.5 kg", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 102.5 });
		const result = weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]));
		expect(result.length).toBe(1);
		expect(result[0].id).toBe("weight-pr");
		expect(result[0].category).toBe("perf");
		expect(result[0].exerciseName).toBe("Squat");
		expect(result[0].payload["gainKg"]).toBe(2.5);
	});

	it("should return all qualifying PRs sorted by gainKg descending when multiple PRs occur on the same day", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const prevSquat = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const prevBench = makeExercise({ sessionId: "s1", name: "Bench", weightKg: 80 });
		const todaySquat = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 105 }); // gain 5 kg
		const todayBench = makeExercise({ sessionId: "s2", name: "Bench", weightKg: 83 }); // gain 3 kg
		const result = weightPrDetector(makeCtx([s1, s2], [prevSquat, prevBench, todaySquat, todayBench]));
		expect(result.length).toBe(2);
		expect(result[0].exerciseName).toBe("Squat");
		expect(result[0].impactScore).toBe(5);
		expect(result[1].exerciseName).toBe("Bench");
		expect(result[1].impactScore).toBe(3);
	});

	it("should exclude cardio exercises from the PR detection", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const prevCardio = makeExercise({ sessionId: "s1", name: "Running", weightKg: 0, isCardio: true });
		const todayCardio = makeExercise({ sessionId: "s2", name: "Running", weightKg: 5, isCardio: true });
		expect(weightPrDetector(makeCtx([s1, s2], [prevCardio, todayCardio]))).toEqual([]);
	});

	it("should detect PR using pyramid set max weight", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const prevEx = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const todayEx = makeExercise({
			sessionId: "s2",
			name: "Squat",
			weightKg: 0,
			isPyramid: true,
			pyramidSets: [{ weightKg: 100, reps: 5 }, { weightKg: 105, reps: 3 }],
		});
		const result = weightPrDetector(makeCtx([s1, s2], [prevEx, todayEx]));
		expect(result.length).toBe(1);
		expect(result[0].payload["weightKg"]).toBe(105);
	});

	it("should return [] when there is no historical data for the exercise", () => {
		const s2 = makeSession("s2", TODAY);
		const todayEx = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 100 });
		expect(weightPrDetector(makeCtx([s2], [todayEx]))).toEqual([]);
	});

	it("should return all qualifying PRs up to 3, sorted by gainKg descending", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exercises = [
			makeExercise({ sessionId: "s1", name: "ExA", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExB", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExC", weightKg: 100 }),
			makeExercise({ sessionId: "s2", name: "ExA", weightKg: 110 }), // +10
			makeExercise({ sessionId: "s2", name: "ExB", weightKg: 105 }), // +5
			makeExercise({ sessionId: "s2", name: "ExC", weightKg: 103 }), // +3
		];
		const result = weightPrDetector(makeCtx([s1, s2], exercises));
		expect(result.length).toBe(3);
		expect(result[0].exerciseName).toBe("ExA");
		expect(result[0].payload["gainKg"]).toBe(10);
		expect(result[1].exerciseName).toBe("ExB");
		expect(result[1].payload["gainKg"]).toBe(5);
		expect(result[2].exerciseName).toBe("ExC");
		expect(result[2].payload["gainKg"]).toBe(3);
	});

	it("should return only top 3 when more than 3 exercises beat the threshold", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exercises = [
			makeExercise({ sessionId: "s1", name: "ExA", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExB", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExC", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExD", weightKg: 100 }),
			makeExercise({ sessionId: "s2", name: "ExA", weightKg: 110 }), // +10
			makeExercise({ sessionId: "s2", name: "ExB", weightKg: 108 }), // +8
			makeExercise({ sessionId: "s2", name: "ExC", weightKg: 105 }), // +5
			makeExercise({ sessionId: "s2", name: "ExD", weightKg: 103 }), // +3
		];
		const result = weightPrDetector(makeCtx([s1, s2], exercises));
		expect(result.length).toBe(3);
		expect(result[0].exerciseName).toBe("ExA");
		expect(result[1].exerciseName).toBe("ExB");
		expect(result[2].exerciseName).toBe("ExC");
	});

	it("should assign each metric its own previousPrDate against its own historical max", () => {
		const dateA = new Date(2024, 0, 5);  // Jan 5
		const dateB = new Date(2024, 0, 15); // Jan 15
		const sA = makeSession("sA", dateA);
		const sB = makeSession("sB", dateB);
		const sToday = makeSession("sToday", TODAY);
		const exercises = [
			makeExercise({ sessionId: "sA", name: "ExA", weightKg: 100 }),
			makeExercise({ sessionId: "sB", name: "ExB", weightKg: 80 }),
			makeExercise({ sessionId: "sToday", name: "ExA", weightKg: 110 }), // +10 for ExA
			makeExercise({ sessionId: "sToday", name: "ExB", weightKg: 90 }),  // +10 for ExB
		];
		const result = weightPrDetector(makeCtx([sA, sB, sToday], exercises));
		expect(result.length).toBe(2);
		const metricA = result.find((r) => r.exerciseName === "ExA")!;
		const metricB = result.find((r) => r.exerciseName === "ExB")!;
		expect(new Date(metricA.payload["previousPrDate"] as string).getDate()).toBe(5);
		expect(new Date(metricB.payload["previousPrDate"] as string).getDate()).toBe(15);
	});

	it("should include only exercises that meet the 2.5 kg threshold", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exercises = [
			makeExercise({ sessionId: "s1", name: "ExA", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExB", weightKg: 100 }),
			makeExercise({ sessionId: "s1", name: "ExC", weightKg: 100 }),
			makeExercise({ sessionId: "s2", name: "ExA", weightKg: 105 }), // +5 (qualifies)
			makeExercise({ sessionId: "s2", name: "ExB", weightKg: 103 }), // +3 (qualifies)
			makeExercise({ sessionId: "s2", name: "ExC", weightKg: 102 }), // +2 (does NOT qualify)
		];
		const result = weightPrDetector(makeCtx([s1, s2], exercises));
		expect(result.length).toBe(2);
		expect(result.some((r) => r.exerciseName === "ExA")).toBe(true);
		expect(result.some((r) => r.exerciseName === "ExB")).toBe(true);
		expect(result.some((r) => r.exerciseName === "ExC")).toBe(false);
	});
});

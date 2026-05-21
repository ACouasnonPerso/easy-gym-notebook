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
	it("should return null when there are no sessions", () => {
		expect(weightPrDetector(makeCtx([], []))).toBeNull();
	});

	it("should return null when there are no sessions on today's date", () => {
		const yesterday = new Date(2024, 0, 30);
		const session = makeSession("s1", yesterday);
		const ex = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		expect(weightPrDetector(makeCtx([session], [ex]))).toBeNull();
	});

	it("should return null when today's max does not beat the previous max by 2.5 kg", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 102 }); // gain 2 kg < 2.5
		expect(weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]))).toBeNull();
	});

	it("should return null when today's max equals the previous max (not a PR)", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 100 });
		expect(weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]))).toBeNull();
	});

	it("should detect a weight PR when today's max exceeds previous max by exactly 2.5 kg", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const exPrev = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const exToday = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 102.5 });
		const result = weightPrDetector(makeCtx([s1, s2], [exPrev, exToday]));
		expect(result).not.toBeNull();
		expect(result!.id).toBe("weight-pr");
		expect(result!.category).toBe("perf");
		expect(result!.exerciseName).toBe("Squat");
		expect(result!.payload["gainKg"]).toBe(2.5);
	});

	it("should return the exercise with the highest gain when multiple PRs occur on the same day", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const prevSquat = makeExercise({ sessionId: "s1", name: "Squat", weightKg: 100 });
		const prevBench = makeExercise({ sessionId: "s1", name: "Bench", weightKg: 80 });
		const todaySquat = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 105 }); // gain 5 kg
		const todayBench = makeExercise({ sessionId: "s2", name: "Bench", weightKg: 83 }); // gain 3 kg
		const result = weightPrDetector(makeCtx([s1, s2], [prevSquat, prevBench, todaySquat, todayBench]));
		expect(result!.exerciseName).toBe("Squat");
		expect(result!.impactScore).toBe(5);
	});

	it("should exclude cardio exercises from the PR detection", () => {
		const prev = new Date(2024, 0, 10);
		const s1 = makeSession("s1", prev);
		const s2 = makeSession("s2", TODAY);
		const prevCardio = makeExercise({ sessionId: "s1", name: "Running", weightKg: 0, isCardio: true });
		const todayCardio = makeExercise({ sessionId: "s2", name: "Running", weightKg: 5, isCardio: true });
		expect(weightPrDetector(makeCtx([s1, s2], [prevCardio, todayCardio]))).toBeNull();
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
		expect(result).not.toBeNull();
		expect(result!.payload["weightKg"]).toBe(105);
	});

	it("should return null when there is no historical data for the exercise", () => {
		const s2 = makeSession("s2", TODAY);
		const todayEx = makeExercise({ sessionId: "s2", name: "Squat", weightKg: 100 });
		// No previous sessions — no PR can be established
		expect(weightPrDetector(makeCtx([s2], [todayEx]))).toBeNull();
	});
});

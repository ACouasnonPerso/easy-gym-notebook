import { mostImprovedDetector } from "./most-improved.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Session, Exercise } from "../../shared/models";

// Today: Jan 31 2024 (current month = Jan); prev month = Dec 2023
const TODAY = new Date(2024, 0, 31);

function makeSession(id: string, date: Date): Session {
	return { id, date, status: "completed", durationSeconds: 0, muscleGroup: null, exercises: [] };
}

function makeExercise(sessionId: string, name: string, weightKg: number, isCardio = false): Exercise {
	return {
		id: name + "-" + sessionId,
		sessionId,
		name,
		muscleGroup: null,
		muscleGroups: [],
		weightKg,
		sets: 1,
		reps: 1,
		breakDurationSeconds: 60,
		status: "validated",
		isCardio,
		durationSeconds: 0,
		distanceKm: null,
		isPyramid: false,
		pyramidSets: [],
		rating: null,
		comment: null,
	};
}

function makeCtx(sessions: Session[], exercises: Exercise[]): DetectorContext {
	return { sessions, exercises, today: TODAY, favoriteBonus: () => 0 };
}

describe("mostImprovedDetector", () => {
	it("should return null when there are no sessions", () => {
		expect(mostImprovedDetector(makeCtx([], []))).toBeNull();
	});

	it("should return null when there is no data for the previous month to compare against", () => {
		const s = makeSession("s1", new Date(2024, 0, 15));
		const ex = makeExercise("s1", "Squat", 100);
		expect(mostImprovedDetector(makeCtx([s], [ex]))).toBeNull();
	});

	it("should return null when weight improvement is less than 2.5 kg vs previous month", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevEx = makeExercise("s1", "Squat", 100);
		const currEx = makeExercise("s2", "Squat", 102); // +2 kg < 2.5
		expect(mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]))).toBeNull();
	});

	it("should detect the most improved exercise when weight gain vs previous month is at least 2.5 kg", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevEx = makeExercise("s1", "Squat", 100);
		const currEx = makeExercise("s2", "Squat", 105); // +5 kg
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]));
		expect(result).not.toBeNull();
		expect(result!.id).toBe("most-improved");
		expect(result!.category).toBe("perf");
		expect(result!.exerciseName).toBe("Squat");
		expect(result!.payload["gainKg"]).toBe(5);
	});

	it("should return the exercise with the highest gain when multiple exercises improve", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevSquat = makeExercise("s1", "Squat", 100);
		const currSquat = makeExercise("s2", "Squat", 105); // +5
		const prevBench = makeExercise("s1", "Bench", 80);
		const currBench = makeExercise("s2", "Bench", 90); // +10
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevSquat, currSquat, prevBench, currBench]));
		expect(result!.exerciseName).toBe("Bench");
		expect(result!.impactScore).toBe(10);
	});

	it("should exclude cardio exercises from improvement detection", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevCardio = makeExercise("s1", "Running", 0, true);
		const currCardio = makeExercise("s2", "Running", 5, true);
		expect(mostImprovedDetector(makeCtx([prevS, currS], [prevCardio, currCardio]))).toBeNull();
	});

	it("should use max weight from pyramid sets when detecting improvement", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevEx = makeExercise("s1", "Squat", 100);
		const currEx: Exercise = {
			...makeExercise("s2", "Squat", 0),
			isPyramid: true,
			pyramidSets: [{ weightKg: 100, reps: 5 }, { weightKg: 108, reps: 3 }],
		};
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]));
		expect(result).not.toBeNull();
		expect(result!.payload["currentMaxKg"]).toBe(108);
		expect(result!.payload["gainKg"]).toBe(8);
	});
});

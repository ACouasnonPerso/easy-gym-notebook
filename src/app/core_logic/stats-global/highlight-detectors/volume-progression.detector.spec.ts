import { volumeProgressionDetector } from "./volume-progression.detector";
import { DetectorContext } from "../highlight-metric.model";
import { Session, Exercise } from "../../shared/models";

// Monday Jan 29, 2024 — current week starts here
const TODAY = new Date(2024, 0, 31); // Wednesday Jan 31 2024

function makeSession(id: string, date: Date): Session {
	return { id, date, status: "completed", durationSeconds: 0, muscleGroup: null, exercises: [] };
}

function makeExercise(sessionId: string, name: string, weightKg: number, sets: number, reps: number, isCardio = false): Exercise {
	return {
		id: name + "-" + sessionId,
		sessionId,
		name,
		muscleGroup: null,
		muscleGroups: [],
		weightKg,
		sets,
		reps,
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

// Helper to create a date N weeks back from today's Monday
function weeksAgo(n: number): Date {
	const d = new Date(2024, 0, 29); // Monday Jan 29 2024 (current week)
	d.setDate(d.getDate() - n * 7);
	return d;
}

describe("volumeProgressionDetector", () => {
	it("should return null when there are no sessions", () => {
		expect(volumeProgressionDetector(makeCtx([], []))).toBeNull();
	});

	it("should return null when there is no data for previous weeks to compare against", () => {
		const s = makeSession("s1", TODAY);
		const ex = makeExercise("s1", "Squat", 80, 4, 8);
		expect(volumeProgressionDetector(makeCtx([s], [ex]))).toBeNull();
	});

	it("should return null when the current week volume increase is 10% or less", () => {
		const sPrev = makeSession("s-prev", weeksAgo(1));
		const sCurr = makeSession("s-curr", TODAY);
		// prev volume: 80 * 4 * 8 = 2560 kg; current: 2816 = +10% → not triggered
		const prevEx = makeExercise("s-prev", "Squat", 80, 4, 8); // 2560
		const currEx = makeExercise("s-curr", "Squat", 88, 4, 8); // 2816 — +10%
		expect(volumeProgressionDetector(makeCtx([sPrev, sCurr], [prevEx, currEx]))).toBeNull();
	});

	it("should detect volume progression when current week volume exceeds the 4-week average by more than 10%", () => {
		// prev week avg: 2000 kg, current week: 2600 kg → +30%
		const sPrev = makeSession("s-prev", weeksAgo(1));
		const sCurr = makeSession("s-curr", TODAY);
		const prevEx = makeExercise("s-prev", "Squat", 100, 4, 5); // 2000
		const currEx = makeExercise("s-curr", "Squat", 130, 4, 5); // 2600 → +30%
		const result = volumeProgressionDetector(makeCtx([sPrev, sCurr], [prevEx, currEx]));
		expect(result).not.toBeNull();
		expect(result!.id).toBe("volume-progression");
		expect(result!.category).toBe("perf");
		expect(result!.exerciseName).toBe("Squat");
	});

	it("should return the exercise with the highest percentage gain when multiple exercises progress", () => {
		const sPrev = makeSession("s-prev", weeksAgo(1));
		const sCurr = makeSession("s-curr", TODAY);
		// Squat: prev 2000 → current 2600 (+30%)
		// Bench: prev 1000 → current 1500 (+50%)
		const prevSquat = makeExercise("s-prev", "Squat", 100, 4, 5); // 2000
		const currSquat = makeExercise("s-curr", "Squat", 130, 4, 5); // 2600
		const prevBench = makeExercise("s-prev", "Bench", 50, 4, 5); // 1000
		const currBench = makeExercise("s-curr", "Bench", 75, 4, 5); // 1500
		const result = volumeProgressionDetector(makeCtx([sPrev, sCurr], [prevSquat, currSquat, prevBench, currBench]));
		expect(result!.exerciseName).toBe("Bench");
	});

	it("should exclude cardio exercises with zero volume from progression detection", () => {
		const sPrev = makeSession("s-prev", weeksAgo(1));
		const sCurr = makeSession("s-curr", TODAY);
		const prevCardio = makeExercise("s-prev", "Running", 0, 1, 1, true);
		const currCardio = makeExercise("s-curr", "Running", 0, 1, 1, true);
		expect(volumeProgressionDetector(makeCtx([sPrev, sCurr], [prevCardio, currCardio]))).toBeNull();
	});

	it("should use average of up to 4 previous weeks for comparison", () => {
		// 4 previous weeks each with 2000 kg → avg 2000; current 2600 → +30%
		const sessions = [
			makeSession("s1", weeksAgo(1)),
			makeSession("s2", weeksAgo(2)),
			makeSession("s3", weeksAgo(3)),
			makeSession("s4", weeksAgo(4)),
			makeSession("s5", TODAY),
		];
		const exercises = [
			makeExercise("s1", "Squat", 100, 4, 5), // 2000
			makeExercise("s2", "Squat", 100, 4, 5), // 2000
			makeExercise("s3", "Squat", 100, 4, 5), // 2000
			makeExercise("s4", "Squat", 100, 4, 5), // 2000
			makeExercise("s5", "Squat", 130, 4, 5), // 2600
		];
		const result = volumeProgressionDetector(makeCtx(sessions, exercises));
		expect(result).not.toBeNull();
		expect(result!.payload["pctGain"]).toBe(30);
	});
});

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
	it("should return [] when there are no sessions", () => {
		expect(mostImprovedDetector(makeCtx([], []), 0)).toEqual([]);
	});

	it("should return [] when there is no data for the previous month to compare against", () => {
		const s = makeSession("s1", new Date(2024, 0, 15));
		const ex = makeExercise("s1", "Squat", 100);
		expect(mostImprovedDetector(makeCtx([s], [ex]), 0)).toEqual([]);
	});

	it("should return [] when weight improvement is less than 2.5 kg vs previous month", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevEx = makeExercise("s1", "Squat", 100);
		const currEx = makeExercise("s2", "Squat", 102); // +2 kg < 2.5
		expect(mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]), 0)).toEqual([]);
	});

	it("should detect the most improved exercise when weight gain vs previous month is at least 2.5 kg", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevEx = makeExercise("s1", "Squat", 100);
		const currEx = makeExercise("s2", "Squat", 105); // +5 kg
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]), 0);
		expect(result.length).toBe(1);
		expect(result[0].id).toBe("most-improved");
		expect(result[0].category).toBe("perf");
		expect(result[0].exerciseName).toBe("Squat");
		expect(result[0].payload["gainKg"]).toBe(5);
	});

	it("should exclude cardio exercises from improvement detection", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevCardio = makeExercise("s1", "Running", 0, true);
		const currCardio = makeExercise("s2", "Running", 5, true);
		expect(mostImprovedDetector(makeCtx([prevS, currS], [prevCardio, currCardio]), 0)).toEqual([]);
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
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevEx, currEx]), 0);
		expect(result[0].payload["currentMaxKg"]).toBe(108);
		expect(result[0].payload["gainKg"]).toBe(8);
	});

	it("should preserve full payload shape for the returned metric", () => {
		const prevS = makeSession("s1", new Date(2023, 11, 15));
		const currS = makeSession("s2", new Date(2024, 0, 15));
		const prevBench = makeExercise("s1", "Bench", 80);
		const currBench = makeExercise("s2", "Bench", 90); // +10
		const result = mostImprovedDetector(makeCtx([prevS, currS], [prevBench, currBench]), 0);
		expect(result[0].payload["exerciseName"]).toBeDefined();
		expect(result[0].payload["currentMaxKg"]).toBeDefined();
		expect(result[0].payload["gainKg"]).toBeDefined();
		expect(result[0].payload["prevYear"]).toBeDefined();
		expect(result[0].payload["prevMonth"]).toBeDefined();
	});

	describe("random pick from top-4", () => {
		// Pool sorted by gainKg desc: Bench(+10), Deadlift(+7.5), Squat(+5), OHP(+3)
		function makeTop4Ctx() {
			const prevS = makeSession("s1", new Date(2023, 11, 15));
			const currS = makeSession("s2", new Date(2024, 0, 15));
			return {
				sessions: [prevS, currS],
				exercises: [
					makeExercise("s1", "Bench", 80),    makeExercise("s2", "Bench", 90),    // +10 → index 0
					makeExercise("s1", "Deadlift", 120), makeExercise("s2", "Deadlift", 127.5), // +7.5 → index 1
					makeExercise("s1", "Squat", 100),   makeExercise("s2", "Squat", 105),   // +5 → index 2
					makeExercise("s1", "OHP", 60),      makeExercise("s2", "OHP", 63),      // +3 → index 3
					// 5th exercise qualifies but is outside top-4
					makeExercise("s1", "Row", 50),      makeExercise("s2", "Row", 52.5),    // +2.5 → index 4 (excluded)
				],
			};
		}

		it("seed=0 picks the best candidate (index 0)", () => {
			const { sessions, exercises } = makeTop4Ctx();
			const result = mostImprovedDetector(makeCtx(sessions, exercises), 0);
			expect(result.length).toBe(1);
			expect(result[0].exerciseName).toBe("Bench");
		});

		it("seed=0.25 picks index 1", () => {
			const { sessions, exercises } = makeTop4Ctx();
			// Math.floor(0.25 * 4) = 1
			const result = mostImprovedDetector(makeCtx(sessions, exercises), 0.25);
			expect(result[0].exerciseName).toBe("Deadlift");
		});

		it("seed=0.5 picks index 2", () => {
			const { sessions, exercises } = makeTop4Ctx();
			// Math.floor(0.5 * 4) = 2
			const result = mostImprovedDetector(makeCtx(sessions, exercises), 0.5);
			expect(result[0].exerciseName).toBe("Squat");
		});

		it("seed=0.75 picks index 3", () => {
			const { sessions, exercises } = makeTop4Ctx();
			// Math.floor(0.75 * 4) = 3
			const result = mostImprovedDetector(makeCtx(sessions, exercises), 0.75);
			expect(result[0].exerciseName).toBe("OHP");
		});

		it("5th-ranked exercise is never picked regardless of seed", () => {
			const { sessions, exercises } = makeTop4Ctx();
			for (const seed of [0, 0.25, 0.5, 0.75, 0.99]) {
				const result = mostImprovedDetector(makeCtx(sessions, exercises), seed);
				expect(result[0].exerciseName).not.toBe("Row");
			}
		});

		it("returns the only candidate regardless of seed when pool has 1 entry", () => {
			const prevS = makeSession("s1", new Date(2023, 11, 15));
			const currS = makeSession("s2", new Date(2024, 0, 15));
			const ctx = makeCtx([prevS, currS], [
				makeExercise("s1", "Squat", 100), makeExercise("s2", "Squat", 105),
			]);
			for (const seed of [0, 0.5, 0.99]) {
				const result = mostImprovedDetector(ctx, seed);
				expect(result.length).toBe(1);
				expect(result[0].exerciseName).toBe("Squat");
			}
		});

		it("impactScore of returned metric matches the picked candidate's gainKg", () => {
			const { sessions, exercises } = makeTop4Ctx();
			const result = mostImprovedDetector(makeCtx(sessions, exercises), 0.5); // Squat +5
			expect(result[0].impactScore).toBe(5);
			expect(result[0].payload["gainKg"]).toBe(5);
		});
	});
});

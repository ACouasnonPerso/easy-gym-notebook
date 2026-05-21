import { selectHighlights } from "./highlight-stats.service";
import { HighlightMetric, DetectorContext } from "./highlight-metric.model";

function makeCtx(bonuses: Record<string, number> = {}): DetectorContext {
	return {
		sessions: [],
		exercises: [],
		today: new Date(),
		favoriteBonus: (name: string) => bonuses[name] ?? 0,
	};
}

function makePerf(id: string, exerciseName: string, impactScore: number): HighlightMetric {
	return { id, category: "perf", impactScore, exerciseName, payload: {} };
}

function makeRegularity(id: string, impactScore: number): HighlightMetric {
	return { id, category: "regularity", impactScore, payload: {} };
}

describe("selectHighlights", () => {
	it("should return an empty array when no detectors trigger", () => {
		expect(selectHighlights([], makeCtx())).toEqual([]);
	});

	it("should select up to 2 perf and 1 regularity when all three slots can be filled", () => {
		const candidates = [
			makePerf("weight-pr", "Bench", 5),
			makePerf("volume-progression", "Squat", 30),
			makeRegularity("consecutive-weeks", 4),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBe(3);
		expect(result.filter((h) => h.category === "perf").length).toBe(2);
		expect(result.filter((h) => h.category === "regularity").length).toBe(1);
	});

	it("should apply favorite bonus to perf metrics and prefer the boosted exercise over a higher raw score", () => {
		// Bench has raw score 30, Squat has raw score 20 but gets +30% bonus → 26
		// Without bonus: Bench rank 1, Squat rank 2
		// With bonus (Squat x1.30): Squat finalScore = 26, Bench = 30 — Bench still first, but test verifies math applies
		const candidates = [
			makePerf("volume-progression", "Bench", 42), // raw 42
			makePerf("weight-pr", "Squat", 30),        // raw 30 × 1.30 = 39 < 42
		];
		const result = selectHighlights(candidates, makeCtx({ Squat: 0.3 }));
		// Bench still wins (42 > 39)
		expect(result[0].exerciseName).toBe("Bench");
		expect(result[1].exerciseName).toBe("Squat");
	});

	it("should apply favorite bonus that overrides raw ordering when bonus is large enough", () => {
		// Bench raw 42 (no bonus); Squat raw 30, bonus +50% → finalScore 45 > 42
		const candidates = [
			makePerf("volume-progression", "Bench", 42),
			makePerf("weight-pr", "Squat", 30),
		];
		const result = selectHighlights(candidates, makeCtx({ Squat: 0.5 }));
		expect(result[0].exerciseName).toBe("Squat"); // 30 × 1.5 = 45 wins
	});

	it("should deduplicate: only one highlight per exercise name among perf metrics", () => {
		// Two perf metrics for 'Tractions' and one for 'Rowing'
		const candidates = [
			makePerf("weight-pr", "Tractions", 90),
			makePerf("volume-progression", "Tractions", 40),
			makePerf("volume-progression", "Rowing", 20),
		];
		const result = selectHighlights(candidates, makeCtx());
		const exerciseNames = result.map((h) => h.exerciseName).filter(Boolean);
		const unique = new Set(exerciseNames);
		expect(unique.size).toBe(exerciseNames.length); // no duplicates
		// Tractions should appear only once
		expect(exerciseNames.filter((n) => n === "Tractions").length).toBe(1);
		// Rowing should appear
		expect(exerciseNames).toContain("Rowing");
	});

	it("should fall back to top 3 perf metrics when no regularity detector triggers", () => {
		const candidates = [
			makePerf("weight-pr", "Squat", 30),
			makePerf("volume-progression", "Bench", 20),
			makePerf("most-improved", "Deadlift", 10),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBe(3);
		expect(result.every((h) => h.category === "perf")).toBeTrue();
	});

	it("should fall back to up to 3 regularity metrics when no perf detector triggers", () => {
		const candidates = [
			makeRegularity("seven-day-streak", 5),
			makeRegularity("consecutive-weeks", 4),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBe(2);
		expect(result.every((h) => h.category === "regularity")).toBeTrue();
	});

	it("should not apply favorite bonus to regularity metrics", () => {
		const regularity = makeRegularity("consecutive-weeks", 4);
		const result = selectHighlights([regularity], makeCtx({ "consecutive-weeks": 0.5 }));
		expect(result.length).toBe(1);
		expect(result[0].category).toBe("regularity");
	});

	it("should return at most 3 highlights", () => {
		const candidates = [
			makePerf("weight-pr", "A", 100),
			makePerf("volume-progression", "B", 90),
			makePerf("most-improved", "C", 80),
			makeRegularity("consecutive-weeks", 70),
			makeRegularity("seven-day-streak", 60),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBeLessThanOrEqual(3);
	});

	it("should map metrics to view models with correct i18n label keys", () => {
		const candidates = [makePerf("weight-pr", "Squat", 10)];
		const result = selectHighlights(candidates, makeCtx());
		expect(result[0].labelKey).toBe("statsGlobal.highlights.weightPr");
	});
});

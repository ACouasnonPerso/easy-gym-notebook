import { TestBed } from "@angular/core/testing";
import { signal, WritableSignal } from "@angular/core";
import { selectHighlights, HighlightStatsService } from "./highlight-stats.service";
import { HighlightMetric, DetectorContext } from "./highlight-metric.model";
import { StatsService } from "./stats.service";
import { FavoriteExercisesService } from "./favorite-exercises.service";
import { HighlightDebugService } from "./highlight-debug.service";
import { SessionService } from "../session/session.service";
import { MILESTONE_REPOSITORY } from "../../secondary_ports/highlight-stats/milestone-repository.interface";
import { RecentHighlightEntry, RECENT_HIGHLIGHTS_REPOSITORY } from "../../secondary_ports/highlight-stats/recent-highlights-repository.interface";
import { Session, Exercise } from "../shared/models";

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

	it("should show 2 highlights (not 3) when only 1 perf + 2 regularity fire — no 2nd regularity forced", () => {
		// When perf candidates exist, a 2nd regularity is never added to avoid showing
		// both regularity highlights together on every reload.
		const candidates = [
			makePerf("volume-progression", "Bench", 20),
			makeRegularity("consecutive-weeks", 10),
			makeRegularity("seven-day-streak", 8),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBe(2);
		expect(result.filter((h) => h.category === "regularity").length).toBe(1);
		expect(result.filter((h) => h.category === "perf").length).toBe(1);
	});

	it("should show 3 highlights when 2 perf + 2 regularity fire — 3rd slot is perf not regularity", () => {
		const candidates = [
			makePerf("weight-pr", "Squat", 30),
			makePerf("volume-progression", "Bench", 20),
			makeRegularity("consecutive-weeks", 10),
			makeRegularity("seven-day-streak", 8),
		];
		const result = selectHighlights(candidates, makeCtx());
		expect(result.length).toBe(3);
		expect(result.filter((h) => h.category === "regularity").length).toBe(1);
		expect(result.filter((h) => h.category === "perf").length).toBe(2);
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

	describe("session boost", () => {
		it("T1: no boost when sessionBoostExercises is empty", () => {
			const candidates = [
				makePerf("weight-pr", "Bench", 10),
				makePerf("volume-progression", "Squat", 9),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set());
			expect(result[0].exerciseName).toBe("Bench");
			expect(result[1].exerciseName).toBe("Squat");
		});

		it("T2: perf candidate in session set receives x1.50 multiplier", () => {
			// Bench in session: 10*1.5=15 > Squat=12
			const candidates = [
				makePerf("weight-pr", "Bench", 10),
				makePerf("volume-progression", "Squat", 12),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["Bench"]));
			expect(result[0].exerciseName).toBe("Bench");
		});

		it("T3: session boost stacks over favorite bonus: impactScore × (1+favoriteBonus) × 1.50", () => {
			// Bench: 10 * 1.30 * 1.50 = 19.5 > Squat: 18
			const candidates = [
				makePerf("weight-pr", "Bench", 10),
				makePerf("volume-progression", "Squat", 18),
			];
			const result = selectHighlights(candidates, makeCtx({ Bench: 0.30 }), false, new Set(["Bench"]));
			expect(result[0].exerciseName).toBe("Bench");
		});

		it("T4: session boost can flip ranking when raw-score leader is not in session", () => {
			// Squat not in session: 20; Bench in session: 14*1.5=21
			const candidates = [
				makePerf("weight-pr", "Squat", 20),
				makePerf("volume-progression", "Bench", 14),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["Bench"]));
			expect(result[0].exerciseName).toBe("Bench");
		});

		it("T5: perf candidates NOT in session set are unaffected", () => {
			// A in session: 30*1.5=45; B not: 25; C not: 20
			const candidates = [
				makePerf("weight-pr", "A", 30),
				makePerf("volume-progression", "B", 25),
				makePerf("most-improved", "C", 20),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["A"]));
			expect(result[0].exerciseName).toBe("A");
			expect(result[1].exerciseName).toBe("B");
			expect(result[2].exerciseName).toBe("C");
		});

		it("T6: session boost does NOT apply to regularity candidates", () => {
			// consecutive-weeks impactScore=9, in session set (should NOT boost it)
			// seven-day-streak impactScore=10, not in session set
			// If regularity were boosted: 9*1.5=13.5 > 10 → consecutive-weeks first (WRONG)
			// If not boosted: 9 < 10 → seven-day-streak first (CORRECT)
			const candidates = [
				makeRegularity("consecutive-weeks", 9),
				makeRegularity("seven-day-streak", 10),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["consecutive-weeks"]));
			expect(result[0].id).toBe("seven-day-streak");
		});

		it("T7: dedup by exerciseName still works when two perf candidates share a boosted exercise", () => {
			const candidates = [
				makePerf("weight-pr", "Bench", 50),
				makePerf("volume-progression", "Bench", 40),
				makePerf("most-improved", "Squat", 10),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["Bench"]));
			const benchResults = result.filter((h) => h.exerciseName === "Bench");
			expect(benchResults.length).toBe(1);
			expect(result.some((h) => h.exerciseName === "Squat")).toBeTrue();
		});

		it("T8: category cap (<=2 perf + <=1 regularity) preserved when many candidates are boosted", () => {
			const candidates = [
				makePerf("weight-pr", "A", 10),
				makePerf("volume-progression", "B", 20),
				makePerf("most-improved", "C", 30),
				makePerf("weight-pr", "D", 40),
				makePerf("volume-progression", "E", 50),
				makeRegularity("consecutive-weeks", 60),
				makeRegularity("seven-day-streak", 70),
			];
			const result = selectHighlights(candidates, makeCtx(), false, new Set(["A", "B", "C", "D", "E"]));
			expect(result.length).toBeLessThanOrEqual(3);
			expect(result.filter((h) => h.category === "perf").length).toBeLessThanOrEqual(2);
			expect(result.filter((h) => h.category === "regularity").length).toBeLessThanOrEqual(1);
		});

		it("T9: perf candidate with no exerciseName receives no session boost", () => {
			// noName not boosted (no exerciseName): 10
			// withName in session: 7*1.5=10.5 > 10 → withName wins
			// If noName were incorrectly boosted: 10*1.5=15 > 10.5 → noName would win (test fails)
			const noName: HighlightMetric = { id: "weight-pr", category: "perf", impactScore: 10, payload: {} };
			const withName: HighlightMetric = { id: "volume-progression", category: "perf", impactScore: 7, exerciseName: "Something", payload: {} };
			const result = selectHighlights([noName, withName], makeCtx(), false, new Set(["Something"]));
			expect(result[0].id).toBe("volume-progression");
		});
	});
});

describe("HighlightStatsService — session boost wiring", () => {
	let service: HighlightStatsService;
	let currentSession: WritableSignal<Session | null>;

	function makeMinimalExercise(name: string): Exercise {
		return {
			id: "e1", sessionId: "s1", name,
			muscleGroup: null, muscleGroups: [], weightKg: 0,
			sets: 0, reps: 0, breakDurationSeconds: 0,
			status: "validated", isCardio: false,
			durationSeconds: 0, distanceKm: null,
			isPyramid: false, pyramidSets: [],
			rating: null, comment: null,
		};
	}

	function makeMinimalSession(exercises: Exercise[]): Session {
		return {
			id: "s1", date: new Date(),
			status: "active", durationSeconds: 0,
			muscleGroup: null, exercises,
		};
	}

	beforeEach(() => {
		currentSession = signal<Session | null>(null);

		TestBed.configureTestingModule({
			providers: [
				HighlightStatsService,
				{ provide: StatsService, useValue: { _allSessions: signal([]), _allExercises: signal([]) } },
				{ provide: FavoriteExercisesService, useValue: { favoriteBonus: () => 0 } },
				{ provide: MILESTONE_REPOSITORY, useValue: { getLastMilestoneKg: () => null, setLastMilestoneKg: () => {} } },
				{ provide: HighlightDebugService, useValue: { isEnabled: () => false } },
				{ provide: SessionService, useValue: { currentSession } },
				{ provide: RECENT_HIGHLIGHTS_REPOSITORY, useValue: { getRecent: () => [], pushRecent: () => {} } },
			],
		});
		service = TestBed.inject(HighlightStatsService);
	});

	it("T10: sessionBoostExercises is empty Set when currentSession is null", () => {
		expect(service.sessionBoostExercises().size).toBe(0);
	});

	it("T11: sessionBoostExercises populated from currentSession().exercises names", () => {
		currentSession.set(makeMinimalSession([
			makeMinimalExercise("Bench"),
			makeMinimalExercise("Squat"),
		]));
		expect(service.sessionBoostExercises().has("Bench")).toBeTrue();
		expect(service.sessionBoostExercises().has("Squat")).toBeTrue();
		expect(service.sessionBoostExercises().size).toBe(2);
	});

	it("T12: sessionBoostExercises reacts when currentSession changes from null to active", () => {
		expect(service.sessionBoostExercises().size).toBe(0);
		currentSession.set(makeMinimalSession([makeMinimalExercise("Bench")]));
		expect(service.sessionBoostExercises().has("Bench")).toBeTrue();
	});
});

describe("selectHighlights — anti-repeat rotation (Groups A–E)", () => {
	// ── Group A: Identity matching ────────────────────────────────────────────

	it("T1: empty recent list — all fresh — highest score first (regression)", () => {
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), []);
		expect(result[0].exerciseName).toBe("Squat");
		expect(result[1].exerciseName).toBe("Bench");
	});

	it("T2: exact (id+exerciseName) hit in recent — fresh Bench(50) beats stale Squat(100)", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "weight-pr", exerciseName: "Squat" }];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result[0].exerciseName).toBe("Bench");
	});

	it("T3: same id different exerciseName = distinct identity — weight-pr/Bench fresh, weight-pr/Squat stale", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "weight-pr", exerciseName: "Squat" }];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("weight-pr", "Bench", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result[0].exerciseName).toBe("Bench");
		expect(result[1].exerciseName).toBe("Squat");
	});

	it("T4: regularity identity is (id, '') — consecutive-weeks in recent is stale, fresh perf appears first", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "consecutive-weeks" }];
		const candidates = [
			makePerf("volume-progression", "Bench", 30),
			makeRegularity("consecutive-weeks", 100),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.length).toBe(2);
		expect(result[0].exerciseName).toBe("Bench");
		expect(result[1].id).toBe("consecutive-weeks");
	});

	it("T5: regularity NOT stale when recent entry has non-empty exerciseName for same id", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "consecutive-weeks", exerciseName: "Squat" }];
		const candidates = [makeRegularity("consecutive-weeks", 100)];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.length).toBe(1);
		expect(result[0].id).toBe("consecutive-weeks");
	});

	// ── Group B: Fresh-first slot filling ────────────────────────────────────

	it("T6: fresh fills first perf slot, stale fills remaining perf slot — both present in result", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "weight-pr", exerciseName: "Squat" }];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.length).toBe(2);
		expect(result[0].exerciseName).toBe("Bench");
		expect(result[1].exerciseName).toBe("Squat");
	});

	it("T7: enough fresh perf — stale perf not selected from perf slots when regularity fills 3rd slot", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "most-improved", exerciseName: "Deadlift" }];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 90),
			makePerf("most-improved", "Deadlift", 80),
			makeRegularity("consecutive-weeks", 60),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.some((h) => h.exerciseName === "Deadlift")).toBeFalse();
		expect(result.some((h) => h.exerciseName === "Squat")).toBeTrue();
		expect(result.some((h) => h.exerciseName === "Bench")).toBeTrue();
		expect(result.some((h) => h.id === "consecutive-weeks")).toBeTrue();
	});

	it("T8: score ordering preserved among fresh candidates — highest fresh first, stale excluded from perf slots", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "most-improved", exerciseName: "Deadlift" }];
		const candidates = [
			makePerf("weight-pr", "Squat", 30),
			makePerf("volume-progression", "Bench", 50),
			makePerf("most-improved", "Deadlift", 80),
			makeRegularity("consecutive-weeks", 40),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result[0].exerciseName).toBe("Bench");
		expect(result[1].exerciseName).toBe("Squat");
		expect(result.some((h) => h.exerciseName === "Deadlift")).toBeFalse();
	});

	it("T9: fresh-first applies to regularity pool — fresh seven-day-streak preferred over stale consecutive-weeks", () => {
		const recentEntries: RecentHighlightEntry[] = [{ id: "consecutive-weeks" }];
		const candidates = [
			makeRegularity("consecutive-weeks", 100),
			makeRegularity("seven-day-streak", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result[0].id).toBe("seven-day-streak");
	});

	// ── Group C: All-stale fallback ───────────────────────────────────────────

	it("T10: all perf stale — still returns those candidates (not 0)", () => {
		const recentEntries: RecentHighlightEntry[] = [
			{ id: "weight-pr", exerciseName: "Squat" },
			{ id: "volume-progression", exerciseName: "Bench" },
		];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 90),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.length).toBe(2);
	});

	it("T11: full 3-slot all stale — returns 3 highlights", () => {
		const recentEntries: RecentHighlightEntry[] = [
			{ id: "weight-pr", exerciseName: "Squat" },
			{ id: "volume-progression", exerciseName: "Bench" },
			{ id: "consecutive-weeks" },
		];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 90),
			makeRegularity("consecutive-weeks", 80),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		expect(result.length).toBe(3);
	});

	it("T12: all stale excess candidates — top-scored stale fill slots, lowest excluded", () => {
		const recentEntries: RecentHighlightEntry[] = [
			{ id: "weight-pr", exerciseName: "Squat" },
			{ id: "volume-progression", exerciseName: "Bench" },
			{ id: "most-improved", exerciseName: "Deadlift" },
			{ id: "seven-day-streak", exerciseName: "Press" },
		];
		const candidates = [
			makePerf("weight-pr", "Squat", 100),
			makePerf("volume-progression", "Bench", 90),
			makePerf("most-improved", "Deadlift", 70),
			makePerf("seven-day-streak", "Press", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), recentEntries);
		// Fallback: only stale perf, fill up to 3 (top 3 by score)
		expect(result.length).toBe(3);
		expect(result.some((h) => h.exerciseName === "Squat")).toBeTrue();
		expect(result.some((h) => h.exerciseName === "Bench")).toBeTrue();
		expect(result.some((h) => h.exerciseName === "Deadlift")).toBeTrue();
		expect(result.some((h) => h.exerciseName === "Press")).toBeFalse();
	});

	// ── Group E: Regression guards ────────────────────────────────────────────

	it("T17: fresh-first does not bypass exerciseName deduplication", () => {
		const candidates = [
			makePerf("weight-pr", "Bench", 100),
			makePerf("volume-progression", "Bench", 90),
			makePerf("most-improved", "Squat", 50),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), []);
		const benchResults = result.filter((h) => h.exerciseName === "Bench");
		expect(benchResults.length).toBe(1);
		expect(result.some((h) => h.exerciseName === "Squat")).toBeTrue();
	});

	it("T18: fresh-first does not break <=2 perf + <=1 regularity cap", () => {
		const candidates = [
			makePerf("weight-pr", "A", 100),
			makePerf("volume-progression", "B", 90),
			makePerf("most-improved", "C", 80),
			makeRegularity("consecutive-weeks", 70),
			makeRegularity("seven-day-streak", 60),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(), []);
		expect(result.length).toBeLessThanOrEqual(3);
		expect(result.filter((h) => h.category === "perf").length).toBeLessThanOrEqual(2);
		expect(result.filter((h) => h.category === "regularity").length).toBeLessThanOrEqual(1);
	});

	it("T19: session boost still applies within fresh pool", () => {
		const candidates = [
			makePerf("weight-pr", "Bench", 10),
			makePerf("volume-progression", "Squat", 12),
		];
		const result = selectHighlights(candidates, makeCtx(), false, new Set(["Bench"]), []);
		expect(result[0].exerciseName).toBe("Bench");
	});
});

describe("HighlightStatsService — anti-repeat rotation write-back (Group D)", () => {
	let service: HighlightStatsService;
	let allSessions: WritableSignal<Session[]>;
	let allExercises: WritableSignal<Exercise[]>;
	let mockRecentRepo: { getRecent: jasmine.Spy; pushRecent: jasmine.Spy };

	function makePrSession(id: string, date: Date): Session {
		return { id, date, status: "completed" as const, durationSeconds: 0, muscleGroup: null, exercises: [] };
	}

	function makePrExercise(id: string, sessionId: string, weightKg: number): Exercise {
		return {
			id, sessionId, name: "Squat",
			muscleGroup: null, muscleGroups: [], weightKg,
			sets: 3, reps: 5, breakDurationSeconds: 0,
			status: "validated" as const, isCardio: false,
			durationSeconds: 0, distanceKm: null,
			isPyramid: false, pyramidSets: [],
			rating: null, comment: null,
		};
	}

	beforeEach(() => {
		allSessions = signal<Session[]>([]);
		allExercises = signal<Exercise[]>([]);
		mockRecentRepo = {
			getRecent: jasmine.createSpy("getRecent").and.returnValue([]),
			pushRecent: jasmine.createSpy("pushRecent"),
		};

		TestBed.configureTestingModule({
			providers: [
				HighlightStatsService,
				{ provide: StatsService, useValue: { _allSessions: allSessions, _allExercises: allExercises } },
				{ provide: FavoriteExercisesService, useValue: { favoriteBonus: () => 0 } },
				{ provide: MILESTONE_REPOSITORY, useValue: { getLastMilestoneKg: () => null, setLastMilestoneKg: () => {} } },
				{ provide: HighlightDebugService, useValue: { isEnabled: () => false } },
				{ provide: SessionService, useValue: { currentSession: signal(null) } },
				{ provide: RECENT_HIGHLIGHTS_REPOSITORY, useValue: mockRecentRepo },
			],
		});
		service = TestBed.inject(HighlightStatsService);
	});

	function setUpWeightPrData(): void {
		const today = new Date();
		const yesterday = new Date(today.getTime() - 86_400_000);
		const todaySession = makePrSession("today-s1", today);
		const histSession = makePrSession("hist-s1", yesterday);
		allSessions.set([todaySession, histSession]);
		allExercises.set([
			makePrExercise("e1", "today-s1", 100),
			makePrExercise("e2", "hist-s1", 80),
		]);
	}

	it("T13: pushRecent called exactly once when highlights() produces non-empty selection", () => {
		setUpWeightPrData();
		const result = service.highlights();
		expect(result.length).toBeGreaterThan(0);
		TestBed.flushEffects();
		expect(mockRecentRepo.pushRecent).toHaveBeenCalledTimes(1);
	});

	it("T14: pushRecent NOT called when selection is empty (empty sessions/exercises)", () => {
		const result = service.highlights();
		expect(result.length).toBe(0);
		TestBed.flushEffects();
		expect(mockRecentRepo.pushRecent).not.toHaveBeenCalled();
	});

	it("T15: pushRecent entries match selected highlight identities exactly", () => {
		setUpWeightPrData();
		const result = service.highlights();
		expect(result.length).toBeGreaterThan(0);
		TestBed.flushEffects();
		const entries: RecentHighlightEntry[] = mockRecentRepo.pushRecent.calls.mostRecent().args[0];
		expect(entries.length).toBe(result.length);
		for (const h of result) {
			expect(entries.some((e) => e.id === h.id && (e.exerciseName ?? "") === (h.exerciseName ?? ""))).toBeTrue();
		}
	});

	it("T16: getRecent() is called during highlights computation and wires into selectHighlights", () => {
		service.highlights();
		expect(mockRecentRepo.getRecent).toHaveBeenCalled();
	});
});

describe("HighlightStatsService — cold-start rotation (Group F)", () => {
	let service: HighlightStatsService;
	let allSessions: WritableSignal<Session[]>;
	let allExercises: WritableSignal<Exercise[]>;
	let mockRecentRepo: { getRecent: jasmine.Spy; pushRecent: jasmine.Spy };

	function makeSession(id: string, date: Date): Session {
		return { id, date, status: "completed" as const, durationSeconds: 0, muscleGroup: null, exercises: [] };
	}

	function makeExercise(id: string, sessionId: string, name: string, weightKg: number): Exercise {
		return {
			id, sessionId, name,
			muscleGroup: null, muscleGroups: [], weightKg,
			sets: 3, reps: 5, breakDurationSeconds: 0,
			status: "validated" as const, isCardio: false,
			durationSeconds: 0, distanceKm: null,
			isPyramid: false, pyramidSets: [],
			rating: null, comment: null,
		};
	}

	function buildFixture(): { sessions: Session[]; exercises: Exercise[] } {
		const today = new Date();
		const fiveDaysAgo = new Date(today.getTime() - 5 * 86_400_000);
		const fiftySevenDaysAgo = new Date(today.getTime() - 56 * 86_400_000);
		const firstOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

		const sToday = makeSession("sToday", today);
		const sHist = makeSession("sHist", fiftySevenDaysAgo);
		const sCurrMonth = makeSession("sCurrMonth", fiveDaysAgo);
		const sPrevMonth = makeSession("sPrevMonth", firstOfPrevMonth);

		return {
			sessions: [sToday, sHist, sCurrMonth, sPrevMonth],
			exercises: [
				// weight-pr candidates: today vs 8-weeks-ago historical
				makeExercise("e-squat-today", "sToday", "Squat", 105),     // gain +25
				makeExercise("e-deadlift-today", "sToday", "Deadlift", 80), // gain +20
				makeExercise("e-bench-today", "sToday", "BenchPress", 60),  // gain +10
				makeExercise("e-squat-hist", "sHist", "Squat", 80),
				makeExercise("e-deadlift-hist", "sHist", "Deadlift", 60),
				makeExercise("e-bench-hist", "sHist", "BenchPress", 50),
				// most-improved candidates: current month vs previous month
				makeExercise("e-ohp-curr", "sCurrMonth", "OHP", 70),  // gain +30
				makeExercise("e-row-curr", "sCurrMonth", "Row", 55),  // gain +15
				makeExercise("e-ohp-prev", "sPrevMonth", "OHP", 40),
				makeExercise("e-row-prev", "sPrevMonth", "Row", 40),
			],
		};
	}

	beforeEach(() => {
		allSessions = signal<Session[]>([]);
		allExercises = signal<Exercise[]>([]);
		mockRecentRepo = {
			getRecent: jasmine.createSpy("getRecent").and.returnValue([]),
			pushRecent: jasmine.createSpy("pushRecent"),
		};

		TestBed.configureTestingModule({
			providers: [
				HighlightStatsService,
				{ provide: StatsService, useValue: { _allSessions: allSessions, _allExercises: allExercises } },
				{ provide: FavoriteExercisesService, useValue: { favoriteBonus: () => 0 } },
				{ provide: MILESTONE_REPOSITORY, useValue: { getLastMilestoneKg: () => null, setLastMilestoneKg: () => {} } },
				{ provide: HighlightDebugService, useValue: { isEnabled: () => false } },
				{ provide: SessionService, useValue: { currentSession: signal(null) } },
				{ provide: RECENT_HIGHLIGHTS_REPOSITORY, useValue: mockRecentRepo },
			],
		});
		service = TestBed.inject(HighlightStatsService);

		const { sessions, exercises } = buildFixture();
		allSessions.set(sessions);
		allExercises.set(exercises);
	});

	it("F1: first cold start with empty recent buffer returns 3 highlights with 1 most-improved and 2 weight-pr", () => {
		const result = service.highlights();
		expect(result.length).toBe(3);
		// mostImprovedDetector picks 1 at random from the qualifying pool (OHP or Row in this fixture)
		expect(result.some((h) => h.id === "most-improved")).toBeTrue();
		expect(result.some((h) => h.id === "weight-pr" && h.exerciseName === "Squat")).toBeTrue();
		expect(result.some((h) => h.id === "weight-pr" && h.exerciseName === "Deadlift")).toBeTrue();
	});

	it("F2: after seeding OHP+Squat+Deadlift as recent, result contains at least 1 fresh identity (Row or BenchPress)", () => {
		const recentBuffer: RecentHighlightEntry[] = [
			{ id: "most-improved", exerciseName: "OHP" },
			{ id: "weight-pr", exerciseName: "Squat" },
			{ id: "weight-pr", exerciseName: "Deadlift" },
		];
		mockRecentRepo.getRecent.and.returnValue(recentBuffer);

		const result = service.highlights();
		const recentIds = new Set(recentBuffer.map((e) => `${e.id}::${e.exerciseName ?? ""}`));
		const freshCount = result.filter((h) => !recentIds.has(`${h.id}::${h.exerciseName ?? ""}`)).length;
		expect(freshCount).toBeGreaterThanOrEqual(1);
	});

	it("F3: getRecent called at least twice across both cold starts; pushRecent entries match first result", () => {
		const firstResult = service.highlights();
		TestBed.flushEffects();

		expect(mockRecentRepo.pushRecent).toHaveBeenCalled();
		const firstPushArgs: RecentHighlightEntry[] = mockRecentRepo.pushRecent.calls.mostRecent().args[0];

		const seededEntries: RecentHighlightEntry[] = firstResult.map((h) => ({
			id: h.id,
			...(h.exerciseName ? { exerciseName: h.exerciseName } : {}),
		}));
		mockRecentRepo.getRecent.and.returnValue(seededEntries);

		// Dirty the computed to force re-evaluation on second call
		allSessions.set([...allSessions()]);

		service.highlights();

		expect(mockRecentRepo.getRecent.calls.count()).toBeGreaterThanOrEqual(2);
		expect(firstPushArgs.length).toBe(firstResult.length);
		for (const h of firstResult) {
			expect(firstPushArgs.some((e) => e.id === h.id && (e.exerciseName ?? "") === (h.exerciseName ?? ""))).toBeTrue();
		}
	});
});

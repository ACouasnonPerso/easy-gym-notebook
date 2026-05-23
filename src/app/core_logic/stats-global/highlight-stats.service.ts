import { Injectable, inject, computed, effect } from "@angular/core";
import { StatsService } from "./stats.service";
import { FavoriteExercisesService } from "./favorite-exercises.service";
import { HighlightMetric, HighlightViewModel, DetectorContext } from "./highlight-metric.model";
import { MILESTONE_REPOSITORY } from "../../secondary_ports/highlight-stats/milestone-repository.interface";
import { RECENT_HIGHLIGHTS_REPOSITORY, RecentHighlightEntry } from "../../secondary_ports/highlight-stats/recent-highlights-repository.interface";
import { HighlightDebugService } from "./highlight-debug.service";
import { SessionService } from "../session/session.service";

// Detectors
import { weightPrDetector } from "./highlight-detectors/weight-pr.detector";
import { volumeProgressionDetector } from "./highlight-detectors/volume-progression.detector";
import { mostImprovedDetector } from "./highlight-detectors/most-improved.detector";
import { sevenDayStreakDetector } from "./highlight-detectors/seven-day-streak.detector";
import { consecutiveWeeksDetector } from "./highlight-detectors/consecutive-weeks.detector";
import { volumeMilestoneDetector } from "./highlight-detectors/volume-milestone.detector";


function formatTimeSince(date: Date, today: Date): { key: string; params?: Record<string, number> } {
	const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
	if (diffDays < 14) return { key: "statsGlobal.highlights.context.thisWeek" };
	if (diffDays < 55) return { key: "statsGlobal.highlights.context.inWeeks", params: { count: Math.round(diffDays / 7) } };
	if (diffDays < 365) return { key: "statsGlobal.highlights.context.inMonths", params: { count: Math.round(diffDays / 30) } };
	return { key: "statsGlobal.highlights.context.fromStart" };
}

function toViewModel(metric: HighlightMetric): HighlightViewModel {
	const icons: Record<string, string> = {
		"weight-pr": "🥳",
		"volume-progression": "📈",
		"most-improved": "💪",
		"seven-day-streak": "👏",
		"consecutive-weeks": "🔥",
		"volume-milestone": "💪",
	};

	const labelKeys: Record<string, string> = {
		"weight-pr": "statsGlobal.highlights.weightPr",
		"volume-progression": "statsGlobal.highlights.volumeProgression",
		"most-improved": "statsGlobal.highlights.mostImproved",
		"seven-day-streak": "statsGlobal.highlights.sevenDayStreak",
		"consecutive-weeks": "statsGlobal.highlights.consecutiveWeeks",
		"volume-milestone": "statsGlobal.highlights.volumeMilestone",
	};

	const payload = metric.payload;
	const today = new Date();
	let value = "";
	let subValue: string | undefined;
	let subContext: string | undefined;
	let subContextParams: Record<string, string | number> | undefined;
	let subContextMonthKey: string | undefined;

	switch (metric.id) {
		case "weight-pr": {
			value = `${payload["weightKg"]} kg`;
			subValue = `+${payload["gainKg"]} kg`;
			const previousPrDate = payload["previousPrDate"] as string | undefined;
			if (previousPrDate) {
				const ctx = formatTimeSince(new Date(previousPrDate), today);
				subContext = ctx.key;
				subContextParams = ctx.params;
			} else {
				subContext = "statsGlobal.highlights.context.allTime";
			}
			break;
		}
		case "volume-progression":
			value = `+${payload["pctGain"]}%`;
			subValue = `${Math.round(payload["currentVolumeKg"] as number)} kg`;
			break;
		case "most-improved": {
			value = `${payload["currentMaxKg"]} kg`;
			subValue = `+${payload["gainKg"]} kg`;
			const prevMonth = payload["prevMonth"] as number;
			const prevYear = payload["prevYear"] as number;
			const currentYear = today.getFullYear();
			subContextMonthKey = `months.${prevMonth}`;
			if (prevYear !== currentYear) {
				subContext = "statsGlobal.highlights.context.vsMonthYear";
				subContextParams = { year: String(prevYear).slice(2) };
			} else {
				subContext = "statsGlobal.highlights.context.vsMonth";
			}
			break;
		}
		case "seven-day-streak":
			value = `${payload["sessionCount"]}`;
			break;
		case "consecutive-weeks":
			value = `${payload["weeks"]}`;
			break;
		case "volume-milestone":
			value = `${payload["milestoneTonnes"]}t`;
			break;
	}

	return {
		id: metric.id,
		category: metric.category,
		labelKey: labelKeys[metric.id] ?? `statsGlobal.highlights.${metric.id}`,
		value,
		subValue,
		subContext,
		subContextParams,
		subContextMonthKey,
		exerciseName: metric.exerciseName,
		icon: icons[metric.id] ?? "⭐",
	};
}

@Injectable({ providedIn: "root" })
export class HighlightStatsService {
	private readonly statsService = inject(StatsService);
	private readonly favoriteExercisesService = inject(FavoriteExercisesService);
	private readonly milestoneRepo = inject(MILESTONE_REPOSITORY);
	private readonly recentRepo = inject(RECENT_HIGHLIGHTS_REPOSITORY);
	private readonly debugService = inject(HighlightDebugService);
	private readonly sessionService = inject(SessionService);

	/** Generated once at instantiation — stable during the session, varies across cold starts. */
	private readonly coldStartSeed = Math.random();

	readonly sessionBoostExercises = computed((): Set<string> => {
		const session = this.sessionService.currentSession();
		if (!session) return new Set();
		return new Set(session.exercises.map((e) => e.name));
	});

	readonly highlights = computed((): HighlightViewModel[] => {
		const sessions = this.statsService._allSessions();
		const exercises = this.statsService._allExercises();
		const today = new Date();
		const isDebug = this.debugService.isEnabled();
		const recentEntries = this.recentRepo.getRecent();

		const debugLog = isDebug
			? (msg: string) => console.log(`%c${msg}`, "color: #93c5fd;")
			: undefined;

		if (isDebug) {
			console.group(
				`%c[highlights-debug] Calcul des highlights — ${today.toLocaleString()}`,
				"color: #facc15; font-weight: bold;"
			);
			console.log(`%c  ${sessions.length} séance(s), ${exercises.length} exercice(s) au total`, "color: #d1d5db;");
		}

		const ctx: DetectorContext = {
			sessions,
			exercises,
			today,
			favoriteBonus: (name: string) => this.favoriteExercisesService.favoriteBonus(name),
			debugLog,
		};

		// Run all detectors
		const candidates: HighlightMetric[] = [];

		candidates.push(...volumeMilestoneDetector(
			ctx,
			() => this.milestoneRepo.getLastMilestoneKg(),
			(kg) => this.milestoneRepo.setLastMilestoneKg(kg)
		));

		candidates.push(...weightPrDetector(ctx));

		candidates.push(...volumeProgressionDetector(ctx));

		candidates.push(...mostImprovedDetector(ctx, this.coldStartSeed));

		for (const detector of [sevenDayStreakDetector, consecutiveWeeksDetector]) {
			candidates.push(...detector(ctx));
		}

		const result = selectHighlights(candidates, ctx, isDebug, this.sessionBoostExercises(), recentEntries);

		if (isDebug) {
			if (result.length === 0) {
				console.log(`%c  → Aucun highlight sélectionné.`, "color: #f87171; font-weight: bold;");
			} else {
				console.log(`%c  → ${result.length} highlight(s) affiché(s) : ${result.map((h) => h.id).join(", ")}`, "color: #4ade80; font-weight: bold;");
			}
			console.groupEnd();
		}

		return result;
	});

	constructor() {
		// Write-back must live in an effect, not inside the computed, because
		// Angular forbids side-effects inside computed signals (writes are suppressed).
		effect(() => {
			const result = this.highlights();
			if (result.length > 0) {
				this.recentRepo.pushRecent(result.map((h) => {
					const entry: RecentHighlightEntry = { id: h.id };
					if (h.exerciseName) entry.exerciseName = h.exerciseName;
					return entry;
				}));
			}
		});
	}
}

/**
 * Applies favorite bonus to perf metrics, sorts, and selects up to 2 perf + 1 regularity.
 * Deduplicates by exerciseName (regularity metrics exempt).
 * Fresh candidates (identity not in recentEntries) are preferred over stale ones within each pool.
 */
export function selectHighlights(
	candidates: HighlightMetric[],
	ctx: DetectorContext,
	debug = false,
	sessionBoostExercises: Set<string> = new Set(),
	recentEntries: RecentHighlightEntry[] = [],
): HighlightViewModel[] {
	const debugLog = debug ? (msg: string) => console.log(`%c${msg}`, "color: #93c5fd;") : undefined;

	if (debug) {
		if (candidates.length === 0) {
			debugLog?.(`[selection] Aucun candidat — tous les détecteurs ont retourné null`);
		} else {
			debugLog?.(`[selection] ${candidates.length} candidat(s) avant sélection :`);
		}
	}

	// Apply favorite bonus and session boost to perf candidates
	const scored = candidates.map((m) => {
		const bonus = m.category === "perf" && m.exerciseName
			? ctx.favoriteBonus(m.exerciseName)
			: 0;
		const sessionBoost = m.category === "perf" && m.exerciseName && sessionBoostExercises.has(m.exerciseName) ? 1.5 : 1.0;
		const finalScore = m.impactScore * (1 + bonus) * sessionBoost;
		debugLog?.(`[selection]   ${m.id}${m.exerciseName ? ` (${m.exerciseName})` : ""} — score: ${m.impactScore.toFixed(2)} × (1 + bonus ${(bonus * 100).toFixed(0)}%) × boost ${sessionBoost} = ${finalScore.toFixed(2)}`);
		return { metric: m, finalScore };
	});

	// Build recent identity set for fresh/stale discrimination
	// Identity = (id, exerciseName ?? '')
	const recentSet = new Set(recentEntries.map((e) => `${e.id}::${e.exerciseName ?? ""}`));
	const isFresh = (metric: HighlightMetric) => !recentSet.has(`${metric.id}::${metric.exerciseName ?? ""}`);

	// Split by category and sort by score (descending within each tier)
	const perfCandidates = scored
		.filter((s) => s.metric.category === "perf")
		.sort((a, b) => b.finalScore - a.finalScore);

	const regularityCandidates = scored
		.filter((s) => s.metric.category === "regularity")
		.sort((a, b) => b.finalScore - a.finalScore);

	// Fresh-first ordering within each pool (score order preserved within each freshness tier)
	const orderedPerf = [
		...perfCandidates.filter((s) => isFresh(s.metric)),
		...perfCandidates.filter((s) => !isFresh(s.metric)),
	];
	const orderedReg = [
		...regularityCandidates.filter((s) => isFresh(s.metric)),
		...regularityCandidates.filter((s) => !isFresh(s.metric)),
	];

	const selected: HighlightMetric[] = [];
	const usedExerciseNames = new Set<string>();

	// Select up to 2 perf candidates (deduplicating by exerciseName), fresh first
	let perfCount = 0;
	for (const { metric } of orderedPerf) {
		if (perfCount >= 2) break;
		if (metric.exerciseName && usedExerciseNames.has(metric.exerciseName)) continue;
		selected.push(metric);
		if (metric.exerciseName) usedExerciseNames.add(metric.exerciseName);
		perfCount++;
	}

	// Select up to 1 regularity candidate, fresh first
	if (orderedReg.length > 0) {
		selected.push(orderedReg[0].metric);
	}

	// Fallback: fill remaining slots up to 3.
	// Rule: perf slots are preferred; a 2nd regularity is only ever added when
	// there are zero perf candidates in the entire pool (pure-regularity session).
	if (selected.length < 3) {
		// 1. Fill with more perf (cap = 3 when no regularity exists at all, else 2)
		const perfCap = regularityCandidates.length === 0 ? 3 : 2;
		for (const { metric } of orderedPerf) {
			if (selected.length >= 3 || perfCount >= perfCap) break;
			if (selected.includes(metric)) continue;
			if (metric.exerciseName && usedExerciseNames.has(metric.exerciseName)) continue;
			selected.push(metric);
			if (metric.exerciseName) usedExerciseNames.add(metric.exerciseName);
			perfCount++;
		}
		// 2. Extra regularity only when the pool has no perf candidates at all
		if (perfCandidates.length === 0) {
			for (const { metric } of orderedReg) {
				if (selected.length >= 3) break;
				if (selected.includes(metric)) continue;
				selected.push(metric);
			}
		}
	}

	return selected.slice(0, 3).map(toViewModel);
}

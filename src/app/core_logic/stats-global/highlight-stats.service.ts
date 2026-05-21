import { Injectable, inject, computed } from "@angular/core";
import { StatsService } from "./stats.service";
import { FavoriteExercisesService } from "./favorite-exercises.service";
import { HighlightMetric, HighlightViewModel, DetectorContext } from "./highlight-metric.model";
import { MILESTONE_REPOSITORY } from "../../secondary_ports/highlight-stats/milestone-repository.interface";
import { HighlightDebugService } from "./highlight-debug.service";

// Detectors
import { weightPrDetector } from "./highlight-detectors/weight-pr.detector";
import { volumeProgressionDetector } from "./highlight-detectors/volume-progression.detector";
import { mostImprovedDetector } from "./highlight-detectors/most-improved.detector";
import { sevenDayStreakDetector } from "./highlight-detectors/seven-day-streak.detector";
import { consecutiveWeeksDetector } from "./highlight-detectors/consecutive-weeks.detector";
import { volumeMilestoneDetector } from "./highlight-detectors/volume-milestone.detector";

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
	let value = "";
	let subValue: string | undefined;

	switch (metric.id) {
		case "weight-pr":
			value = `${payload["weightKg"]} kg`;
			subValue = `+${payload["gainKg"]} kg`;
			break;
		case "volume-progression":
			value = `+${payload["pctGain"]}%`;
			subValue = `${Math.round(payload["currentVolumeKg"] as number)} kg`;
			break;
		case "most-improved":
			value = `${payload["currentMaxKg"]} kg`;
			subValue = `+${payload["gainKg"]} kg`;
			break;
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
		exerciseName: metric.exerciseName,
		icon: icons[metric.id] ?? "⭐",
	};
}

@Injectable({ providedIn: "root" })
export class HighlightStatsService {
	private readonly statsService = inject(StatsService);
	private readonly favoriteExercisesService = inject(FavoriteExercisesService);
	private readonly milestoneRepo = inject(MILESTONE_REPOSITORY);
	private readonly debugService = inject(HighlightDebugService);

	readonly highlights = computed((): HighlightViewModel[] => {
		const sessions = this.statsService._allSessions();
		const exercises = this.statsService._allExercises();
		const today = new Date();
		const isDebug = this.debugService.isEnabled();

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

		const milestoneResult = volumeMilestoneDetector(
			ctx,
			() => this.milestoneRepo.getLastMilestoneKg(),
			(kg) => this.milestoneRepo.setLastMilestoneKg(kg)
		);
		if (milestoneResult) candidates.push(milestoneResult);

		for (const detector of [weightPrDetector, volumeProgressionDetector, mostImprovedDetector]) {
			const result = detector(ctx);
			if (result) candidates.push(result);
		}

		for (const detector of [sevenDayStreakDetector, consecutiveWeeksDetector]) {
			const result = detector(ctx);
			if (result) candidates.push(result);
		}

		const result = selectHighlights(candidates, ctx, isDebug);

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
}

/**
 * Applies favorite bonus to perf metrics, sorts, and selects up to 2 perf + 1 regularity.
 * Deduplicates by exerciseName (regularity metrics exempt).
 */
export function selectHighlights(candidates: HighlightMetric[], ctx: DetectorContext, debug = false): HighlightViewModel[] {
	const debugLog = debug ? (msg: string) => console.log(`%c${msg}`, "color: #93c5fd;") : undefined;

	if (debug) {
		if (candidates.length === 0) {
			debugLog?.(`[selection] Aucun candidat — tous les détecteurs ont retourné null`);
		} else {
			debugLog?.(`[selection] ${candidates.length} candidat(s) avant sélection :`);
		}
	}
	// Apply favorite bonus to perf candidates
	const scored = candidates.map((m) => {
		const bonus = m.category === "perf" && m.exerciseName
			? ctx.favoriteBonus(m.exerciseName)
			: 0;
		const finalScore = m.impactScore * (1 + bonus);
		debugLog?.(`[selection]   ${m.id}${m.exerciseName ? ` (${m.exerciseName})` : ""} — score: ${m.impactScore.toFixed(2)} × (1 + bonus ${(bonus * 100).toFixed(0)}%) = ${finalScore.toFixed(2)}`);
		return { metric: m, finalScore };
	});

	// Split by category
	const perfCandidates = scored
		.filter((s) => s.metric.category === "perf")
		.sort((a, b) => b.finalScore - a.finalScore);

	const regularityCandidates = scored
		.filter((s) => s.metric.category === "regularity")
		.sort((a, b) => b.finalScore - a.finalScore);

	const selected: HighlightMetric[] = [];
	const usedExerciseNames = new Set<string>();

	// Select up to 2 perf candidates (deduplicating by exerciseName)
	for (const { metric } of perfCandidates) {
		if (selected.length >= 2) break;
		if (metric.exerciseName && usedExerciseNames.has(metric.exerciseName)) continue;
		selected.push(metric);
		if (metric.exerciseName) usedExerciseNames.add(metric.exerciseName);
	}

	// Select up to 1 regularity candidate
	const topRegularity = regularityCandidates[0];
	if (topRegularity) {
		selected.push(topRegularity.metric);
	}

	// Fallback: if only one category is available, fill up to 3
	if (selected.length < 3) {
		if (regularityCandidates.length > 0 && perfCandidates.length === 0) {
			// Only regularity — add more regularity
			for (const { metric } of regularityCandidates) {
				if (selected.includes(metric)) continue;
				if (selected.length >= 3) break;
				selected.push(metric);
			}
		} else if (perfCandidates.length > 0 && regularityCandidates.length === 0) {
			// Only perf — add more perf
			for (const { metric } of perfCandidates) {
				if (selected.includes(metric)) continue;
				if (selected.length >= 3) break;
				if (metric.exerciseName && usedExerciseNames.has(metric.exerciseName)) continue;
				selected.push(metric);
				if (metric.exerciseName) usedExerciseNames.add(metric.exerciseName);
			}
		}
	}

	return selected.slice(0, 3).map(toViewModel);
}

import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { Exercise } from "../../shared/models";

function getMaxWeightForExercise(exercises: Exercise[], name: string): number {
	let max = 0;
	for (const ex of exercises) {
		if (ex.name !== name || ex.isCardio) continue;
		const w = ex.isPyramid && ex.pyramidSets.length > 0
			? Math.max(...ex.pyramidSets.map((s) => s.weightKg))
			: ex.weightKg;
		if (w > max) max = w;
	}
	return max;
}

/**
 * Detects a new weight PR: today's max weight beats the historical max by ≥ 2.5 kg.
 * Excludes cardio exercises.
 * Returns the exercise with the highest gain among all PRs.
 */
export function weightPrDetector(ctx: DetectorContext): HighlightMetric | null {
	const { sessions, exercises, today } = ctx;

	const { debugLog } = ctx;

	// Identify today's sessions
	const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
	const todaySessionIds = new Set(
		sessions.filter((s) => {
			const d = new Date(s.date);
			return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
		}).map((s) => s.id)
	);

	if (todaySessionIds.size === 0) {
		debugLog?.(`[weight-pr] ❌ NULL — aucune séance aujourd'hui (${today.toLocaleDateString()})`);
		return null;
	}

	const todayExercises = exercises.filter((e) => todaySessionIds.has(e.sessionId) && !e.isCardio && e.status === "validated");
	const historicalExercises = exercises.filter((e) => !todaySessionIds.has(e.sessionId) && !e.isCardio && e.status === "validated");

	const exerciseNames = new Set(todayExercises.map((e) => e.name));
	debugLog?.(`[weight-pr] Séance aujourd'hui ✅ — ${todayExercises.length} exercice(s) validés : ${[...exerciseNames].join(", ")}`);

	let bestCandidate: { name: string; newMax: number; gain: number } | null = null;

	for (const name of exerciseNames) {
		const todayMax = getMaxWeightForExercise(todayExercises.filter((e) => e.name === name), name);
		const historicalMax = getMaxWeightForExercise(historicalExercises.filter((e) => e.name === name), name);
		const gain = todayMax - historicalMax;

		if (historicalMax === 0) {
			debugLog?.(`[weight-pr]   "${name}" — pas d'historique, ignoré`);
		} else if (gain < 2.5) {
			debugLog?.(`[weight-pr]   "${name}" — gain ${gain.toFixed(1)} kg < 2.5 kg requis (max actuel: ${todayMax} kg, historique: ${historicalMax} kg)`);
		} else {
			debugLog?.(`[weight-pr]   "${name}" ✅ PR +${gain.toFixed(1)} kg (${historicalMax} → ${todayMax} kg)`);
			if (!bestCandidate || gain > bestCandidate.gain) {
				bestCandidate = { name, newMax: todayMax, gain };
			}
		}
	}

	if (!bestCandidate) {
		debugLog?.(`[weight-pr] ❌ NULL — aucun PR ≥ 2.5 kg trouvé aujourd'hui`);
		return null;
	}

	debugLog?.(`[weight-pr] ✅ DÉCLENCHÉ — "${bestCandidate.name}" +${bestCandidate.gain.toFixed(1)} kg → ${bestCandidate.newMax} kg`);
	return {
		id: "weight-pr",
		category: "perf",
		impactScore: bestCandidate.gain,
		exerciseName: bestCandidate.name,
		payload: {
			exerciseName: bestCandidate.name,
			weightKg: bestCandidate.newMax,
			gainKg: bestCandidate.gain,
		},
	};
}

import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { Exercise, Session } from "../../shared/models";

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
 * Detects new weight PRs: today's max weight beats the historical max by ≥ 2.5 kg.
 * Excludes cardio exercises.
 * Returns up to 3 PRs sorted by gainKg descending.
 */
export function weightPrDetector(ctx: DetectorContext): HighlightMetric[] {
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
		debugLog?.(`[weight-pr] ❌ — aucune séance aujourd'hui (${today.toLocaleDateString()})`);
		return [];
	}

	const todayExercises = exercises.filter((e) => todaySessionIds.has(e.sessionId) && !e.isCardio && e.status === "validated");
	const historicalExercises = exercises.filter((e) => !todaySessionIds.has(e.sessionId) && !e.isCardio && e.status === "validated");

	const exerciseNames = new Set(todayExercises.map((e) => e.name));
	debugLog?.(`[weight-pr] Séance aujourd'hui ✅ — ${todayExercises.length} exercice(s) validés : ${[...exerciseNames].join(", ")}`);

	const sessionById = new Map<string, Session>(sessions.map((s) => [s.id, s]));
	const candidates: Array<{ name: string; newMax: number; gain: number; previousPrDate?: string }> = [];

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

			let previousPrDate: string | undefined;
			for (const ex of historicalExercises.filter((e) => e.name === name)) {
				const w = ex.isPyramid && ex.pyramidSets.length > 0
					? Math.max(...ex.pyramidSets.map((s) => s.weightKg))
					: ex.weightKg;
				if (Math.abs(w - historicalMax) < 0.01) {
					const session = sessionById.get(ex.sessionId);
					if (session && (!previousPrDate || session.date > new Date(previousPrDate))) {
						previousPrDate = session.date.toISOString();
					}
				}
			}

			candidates.push({ name, newMax: todayMax, gain, previousPrDate });
		}
	}

	if (candidates.length === 0) {
		debugLog?.(`[weight-pr] ❌ — aucun PR ≥ 2.5 kg trouvé aujourd'hui`);
		return [];
	}

	candidates.sort((a, b) => b.gain - a.gain);
	const top3 = candidates.slice(0, 3);

	debugLog?.(`[weight-pr] ✅ DÉCLENCHÉ — ${top3.length} PR(s) : ${top3.map((c) => `"${c.name}" +${c.gain.toFixed(1)} kg`).join(", ")}`);

	return top3.map((c) => ({
		id: "weight-pr",
		category: "perf",
		impactScore: c.gain,
		exerciseName: c.name,
		payload: {
			exerciseName: c.name,
			weightKg: c.newMax,
			gainKg: c.gain,
			previousPrDate: c.previousPrDate,
		},
	}));
}

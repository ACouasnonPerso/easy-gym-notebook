import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { Session } from "../../shared/models";

/**
 * Detects the most improved exercise of the current month vs the previous month.
 * "Improvement" is measured by max weight increase, excluding cardio.
 * Returns null if no improvement of ≥ 2.5 kg is found.
 */
export function mostImprovedDetector(ctx: DetectorContext): HighlightMetric | null {
	const { sessions, exercises, today, debugLog } = ctx;

	const currentMonth = today.getMonth();
	const currentYear = today.getFullYear();
	const prevMonthDate = new Date(today);
	prevMonthDate.setDate(1);
	prevMonthDate.setMonth(currentMonth - 1);
	const prevMonth = prevMonthDate.getMonth();
	const prevYear = prevMonthDate.getFullYear();

	const sessionById = new Map<string, Session>(sessions.map((s) => [s.id, s]));

	const validatedNonCardio = exercises.filter((e) => e.status === "validated" && !e.isCardio);

	const maxByNameAndMonth = new Map<string, Map<string, number>>();

	for (const ex of validatedNonCardio) {
		const session = sessionById.get(ex.sessionId);
		if (!session) continue;
		const y = session.date.getFullYear();
		const m = session.date.getMonth();

		const isCurrentMonth = y === currentYear && m === currentMonth;
		const isPrevMonth = y === prevYear && m === prevMonth;
		if (!isCurrentMonth && !isPrevMonth) continue;

		const monthKey = isCurrentMonth ? "current" : "prev";
		const w = ex.isPyramid && ex.pyramidSets.length > 0
			? Math.max(...ex.pyramidSets.map((s) => s.weightKg))
			: ex.weightKg;

		if (!maxByNameAndMonth.has(ex.name)) maxByNameAndMonth.set(ex.name, new Map());
		const monthMap = maxByNameAndMonth.get(ex.name)!;
		monthMap.set(monthKey, Math.max(monthMap.get(monthKey) ?? 0, w));
	}

	const currentMonthName = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
	const prevMonthName = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
	debugLog?.(`[most-improved] Comparaison mois actuel (${currentMonthName}) vs précédent (${prevMonthName})`);

	let bestCandidate: { name: string; currentMax: number; gain: number } | null = null;

	for (const [name, monthMap] of maxByNameAndMonth) {
		const currentMax = monthMap.get("current") ?? 0;
		const prevMax = monthMap.get("prev") ?? 0;
		if (currentMax === 0) {
			debugLog?.(`[most-improved]   "${name}" — pas de données ce mois-ci, ignoré`);
			continue;
		}
		if (prevMax === 0) {
			debugLog?.(`[most-improved]   "${name}" — pas de données le mois précédent, ignoré`);
			continue;
		}
		const gain = currentMax - prevMax;
		if (gain < 2.5) {
			debugLog?.(`[most-improved]   "${name}" — gain ${gain.toFixed(1)} kg < 2.5 kg requis (${prevMax} → ${currentMax} kg)`);
			continue;
		}
		debugLog?.(`[most-improved]   "${name}" ✅ +${gain.toFixed(1)} kg (${prevMax} → ${currentMax} kg)`);
		if (!bestCandidate || gain > bestCandidate.gain) {
			bestCandidate = { name, currentMax, gain };
		}
	}

	if (!bestCandidate) {
		debugLog?.(`[most-improved] ❌ NULL — aucune progression ≥ 2.5 kg ce mois vs le mois précédent`);
		return null;
	}

	debugLog?.(`[most-improved] ✅ DÉCLENCHÉ — "${bestCandidate.name}" +${bestCandidate.gain.toFixed(1)} kg`);
	return {
		id: "most-improved",
		category: "perf",
		impactScore: bestCandidate.gain,
		exerciseName: bestCandidate.name,
		payload: {
			exerciseName: bestCandidate.name,
			currentMaxKg: bestCandidate.currentMax,
			gainKg: bestCandidate.gain,
		},
	};
}

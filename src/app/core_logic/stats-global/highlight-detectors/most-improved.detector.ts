import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { Session } from "../../shared/models";

/**
 * Detects the most improved exercises of the current month vs the previous month.
 * "Improvement" is measured by max weight increase, excluding cardio.
 * Selects 1 random candidate from the top-4 qualifying exercises (>= 2.5 kg threshold),
 * using coldStartSeed (a value in [0, 1) generated once per app cold start) so the
 * pick is stable during a session but varies across page reloads.
 * Returns [] if no exercise meets the threshold.
 */
export function mostImprovedDetector(ctx: DetectorContext, coldStartSeed: number): HighlightMetric[] {
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

	const candidates: { name: string; currentMax: number; gain: number }[] = [];

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
		candidates.push({ name, currentMax, gain });
	}

	if (candidates.length === 0) {
		debugLog?.(`[most-improved] ❌ [] — aucune progression ≥ 2.5 kg ce mois vs le mois précédent`);
		return [];
	}

	candidates.sort((a, b) => b.gain - a.gain);
	const top4 = candidates.slice(0, 4);
	const picked = top4[Math.floor(coldStartSeed * top4.length)];

	debugLog?.(`[most-improved] ✅ DÉCLENCHÉ — pool top-4: ${top4.map((c) => `"${c.name}" +${c.gain.toFixed(1)} kg`).join(", ")} → choix: "${picked.name}"`);

	return [{
		id: "most-improved",
		category: "perf",
		impactScore: picked.gain,
		exerciseName: picked.name,
		payload: {
			exerciseName: picked.name,
			currentMaxKg: picked.currentMax,
			gainKg: picked.gain,
			prevYear,
			prevMonth,
		},
	}];
}

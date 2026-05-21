import { DetectorContext, HighlightMetric } from "../highlight-metric.model";
import { Exercise, Session } from "../../shared/models";
import { computeVolume } from "../../shared/utils";

function getISOWeekKey(date: Date): string {
	// ISO week: Monday-based. Use a simple Monday-of-week key.
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getMondayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Detects 4-week volume progression.
 * Compares current week's volume to the average of the previous 4 weeks.
 * Only triggers if current week volume is meaningfully higher (> 10% increase).
 * Excludes cardio exercises with zero totalVolumeKg.
 * Returns up to 3 exercises sorted by percentage gain descending.
 */
export function volumeProgressionDetector(ctx: DetectorContext): HighlightMetric[] {
	const { sessions, exercises, today, debugLog } = ctx;

	const currentWeekMonday = getMondayOfWeek(today);

	// Map session id → session
	const sessionById = new Map<string, Session>(sessions.map((s) => [s.id, s]));

	// Validated exercises only
	const validatedExercises = exercises.filter((e) => e.status === "validated");

	// Group exercise volumes by (exerciseName, weekKey)
	const volumeByNameAndWeek = new Map<string, Map<string, number>>();

	for (const ex of validatedExercises) {
		if (ex.isCardio && computeVolume(ex) === 0) continue;
		const session = sessionById.get(ex.sessionId);
		if (!session) continue;
		const weekKey = getISOWeekKey(session.date);
		if (!volumeByNameAndWeek.has(ex.name)) volumeByNameAndWeek.set(ex.name, new Map());
		const weekMap = volumeByNameAndWeek.get(ex.name)!;
		weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + computeVolume(ex));
	}

	const currentWeekKey = getISOWeekKey(today);

	// Build keys for the previous 4 weeks
	const prev4Keys: string[] = [];
	for (let w = 1; w <= 4; w++) {
		const d = new Date(currentWeekMonday);
		d.setDate(d.getDate() - w * 7);
		prev4Keys.push(getISOWeekKey(d));
	}

	debugLog?.(`[volume-progression] Semaine courante: ${currentWeekKey} | Semaines précédentes: ${prev4Keys.join(", ")}`);

	const qualifiedCandidates: { name: string; currentVolume: number; avgPrev: number; pctGain: number }[] = [];

	for (const [name, weekMap] of volumeByNameAndWeek) {
		const currentVol = weekMap.get(currentWeekKey) ?? 0;
		if (currentVol === 0) {
			debugLog?.(`[volume-progression]   "${name}" — pas de volume cette semaine, ignoré`);
			continue;
		}

		const prevVolumes = prev4Keys.map((k) => weekMap.get(k) ?? 0);
		const prevWithData = prevVolumes.filter((v) => v > 0);
		if (prevWithData.length === 0) {
			debugLog?.(`[volume-progression]   "${name}" — pas d'historique sur les 4 semaines précédentes, ignoré`);
			continue;
		}

		const avgPrev = prevWithData.reduce((s, v) => s + v, 0) / prevWithData.length;
		if (avgPrev === 0) continue;

		const pctGain = (currentVol - avgPrev) / avgPrev;
		const pctGainRounded = Math.round(pctGain * 100);
		if (pctGain <= 0.1) {
			debugLog?.(`[volume-progression]   "${name}" — progression ${pctGainRounded}% ≤ 10% requis (semaine: ${Math.round(currentVol)} kg, moy. 4 sem.: ${Math.round(avgPrev)} kg)`);
			continue;
		}

		debugLog?.(`[volume-progression]   "${name}" ✅ +${pctGainRounded}% (semaine: ${Math.round(currentVol)} kg vs moy. ${Math.round(avgPrev)} kg)`);
		qualifiedCandidates.push({ name, currentVolume: currentVol, avgPrev, pctGain });
	}

	if (qualifiedCandidates.length === 0) {
		debugLog?.(`[volume-progression] ❌ EMPTY — aucune progression > 10% cette semaine`);
		return [];
	}

	qualifiedCandidates.sort((a, b) => b.pctGain - a.pctGain);
	const top3 = qualifiedCandidates.slice(0, 3);

	debugLog?.(`[volume-progression] ✅ DÉCLENCHÉ — ${top3.length} exercice(s) : ${top3.map((c) => `"${c.name}" +${Math.round(c.pctGain * 100)}%`).join(", ")}`);

	return top3.map((candidate) => ({
		id: "volume-progression",
		category: "perf",
		impactScore: candidate.pctGain * 100,
		exerciseName: candidate.name,
		payload: {
			exerciseName: candidate.name,
			currentVolumeKg: candidate.currentVolume,
			avgPrevVolumeKg: candidate.avgPrev,
			pctGain: Math.round(candidate.pctGain * 100),
		},
	}));
}

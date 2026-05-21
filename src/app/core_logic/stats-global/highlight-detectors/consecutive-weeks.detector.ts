import { DetectorContext, HighlightMetric } from "../highlight-metric.model";

function getMondayKey(date: Date): string {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getMondayTime(date: Date): number {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

/**
 * Detects consecutive active weeks.
 * Triggers when there are ≥ 3 consecutive ISO weeks, each with ≥ 2 sessions.
 * Returns the count of consecutive active weeks (up to and including the current week).
 */
export function consecutiveWeeksDetector(ctx: DetectorContext): HighlightMetric[] {
	const { sessions, today, debugLog } = ctx;

	if (sessions.length === 0) {
		debugLog?.(`[consecutive-weeks] ❌ NULL — aucune séance enregistrée`);
		return [];
	}

	// Count sessions per week key
	const sessionsPerWeek = new Map<string, number>();
	for (const s of sessions) {
		const key = getMondayKey(s.date);
		sessionsPerWeek.set(key, (sessionsPerWeek.get(key) ?? 0) + 1);
	}

	// Walk backwards from current week, counting consecutive weeks with ≥ 2 sessions
	const currentWeekMonday = getMondayTime(today);
	let consecutiveCount = 0;
	let weekCursor = currentWeekMonday;

	while (true) {
		const d = new Date(weekCursor);
		const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
		const count = sessionsPerWeek.get(key) ?? 0;
		if (count < 2) break;
		consecutiveCount++;
		weekCursor -= 7 * 24 * 60 * 60 * 1000;
	}

	// Log sessions per week for diagnosis
	if (debugLog) {
		const sortedWeeks = [...sessionsPerWeek.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
		debugLog(`[consecutive-weeks] Séances par semaine (8 dernières) : ${sortedWeeks.map(([k, v]) => `${k}=${v}`).join(", ")}`);
		debugLog(`[consecutive-weeks] Semaines consécutives avec ≥ 2 séances : ${consecutiveCount}`);
	}

	if (consecutiveCount < 3) {
		debugLog?.(`[consecutive-weeks] ❌ NULL — ${consecutiveCount} semaine(s) consécutive(s) < 3 requises (chaque semaine doit avoir ≥ 2 séances)`);
		return [];
	}

	debugLog?.(`[consecutive-weeks] ✅ DÉCLENCHÉ — ${consecutiveCount} semaines consécutives`);
	return [{
		id: "consecutive-weeks",
		category: "regularity",
		impactScore: consecutiveCount,
		payload: { weeks: consecutiveCount },
	}];
}

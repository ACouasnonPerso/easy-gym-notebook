import { DetectorContext, HighlightMetric } from "../highlight-metric.model";

/**
 * Detects a 7-day session streak.
 * Triggers when there are ≥ 4 sessions in any rolling 7-day window ending today or earlier this week.
 * Returns the highest count found.
 */
export function sevenDayStreakDetector(ctx: DetectorContext): HighlightMetric[] {
	const { sessions, today, debugLog } = ctx;

	if (sessions.length === 0) {
		debugLog?.(`[seven-day-streak] ❌ NULL — aucune séance enregistrée`);
		return [];
	}

	// Build unique day keys for all sessions
	const sessionDayTimestamps = sessions.map((s) => {
		const d = new Date(s.date);
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	});

	// Find the Monday of the current week
	const currentMonday = new Date(today);
	const day = currentMonday.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	currentMonday.setDate(currentMonday.getDate() + diff);
	currentMonday.setHours(0, 0, 0, 0);

	const todayNormalized = new Date(today);
	todayNormalized.setHours(0, 0, 0, 0);

	// Check each day from currentMonday to today as the end of a 7-day window
	let maxSessionsIn7Days = 0;

	const cursor = new Date(currentMonday);
	while (cursor <= todayNormalized) {
		const windowEnd = cursor.getTime();
		const windowStart = windowEnd - 6 * 24 * 60 * 60 * 1000;

		const count = sessionDayTimestamps.filter((t) => t >= windowStart && t <= windowEnd).length;
		if (count > maxSessionsIn7Days) maxSessionsIn7Days = count;

		cursor.setDate(cursor.getDate() + 1);
	}

	debugLog?.(`[seven-day-streak] Max séances dans une fenêtre glissante de 7j (semaine courante) : ${maxSessionsIn7Days}`);

	if (maxSessionsIn7Days < 4) {
		debugLog?.(`[seven-day-streak] ❌ NULL — ${maxSessionsIn7Days} séances < 4 requises sur 7 jours (fenêtre limitée à la semaine courante lundi→aujourd'hui)`);
		return [];
	}

	debugLog?.(`[seven-day-streak] ✅ DÉCLENCHÉ — ${maxSessionsIn7Days} séances en 7 jours`);
	return [{
		id: "seven-day-streak",
		category: "regularity",
		impactScore: maxSessionsIn7Days,
		payload: { sessionCount: maxSessionsIn7Days },
	}];
}

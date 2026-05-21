import { Injectable, inject } from "@angular/core";
import { computed } from "@angular/core";
import { StatsService } from "./stats.service";
import { Session, Exercise } from "../shared/models";

export interface FavoriteExercisesConfig {
	sessions: Session[];
	exercises: Exercise[];
	today: Date;
}

/**
 * Returns the bonus multiplier for a given rank (1-based).
 * Rank 1 → 0.30, rank 2–3 → 0.15, rank 4–10 → 0.05, beyond → 0.
 */
function bonusForRank(rank: number): number {
	if (rank === 1) return 0.3;
	if (rank <= 3) return 0.15;
	if (rank <= 10) return 0.05;
	return 0;
}

/**
 * Computes top-10 exercise frequency over the last 90 days and returns
 * a Map<exerciseName, bonusMultiplier> (e.g. 0.30 for rank 1).
 */
export function computeFavoriteBonuses(sessions: Session[], exercises: Exercise[], today: Date): Map<string, number> {
	const ninetyDaysAgo = new Date(today);
	ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

	const recentSessionIds = new Set(
		sessions.filter((s) => {
			const d = new Date(s.date);
			d.setHours(0, 0, 0, 0);
			return d >= ninetyDaysAgo;
		}).map((s) => s.id)
	);

	const frequencyMap = new Map<string, number>();
	for (const ex of exercises) {
		if (!recentSessionIds.has(ex.sessionId)) continue;
		frequencyMap.set(ex.name, (frequencyMap.get(ex.name) ?? 0) + 1);
	}

	if (frequencyMap.size === 0) return new Map();

	// Sort by frequency desc, break ties alphabetically
	const sorted = Array.from(frequencyMap.entries()).sort((a, b) => {
		if (b[1] !== a[1]) return b[1] - a[1];
		return a[0].localeCompare(b[0]);
	});

	const bonuses = new Map<string, number>();
	for (let i = 0; i < sorted.length; i++) {
		const rank = i + 1;
		const bonus = bonusForRank(rank);
		if (bonus > 0) {
			bonuses.set(sorted[i][0], bonus);
		}
	}

	return bonuses;
}

@Injectable({ providedIn: "root" })
export class FavoriteExercisesService {
	private readonly statsService = inject(StatsService);

	readonly favoriteBonuses = computed(() =>
		computeFavoriteBonuses(this.statsService._allSessions(), this.statsService._allExercises(), new Date())
	);

	favoriteBonus(exerciseName: string): number {
		return this.favoriteBonuses().get(exerciseName) ?? 0;
	}
}

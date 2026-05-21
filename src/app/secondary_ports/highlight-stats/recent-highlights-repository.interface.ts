import { InjectionToken } from "@angular/core";

export interface RecentHighlightEntry {
	id: string;
	exerciseName?: string;
}

export interface RecentHighlightsRepository {
	getRecent(): RecentHighlightEntry[];
	pushRecent(entries: RecentHighlightEntry[]): void;
}

export const RECENT_HIGHLIGHTS_REPOSITORY = new InjectionToken<RecentHighlightsRepository>(
	"RECENT_HIGHLIGHTS_REPOSITORY",
);

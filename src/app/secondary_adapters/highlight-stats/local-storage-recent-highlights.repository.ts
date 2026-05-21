import { Injectable } from "@angular/core";
import {
	RecentHighlightEntry,
	RecentHighlightsRepository,
} from "../../secondary_ports/highlight-stats/recent-highlights-repository.interface";

const STORAGE_KEY = "highlight_stats_recent_highlights";
const BUFFER_SIZE = 6;

@Injectable({ providedIn: "root" })
export class LocalStorageRecentHighlightsRepository implements RecentHighlightsRepository {
	getRecent(): RecentHighlightEntry[] {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return [];
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(entry): entry is RecentHighlightEntry =>
					typeof entry === "object" && entry !== null && typeof entry.id === "string",
			);
		} catch {
			return [];
		}
	}

	pushRecent(entries: RecentHighlightEntry[]): void {
		if (entries.length === 0) return;
		const current = this.getRecent();
		const updated = [...current, ...entries].slice(-BUFFER_SIZE);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch {
			// storage full or unavailable — silently ignore
		}
	}
}

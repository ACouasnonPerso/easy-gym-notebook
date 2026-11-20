import { Injectable } from "@angular/core";
import { IWatchActionLogRepository } from "./watch.gateway.interface";

const STORAGE_KEY = "egn_watch_applied_actions";
const MAX_IDS = 200;

@Injectable()
export class WatchActionLogRepository implements IWatchActionLogRepository {
	getAppliedIds(): string[] {
		try {
			const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
			return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
		} catch {
			return [];
		}
	}

	markApplied(ids: string[]): void {
		if (ids.length === 0) return;
		const existing = this.getAppliedIds();
		const merged = [...existing, ...ids.filter((id) => !existing.includes(id))];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(-MAX_IDS)));
	}
}

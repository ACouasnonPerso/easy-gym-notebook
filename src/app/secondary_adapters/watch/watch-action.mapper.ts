import { Injectable } from "@angular/core";
import { WatchAction } from "../../core_logic/watch/watch.models";

/** Validates the untyped JSON received from the watch and turns it into a domain action. */
@Injectable({ providedIn: "root" })
export class WatchActionMapper {
	fromJson(raw: string): WatchAction | null {
		let data: unknown;
		try {
			data = JSON.parse(raw);
		} catch {
			return null;
		}
		if (!data || typeof data !== "object") return null;
		const obj = data as Record<string, unknown>;
		const { id, type, sessionId, exerciseId, at } = obj;
		if (!isNonEmptyString(id) || !isNonEmptyString(sessionId) || !isNonEmptyString(exerciseId)) return null;
		const timestamp = typeof at === "string" ? at : new Date().toISOString();

		if (type === "validate") {
			return { id, type, sessionId, exerciseId, at: timestamp };
		}
		if (type === "rate") {
			const rating = obj["rating"];
			if (rating !== null && typeof rating !== "number") return null;
			return { id, type, sessionId, exerciseId, rating, at: timestamp };
		}
		return null;
	}
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

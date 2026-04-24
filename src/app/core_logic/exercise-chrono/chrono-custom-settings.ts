export interface ChronoCustomSettings {
	breakDuration: number; // seconds, >= 1
	repetitions: number | null; // null = infinite
	totalSets: number | null; // null = infinite
}

const STORAGE_KEY = "egn_chrono_custom_settings";

export function defaultCustomSettings(breakDuration: number): ChronoCustomSettings {
	return { breakDuration, repetitions: null, totalSets: null };
}

export function loadCustomSettings(): ChronoCustomSettings | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as ChronoCustomSettings;
	} catch {
		return null;
	}
}

export function saveCustomSettings(s: ChronoCustomSettings): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

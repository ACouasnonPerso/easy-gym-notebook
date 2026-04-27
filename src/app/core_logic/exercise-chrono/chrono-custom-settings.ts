export interface ChronoCustomSettings {
	exerciseDuration: number | null;
	breakDuration: number | null;
	repetitions: number | null;
}

const STORAGE_KEY = "egn_chrono_custom_settings";

export function defaultCustomSettings(seed: number | null | undefined): ChronoCustomSettings {
	return {
		exerciseDuration: null,
		breakDuration: seed ?? 60,
		repetitions: null,
	};
}

export function saveCustomSettings(settings: ChronoCustomSettings): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function loadCustomSettings(): ChronoCustomSettings | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
		if (!("exerciseDuration" in parsed) || !("breakDuration" in parsed) || !("repetitions" in parsed)) return null;
		return parsed as ChronoCustomSettings;
	} catch {
		return null;
	}
}

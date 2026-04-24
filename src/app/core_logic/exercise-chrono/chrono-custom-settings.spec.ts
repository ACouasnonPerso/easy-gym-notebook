import { defaultCustomSettings, loadCustomSettings, saveCustomSettings } from "./chrono-custom-settings";
import type { ChronoCustomSettings } from "./chrono-custom-settings";

describe("ChronoCustomSettings helpers", () => {
	beforeEach(() => localStorage.clear());

	describe("defaultCustomSettings()", () => {
		it("returns breakDuration=60, repetitions=null, totalSets=null for breakDuration=60", () => {
			const s = defaultCustomSettings(60);
			expect(s).toEqual({ breakDuration: 60, repetitions: null, totalSets: null });
		});

		it("returns breakDuration=90 when called with 90", () => {
			const s = defaultCustomSettings(90);
			expect(s).toEqual({ breakDuration: 90, repetitions: null, totalSets: null });
		});
	});

	describe("loadCustomSettings()", () => {
		it("returns null when localStorage is empty", () => {
			expect(loadCustomSettings()).toBeNull();
		});

		it("returns parsed object when valid JSON stored", () => {
			const settings: ChronoCustomSettings = { breakDuration: 45, repetitions: 3, totalSets: 4 };
			localStorage.setItem("egn_chrono_custom_settings", JSON.stringify(settings));
			expect(loadCustomSettings()).toEqual(settings);
		});

		it("returns null when JSON is malformed", () => {
			localStorage.setItem("egn_chrono_custom_settings", "not-json{{{");
			expect(loadCustomSettings()).toBeNull();
		});
	});

	describe("saveCustomSettings()", () => {
		it("writes JSON-serialized settings to egn_chrono_custom_settings", () => {
			const settings: ChronoCustomSettings = { breakDuration: 30, repetitions: null, totalSets: 2 };
			saveCustomSettings(settings);
			const raw = localStorage.getItem("egn_chrono_custom_settings");
			expect(raw).not.toBeNull();
			expect(JSON.parse(raw!)).toEqual(settings);
		});
	});

	describe("round-trip", () => {
		it("saveCustomSettings then loadCustomSettings returns same object", () => {
			const settings: ChronoCustomSettings = { breakDuration: 120, repetitions: 5, totalSets: null };
			saveCustomSettings(settings);
			expect(loadCustomSettings()).toEqual(settings);
		});
	});
});

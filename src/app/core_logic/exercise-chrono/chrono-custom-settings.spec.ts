import { defaultCustomSettings, loadCustomSettings, saveCustomSettings } from "./chrono-custom-settings";

describe("chrono-custom-settings helpers", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("defaultCustomSettings()", () => {
		it("returns exerciseDuration null, breakDuration 60, repetitions null when called with undefined", () => {
			const result = defaultCustomSettings(undefined);
			expect(result).toEqual({ exerciseDuration: null, breakDuration: 60, repetitions: null });
		});

		it("returns breakDuration equal to the seed when seed is provided", () => {
			const result = defaultCustomSettings(90);
			expect(result).toEqual({ exerciseDuration: null, breakDuration: 90, repetitions: null });
		});

		it("returns breakDuration 60 when seed is null", () => {
			const result = defaultCustomSettings(null);
			expect(result).toEqual({ exerciseDuration: null, breakDuration: 60, repetitions: null });
		});
	});

	describe("saveCustomSettings()", () => {
		it("writes serialized ChronoCustomSettings to egn_chrono_custom_settings in localStorage", () => {
			const settings = { exerciseDuration: 30, breakDuration: 60, repetitions: 3 };
			saveCustomSettings(settings);
			const raw = localStorage.getItem("egn_chrono_custom_settings");
			expect(raw).not.toBeNull();
			expect(JSON.parse(raw!)).toEqual(settings);
		});

		it("writes settings with null values correctly", () => {
			const settings = { exerciseDuration: null, breakDuration: null, repetitions: null };
			saveCustomSettings(settings);
			const raw = localStorage.getItem("egn_chrono_custom_settings");
			expect(JSON.parse(raw!)).toEqual(settings);
		});
	});

	describe("loadCustomSettings()", () => {
		it("returns the parsed ChronoCustomSettings when key is present and valid", () => {
			const settings = { exerciseDuration: 45, breakDuration: 30, repetitions: 5 };
			localStorage.setItem("egn_chrono_custom_settings", JSON.stringify(settings));
			expect(loadCustomSettings()).toEqual(settings);
		});

		it("returns null when key is absent from localStorage", () => {
			expect(loadCustomSettings()).toBeNull();
		});

		it("returns null when stored value is malformed JSON", () => {
			localStorage.setItem("egn_chrono_custom_settings", "{not valid json}");
			expect(loadCustomSettings()).toBeNull();
		});

		it("returns null when stored value is not a valid ChronoCustomSettings object", () => {
			localStorage.setItem("egn_chrono_custom_settings", '"just a string"');
			expect(loadCustomSettings()).toBeNull();
		});
	});
});

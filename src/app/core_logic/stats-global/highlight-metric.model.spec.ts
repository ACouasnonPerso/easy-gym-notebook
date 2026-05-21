import {
	HighlightCategory,
	HighlightMetric,
	HighlightViewModel,
	DetectorContext,
	Detector,
} from "./highlight-metric.model";
import { Session, Exercise } from "../shared/models";

describe("HighlightMetric model types", () => {
	it("should allow HighlightCategory to be perf or regularity", () => {
		const perf: HighlightCategory = "perf";
		const regularity: HighlightCategory = "regularity";
		expect(perf).toBe("perf");
		expect(regularity).toBe("regularity");
	});

	it("should allow constructing a valid HighlightMetric", () => {
		const metric: HighlightMetric = {
			id: "weight-pr",
			category: "perf",
			impactScore: 42,
			exerciseName: "Squat",
			payload: { weightKg: 100, gainKg: 5 },
		};
		expect(metric.category).toBe("perf");
		expect(metric.impactScore).toBe(42);
	});

	it("should allow a regularity HighlightMetric without exerciseName", () => {
		const metric: HighlightMetric = {
			id: "consecutive-weeks",
			category: "regularity",
			impactScore: 10,
			payload: { weeks: 4 },
		};
		expect(metric.exerciseName).toBeUndefined();
	});

	it("should allow constructing a valid HighlightViewModel", () => {
		const vm: HighlightViewModel = {
			id: "weight-pr",
			category: "perf",
			labelKey: "statsGlobal.highlights.weightPr",
			value: "100 kg",
			subValue: "+5 kg",
			exerciseName: "Squat",
			icon: "🥳",
		};
		expect(vm.labelKey).toBe("statsGlobal.highlights.weightPr");
	});

	it("should allow a placeholder detector to consume the DetectorContext and return []", () => {
		const placeholderDetector: Detector = (_ctx: DetectorContext) => [];

		const sessions: Session[] = [];
		const exercises: Exercise[] = [];
		const ctx: DetectorContext = {
			sessions,
			exercises,
			today: new Date(),
			favoriteBonus: (_name: string) => 0,
		};

		const result = placeholderDetector(ctx);
		expect(result).toEqual([]);
	});

	it("should expose sessions, exercises, today and favoriteBonus on DetectorContext", () => {
		const today = new Date(2024, 0, 15);
		const ctx: DetectorContext = {
			sessions: [],
			exercises: [],
			today,
			favoriteBonus: () => 0.3,
		};
		expect(ctx.today).toBe(today);
		expect(ctx.favoriteBonus("any")).toBe(0.3);
	});
});

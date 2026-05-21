import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay } from "./regression-overlay";

function makePoints(count: number, baseX = 40, stepX = 48): Array<{ x: number; y: number }> {
	return Array.from({ length: count }, (_, i) => ({ x: baseX + i * stepX, y: 50 + i * 2 }));
}

describe("computeRegressionOverlay", () => {
	describe("when service returns null", () => {
		it("T1: returns visible false for empty chartPoints (real service, empty array)", () => {
			const service = new LinearRegressionService();
			const result = computeRegressionOverlay([], service);
			expect(result.visible).toBeFalse();
		});

		it("T2: returns visible false for 5 chartPoints (real LinearRegressionService returns null for n<6)", () => {
			const service = new LinearRegressionService();
			const result = computeRegressionOverlay(makePoints(5), service);
			expect(result.visible).toBeFalse();
		});

		it("T3: returns visible false when jasmine spy returns null despite 6 points", () => {
			const service = new LinearRegressionService();
			spyOn(service, "compute").and.returnValue(null);
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.visible).toBeFalse();
		});
	});

	describe("when service returns valid result", () => {
		const RESULT = { slope: 0.2, intercept: 30, startY: 40, endY: 60, percent: 20 };
		let service: LinearRegressionService;

		beforeEach(() => {
			service = new LinearRegressionService();
			spyOn(service, "compute").and.returnValue(RESULT);
		});

		it("T4: returns visible true for 6 points", () => {
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.visible).toBeTrue();
		});

		it("T5: x1 equals chartPoints first element x", () => {
			const points = makePoints(6, 40, 48);
			const result = computeRegressionOverlay(points, service);
			expect(result.x1).toBe(40);
		});

		it("T6: x2 equals chartPoints last element x", () => {
			const points = makePoints(6, 40, 48);
			const result = computeRegressionOverlay(points, service);
			expect(result.x2).toBe(280);
		});

		it("T7: y1 equals startY when startY is within 20..110 (startY=40 gives y1=40)", () => {
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.y1).toBe(40);
		});

		it("T8: y2 equals endY when endY is within 20..110 (endY=60 gives y2=60)", () => {
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.y2).toBe(60);
		});

		it("T9: labelX equals x2 + 4", () => {
			const points = makePoints(6, 40, 48);
			const result = computeRegressionOverlay(points, service);
			expect(result.labelX).toBe(284);
		});

		it("T10: labelY equals y2 when y2 is in range 22..108", () => {
			const result = computeRegressionOverlay(makePoints(6), service);
			// y2=60 is within 22..108
			expect(result.labelY).toBe(60);
		});
	});

	describe("y-coordinate clamping", () => {
		let service: LinearRegressionService;

		beforeEach(() => {
			service = new LinearRegressionService();
		});

		it("T11: y1 clamped to 20 when startY < 20, clamped to 110 when startY > 110", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 5, endY: 60, percent: 20 });
			const r1 = computeRegressionOverlay(makePoints(6), service);
			expect(r1.y1).toBe(20);

			(service.compute as jasmine.Spy).and.returnValue({ slope: 0, intercept: 0, startY: 120, endY: 60, percent: 20 });
			const r2 = computeRegressionOverlay(makePoints(6), service);
			expect(r2.y1).toBe(110);
		});

		it("T12: y2 clamped to 20 when endY < 20, clamped to 110 when endY > 110", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 10, percent: 20 });
			const r1 = computeRegressionOverlay(makePoints(6), service);
			expect(r1.y2).toBe(20);

			(service.compute as jasmine.Spy).and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 120, percent: 20 });
			const r2 = computeRegressionOverlay(makePoints(6), service);
			expect(r2.y2).toBe(110);
		});

		it("T13: labelY clamped to 22 when y2 is 20 (endY was clamped below 22)", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 10, percent: 20 });
			const result = computeRegressionOverlay(makePoints(6), service);
			// y2 = clamp(10, 20, 110) = 20; labelY = clamp(20, 22, 108) = 22
			expect(result.labelY).toBe(22);
		});

		it("T14: labelY clamped to 108 when y2 is 110 (endY was clamped above 108)", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 120, percent: 20 });
			const result = computeRegressionOverlay(makePoints(6), service);
			// y2 = clamp(120, 20, 110) = 110; labelY = clamp(110, 22, 108) = 108
			expect(result.labelY).toBe(108);
		});
	});

	describe("sign correctness with SVG-inverted Y coordinates", () => {
		// SVG Y formula: svgY(v) = 20 + 90 - ((v - min) / (max - min)) * 90
		// For weights [100,95,90,85,80,75,70,65]: min=65, max=100
		// A falling real-world value yields a rising SVG Y → without domain values, percent would be positive
		function makeSvgPointsFromWeights(weights: number[]): Array<{ x: number; y: number }> {
			const min = Math.min(...weights);
			const max = Math.max(...weights);
			return weights.map((v, i) => ({
				x: 40 + i * 48,
				y: max === min ? 20 + 90 / 2 : 20 + 90 - ((v - min) / (max - min)) * 90,
			}));
		}

		it("T19: should produce a negative label when real-world values are decreasing", () => {
			const service = new LinearRegressionService();
			const weights = [100, 95, 90, 85, 80, 75, 70, 65];
			const svgPoints = makeSvgPointsFromWeights(weights);
			const result = computeRegressionOverlay(svgPoints, service, weights);
			expect(result.labelText).toMatch(/^-/);
		});

		it("T20: should produce a positive label when real-world values are increasing", () => {
			const service = new LinearRegressionService();
			const weights = [65, 70, 75, 80, 85, 90, 95, 100];
			const svgPoints = makeSvgPointsFromWeights(weights);
			const result = computeRegressionOverlay(svgPoints, service, weights);
			expect(result.labelText).toMatch(/^\+/);
		});
	});

	describe("labelText formatting", () => {
		let service: LinearRegressionService;

		beforeEach(() => {
			service = new LinearRegressionService();
		});

		it("T15: labelText is '+23%' when percent is 23 (>=5)", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 60, percent: 23 });
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.labelText).toBe("+23%");
		});

		it("T16: labelText is '-15%' when percent is -15 (<=-5)", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 60, percent: -15 });
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.labelText).toBe("-15%");
		});

		it("T17: labelText is empty string when percent is 4 (|percent|<5)", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 60, percent: 4 });
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.labelText).toBe("");
		});

		it("T18: labelText is empty string when percent is null", () => {
			spyOn(service, "compute").and.returnValue({ slope: 0, intercept: 0, startY: 40, endY: 60, percent: null });
			const result = computeRegressionOverlay(makePoints(6), service);
			expect(result.labelText).toBe("");
		});
	});
});

import { TestBed } from "@angular/core/testing";
import { LinearRegressionService } from "./linear-regression.service";

describe("LinearRegressionService", () => {
  let service: LinearRegressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinearRegressionService);
  });

  describe("compute — invalid / too-short input", () => {
    it("should return null when points array is empty", () => {
      expect(service.compute([])).toBeNull();
    });

    it("should return null when points array has 1 point", () => {
      expect(service.compute([{ x: 0, y: 1 }])).toBeNull();
    });

    it("should return null when points array has 3 points (boundary: n < 4)", () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 3 },
      ];
      expect(service.compute(points)).toBeNull();
    });

    it("should return a result when points array has exactly 4 points (boundary: n === 4)", () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 4 },
      ];
      expect(service.compute(points)).not.toBeNull();
    });
  });

  describe("compute — result shape", () => {
    it("should return an object with slope, intercept, startY, endY, percent", () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 5 },
        { x: 5, y: 6 },
      ];
      const result = service.compute(points);
      expect(result).not.toBeNull();
      expect(result).toEqual(
        jasmine.objectContaining({
          slope: jasmine.any(Number),
          intercept: jasmine.any(Number),
          startY: jasmine.any(Number),
          endY: jasmine.any(Number),
        })
      );
      expect("percent" in result!).toBeTrue();
    });
  });

  describe("compute — flat input (all y equal)", () => {
    const flatPoints = [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ];

    it("should return slope 0 when all y values are equal", () => {
      expect(service.compute(flatPoints)!.slope).toBe(0);
    });

    it("should return intercept equal to the constant y value when all y are equal", () => {
      expect(service.compute(flatPoints)!.intercept).toBe(5);
    });

    it("should return percent 0 when startY equals endY and startY > 0", () => {
      expect(service.compute(flatPoints)!.percent).toBe(0);
    });
  });

  describe("compute — least-squares regression", () => {
    const perfectLinear = [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 6 },
    ];

    it("should compute the correct slope for a perfect linear sequence", () => {
      expect(service.compute(perfectLinear)!.slope).toBeCloseTo(1, 10);
    });

    it("should compute the correct intercept for a perfect linear sequence", () => {
      expect(service.compute(perfectLinear)!.intercept).toBeCloseTo(1, 10);
    });

    it("should compute startY as slope * x[0] + intercept", () => {
      const result = service.compute(perfectLinear)!;
      const expected = result.slope * perfectLinear[0].x + result.intercept;
      expect(result.startY).toBeCloseTo(expected, 10);
    });

    it("should compute endY as slope * x[n-1] + intercept", () => {
      const result = service.compute(perfectLinear)!;
      const last = perfectLinear[perfectLinear.length - 1];
      const expected = result.slope * last.x + result.intercept;
      expect(result.endY).toBeCloseTo(expected, 10);
    });

    it("should compute slope and intercept correctly for a non-trivial dataset (y=[2,3,2,4,3,5])", () => {
      const points = [
        { x: 0, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
        { x: 5, y: 5 },
      ];
      // n=6, sumX=15, sumY=19, sumXY=0*2+1*3+2*2+3*4+4*3+5*5=0+3+4+12+12+25=56
      // sumX2=0+1+4+9+16+25=55
      // slope = (6*56 - 15*19) / (6*55 - 15^2) = (336-285)/(330-225) = 51/105 ≈ 0.4857
      // intercept = (19 - 0.4857*15) / 6 = (19 - 7.2857) / 6 ≈ 1.952
      const result = service.compute(points)!;
      expect(result.slope).toBeCloseTo(51 / 105, 5);
      expect(result.intercept).toBeCloseTo((19 - (51 / 105) * 15) / 6, 5);
    });
  });

  describe("compute — sign of percent for monotonic series", () => {
    it("should return a negative percent for a steadily decreasing series", () => {
      const points = [
        { x: 0, y: 100 },
        { x: 1, y: 95 },
        { x: 2, y: 90 },
        { x: 3, y: 85 },
        { x: 4, y: 80 },
        { x: 5, y: 75 },
      ];
      const result = service.compute(points)!;
      expect(result.percent).not.toBeNull();
      expect(result.percent!).toBeLessThan(0);
    });
  });

  describe("compute — percent calculation", () => {
    it("should return percent as integer rounded from (endY - startY) / startY * 100 when startY > 0", () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 5 },
        { x: 5, y: 6 },
      ];
      const result = service.compute(points)!;
      // startY=1, endY=6, percent=(6-1)/1*100=500
      expect(result.percent).toBe(500);
    });

    it("should round percent to the nearest integer (not truncate)", () => {
      // Build points that yield a non-integer percent that rounds up
      // Use non-trivial dataset y=[2,3,2,4,3,5]
      // slope≈0.4857, intercept≈1.952
      // startY = 0.4857*0 + 1.952 = 1.952
      // endY = 0.4857*5 + 1.952 = 2.4286 + 1.952 = 4.3806
      // percent = (4.3806 - 1.952) / 1.952 * 100 ≈ 124.4...
      const points = [
        { x: 0, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 4 },
        { x: 4, y: 3 },
        { x: 5, y: 5 },
      ];
      const result = service.compute(points)!;
      const rawPercent =
        ((result.endY - result.startY) / result.startY) * 100;
      expect(result.percent).toBe(Math.round(rawPercent));
    });

    it("should return percent = null when startY is 0", () => {
      // intercept=0 and slope>0 requires startY at x=0 to be 0
      // y = [0,1,2,3,4,5], slope=1, intercept=0
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 5 },
      ];
      expect(service.compute(points)!.percent).toBeNull();
    });

    it("should return percent = null when startY is negative", () => {
      // y = [-2,-1,0,1,2,3], slope=1, intercept=-2, startY=-2
      const points = [
        { x: 0, y: -2 },
        { x: 1, y: -1 },
        { x: 2, y: 0 },
        { x: 3, y: 1 },
        { x: 4, y: 2 },
        { x: 5, y: 3 },
      ];
      expect(service.compute(points)!.percent).toBeNull();
    });

    it("should return percent = null when startY is exactly 0 even if endY > 0", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 5 },
      ];
      const result = service.compute(points)!;
      expect(result.startY).toBeCloseTo(0, 10);
      expect(result.percent).toBeNull();
    });
  });
});

import { Injectable } from "@angular/core";

export interface RegressionResult {
  slope: number;
  intercept: number;
  startY: number;
  endY: number;
  percent: number | null;
}

@Injectable({ providedIn: "root" })
export class LinearRegressionService {
  compute(
    points: { x: number; y: number }[]
  ): RegressionResult | null {
    const n = points.length;
    if (n < 2) return null;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
    }

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const startY = slope * points[0].x + intercept;
    const endY = slope * points[n - 1].x + intercept;

    const percent =
      startY > 0 ? Math.round(((endY - startY) / startY) * 100) : null;

    return { slope, intercept, startY, endY, percent };
  }
}

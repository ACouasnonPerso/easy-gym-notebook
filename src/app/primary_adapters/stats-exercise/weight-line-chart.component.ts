import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { getXAxisLabel } from "./x-axis-label";
import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay, RegressionOverlay } from "./regression-overlay";

function smoothPath(points: { x: number; y: number }[]): string {
	if (points.length < 2) return "";
	const s = 0.2;
	let d = `M ${points[0].x},${points[0].y}`;
	for (let i = 1; i < points.length; i++) {
		const p0 = points[Math.max(0, i - 2)];
		const p1 = points[i - 1];
		const p2 = points[i];
		const p3 = points[Math.min(points.length - 1, i + 1)];
		const cp1x = p1.x + (p2.x - p0.x) * s;
		const cp1y = p1.y + (p2.y - p0.y) * s;
		const cp2x = p2.x - (p3.x - p1.x) * s;
		const cp2y = p2.y - (p3.y - p1.y) * s;
		d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
	}
	return d;
}

@Component({
	selector: "app-weight-line-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./weight-line-chart.component.html",
	styleUrl: "./weight-line-chart.component.scss",
})
export class WeightLineChartComponent {
	private readonly regressionService = inject(LinearRegressionService);
	readonly occurrences = input<ExerciseOccurrence[]>([]);
	readonly groupBy = input<GroupBy>('session');

	readonly chartData = computed(() => {
		const data = [...this.occurrences()];
		if (data.length === 0) return null;

		const n = data.length;
		const weights = data.map((o) => o.weightKg);

		const minW = Math.min(...weights),
			maxW = Math.max(...weights);

		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

		const yWeight = (v: number) => {
			if (maxW === minW) return 20 + 90 / 2;
			return 20 + 90 - ((v - minW) / (maxW - minW)) * 90;
		};

		const labelStep = getLabelStep(n);

		const weightPoints = data.map((o, i) => ({
			x: xCoords[i],
			y: yWeight(o.weightKg),
			label: i % labelStep === 0 ? `${parseFloat(o.weightKg.toFixed(2))} kg` : "",
		}));

		const weightPolyline = n > 1 ? smoothPath(weightPoints) : "";

		const weightAreaPoints = n > 1 ? smoothPath(weightPoints) + ` L ${xCoords[n - 1]},110 L ${xCoords[0]},110 Z` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label: i % labelStep === 0 ? getXAxisLabel(o.date, this.groupBy()) : "",
		}));

		return {
			weightPoints,
			weightPolyline,
			weightAreaPoints,
			xLabels,
			minW,
			maxW,
			weights,
		};
	});

	readonly regressionOverlay = computed((): RegressionOverlay => {
		const cd = this.chartData();
		if (cd === null) return { visible: false };
		return computeRegressionOverlay(cd.weightPoints, this.regressionService, cd.weights, this.groupBy());
	});
}

import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { getXAxisLabel } from "./x-axis-label";
import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay, RegressionOverlay } from "./regression-overlay";

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

		const weightPolyline = n > 1 ? weightPoints.map((p) => `${p.x},${p.y}`).join(" ") : "";

		const weightAreaPoints =
			n > 1 ? weightPoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

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
		return computeRegressionOverlay(cd.weightPoints, this.regressionService, cd.weights);
	});
}

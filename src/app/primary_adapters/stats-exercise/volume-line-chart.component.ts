import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { getXAxisLabel } from "./x-axis-label";
import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay, RegressionOverlay } from "./regression-overlay";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";

@Component({
	selector: "app-volume-line-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	providers: [WeightDisplayPipe],
	templateUrl: "./volume-line-chart.component.html",
	styleUrl: "./volume-line-chart.component.scss",
})
export class VolumeLineChartComponent {
	private readonly weightDisplay = inject(WeightDisplayPipe);
	private readonly regressionService = inject(LinearRegressionService);
	readonly occurrences = input<ExerciseOccurrence[]>([]);
	readonly groupBy = input<GroupBy>('session');

	readonly chartData = computed(() => {
		const data = [...this.occurrences()];
		if (data.length === 0) return null;

		const n = data.length;
		const volumes = data.map((o) => o.volumeKg);

		const minV = Math.min(...volumes),
			maxV = Math.max(...volumes);

		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

		const yVolume = (v: number) => {
			if (maxV === minV) return 20 + 90 / 2;
			return 20 + 90 - ((v - minV) / (maxV - minV)) * 90;
		};

		const labelStep = getLabelStep(n);

		const volumePoints = data.map((o, i) => ({
			x: xCoords[i],
			y: yVolume(o.volumeKg),
			label: i % labelStep === 0 ? (this.weightDisplay.transform(o.volumeKg / 1000, "t") ?? "") : "",
		}));

		const volumePolyline = n > 1 ? volumePoints.map((p) => `${p.x},${p.y}`).join(" ") : "";

		const volumeAreaPoints =
			n > 1 ? volumePoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label: i % labelStep === 0 ? getXAxisLabel(o.date, this.groupBy()) : "",
		}));

		return {
			volumePoints,
			volumePolyline,
			volumeAreaPoints,
			xLabels,
			minV,
			maxV,
			volumes,
		};
	});

	readonly regressionOverlay = computed((): RegressionOverlay => {
		const cd = this.chartData();
		if (cd === null) return { visible: false };
		return computeRegressionOverlay(cd.volumePoints, this.regressionService, cd.volumes);
	});
}

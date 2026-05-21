import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { getXAxisLabel } from "./x-axis-label";
import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay, RegressionOverlay } from "./regression-overlay";

@Component({
	selector: "app-cardio-time-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./cardio-time-chart.component.html",
	styleUrl: "./cardio-time-chart.component.scss",
})
export class CardioTimeChartComponent {
	private readonly regressionService = inject(LinearRegressionService);
	readonly occurrences = input<CardioOccurrence[]>([]);
	readonly groupBy = input<GroupBy>('session');

	readonly chartData = computed(() => {
		const data = this.occurrences();
		if (data.length === 0) return null;

		const n = data.length;
		const durations = data.map((o) => Math.floor(o.durationSeconds / 60));

		const minT = Math.min(...durations),
			maxT = Math.max(...durations);
		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

		const yTime = (v: number) => {
			if (maxT === minT) return 20 + 90 / 2;
			return 20 + 90 - ((v - minT) / (maxT - minT)) * 90;
		};

		const labelStep = getLabelStep(n);

		const timePoints = data.map((o, i) => {
			const minutes = Math.floor(o.durationSeconds / 60);
			return {
				x: xCoords[i],
				y: yTime(minutes),
				label: i % labelStep === 0 ? `${minutes}min` : "",
			};
		});

		const timePolyline = n > 1 ? timePoints.map((p) => `${p.x},${p.y}`).join(" ") : "";
		const timeAreaPoints =
			n > 1 ? timePoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label: i % labelStep === 0 ? getXAxisLabel(o.date, this.groupBy()) : "",
		}));

		return { timePoints, timePolyline, timeAreaPoints, xLabels, minT, maxT, durations };
	});

	readonly regressionOverlay = computed((): RegressionOverlay => {
		const cd = this.chartData();
		if (cd === null) return { visible: false };
		return computeRegressionOverlay(cd.timePoints, this.regressionService, cd.durations);
	});
}

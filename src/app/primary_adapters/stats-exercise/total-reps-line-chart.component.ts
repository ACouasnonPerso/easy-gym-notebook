import { Component, ChangeDetectionStrategy, input, computed } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-total-reps-line-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./total-reps-line-chart.component.html",
	styleUrl: "./total-reps-line-chart.component.scss",
})
export class TotalRepsLineChartComponent {
	readonly occurrences = input<ExerciseOccurrence[]>([]);

	readonly chartData = computed(() => {
		const data = [...this.occurrences()].reverse();
		if (data.length === 0) return null;

		const n = data.length;
		const reps = data.map((o) => ((o.totalReps ?? 0) ?? 0));

		const minV = Math.min(...reps),
			maxV = Math.max(...reps);

		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));

		const yReps = (v: number) => {
			if (maxV === minV) return 20 + 90 / 2;
			return 20 + 90 - ((v - minV) / (maxV - minV)) * 90;
		};

		const labelStep = getLabelStep(n);

		const repsPoints = data.map((o, i) => ({
			x: xCoords[i],
			y: yReps((o.totalReps ?? 0)),
			label: i % labelStep === 0 ? String((o.totalReps ?? 0)) : "",
		}));

		const repsPolyline = n > 1 ? repsPoints.map((p) => `${p.x},${p.y}`).join(" ") : "";

		const repsAreaPoints =
			n > 1 ? repsPoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));

		return {
			repsPoints,
			repsPolyline,
			repsAreaPoints,
			xLabels,
			minV,
			maxV,
		};
	});
}

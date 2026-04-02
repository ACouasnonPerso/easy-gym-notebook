import { Component, ChangeDetectionStrategy, input, computed } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-weight-line-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./weight-line-chart.component.html",
	styleUrl: "./weight-line-chart.component.scss",
})
export class WeightLineChartComponent {
	readonly occurrences = input<ExerciseOccurrence[]>([]);

	readonly chartData = computed(() => {
		const data = [...this.occurrences()].reverse();
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
			label: i % labelStep === 0 ? `${o.weightKg} kg` : "",
		}));

		const weightPolyline = n > 1 ? weightPoints.map((p) => `${p.x},${p.y}`).join(" ") : "";

		const weightAreaPoints =
			n > 1 ? weightPoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));

		return {
			weightPoints,
			weightPolyline,
			weightAreaPoints,
			xLabels,
			minW,
			maxW,
		};
	});
}

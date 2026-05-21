import { Component, ChangeDetectionStrategy, input, computed } from "@angular/core";
import { ExerciseOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-volume-line-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./volume-line-chart.component.html",
	styleUrl: "./volume-line-chart.component.scss",
})
export class VolumeLineChartComponent {
	readonly occurrences = input<ExerciseOccurrence[]>([]);

	readonly chartData = computed(() => {
		const data = [...this.occurrences()].reverse();
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
			label: i % labelStep === 0 ? `${parseFloat(o.volumeKg.toFixed(2))} kg` : "",
		}));

		const volumePolyline = n > 1 ? volumePoints.map((p) => `${p.x},${p.y}`).join(" ") : "";

		const volumeAreaPoints =
			n > 1 ? volumePoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";

		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));

		return {
			volumePoints,
			volumePolyline,
			volumeAreaPoints,
			xLabels,
			minV,
			maxV,
		};
	});
}

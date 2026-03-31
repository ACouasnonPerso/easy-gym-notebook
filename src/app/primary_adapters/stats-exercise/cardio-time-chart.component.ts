import { Component, ChangeDetectionStrategy, input, computed } from "@angular/core";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-cardio-time-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./cardio-time-chart.component.html",
	styleUrl: "./cardio-time-chart.component.scss",
})
export class CardioTimeChartComponent {
	readonly occurrences = input<CardioOccurrence[]>([]);

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
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));

		return { timePoints, timePolyline, timeAreaPoints, xLabels, minT, maxT };
	});
}

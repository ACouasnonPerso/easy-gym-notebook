import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";

@Component({
	selector: "app-cardio-speed-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./cardio-speed-chart.component.html",
	styleUrl: "./cardio-speed-chart.component.scss",
})
export class CardioSpeedChartComponent {
	private readonly massUnitService = inject(MassUnitService);
	readonly occurrences = input<CardioOccurrence[]>([]);

	readonly chartData = computed(() => {
		const massUnit = this.massUnitService.activeMassUnit();
		const isMetric = massUnit === "metric";
		const unit = isMetric ? "km/h" : "mph";
		const data = this.occurrences().filter((o) => o.distanceKm !== null && o.distanceKm > 0);
		if (data.length === 0) return null;

		const n = data.length;
		const speeds = data.map((o) => {
			const kmh = ((o.distanceKm as number) / o.durationSeconds) * 3600;
			return isMetric ? kmh : kmh * 0.621371;
		});
		const minS = Math.min(...speeds),
			maxS = Math.max(...speeds);
		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));
		const ySpeed = (v: number) => {
			if (maxS === minS) return 20 + 90 / 2;
			return 20 + 90 - ((v - minS) / (maxS - minS)) * 90;
		};
		const labelStep = getLabelStep(n);
		const speedPoints = data.map((o, i) => ({
			x: xCoords[i],
			y: ySpeed(speeds[i]),
			label: i % labelStep === 0 ? `${Math.round(speeds[i] * 10) / 10} ${unit}` : "",
		}));
		const speedPolyline = n > 1 ? speedPoints.map((p) => `${p.x},${p.y}`).join(" ") : "";
		const speedAreaPoints =
			n > 1 ? speedPoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";
		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));
		return { speedPoints, speedPolyline, speedAreaPoints, xLabels, unit };
	});
}

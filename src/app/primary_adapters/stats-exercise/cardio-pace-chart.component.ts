import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";

function formatPace(secondsPerUnit: number, unit: string): string {
	const total = Math.round(secondsPerUnit);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}/${unit}`;
}

@Component({
	selector: "app-cardio-pace-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./cardio-pace-chart.component.html",
	styleUrl: "./cardio-pace-chart.component.scss",
})
export class CardioPaceChartComponent {
	private readonly massUnitService = inject(MassUnitService);
	readonly occurrences = input<CardioOccurrence[]>([]);

	readonly chartData = computed(() => {
		const massUnit = this.massUnitService.activeMassUnit();
		const isMetric = massUnit === "metric";
		const unit = isMetric ? "km" : "mi";
		const data = this.occurrences().filter((o) => o.distanceKm !== null && o.distanceKm > 0);
		if (data.length === 0) return null;

		const n = data.length;
		const paces = data.map((o) => {
			const distUnit = isMetric ? (o.distanceKm as number) : (o.distanceKm as number) * 0.621371;
			return o.durationSeconds / distUnit;
		});
		const minP = Math.min(...paces),
			maxP = Math.max(...paces);
		const xCoords = data.map((_, i) => 40 + (n === 1 ? 120 : (i / (n - 1)) * 240));
		const yPace = (v: number) => {
			if (maxP === minP) return 20 + 90 / 2;
			return 20 + 90 - ((v - minP) / (maxP - minP)) * 90;
		};
		const labelStep = getLabelStep(n);
		const pacePoints = data.map((o, i) => ({
			x: xCoords[i],
			y: yPace(paces[i]),
			label: i % labelStep === 0 ? formatPace(paces[i], unit) : "",
		}));
		const pacePolyline = n > 1 ? pacePoints.map((p) => `${p.x},${p.y}`).join(" ") : "";
		const paceAreaPoints =
			n > 1 ? pacePoints.map((p) => `${p.x},${p.y}`).join(" ") + ` ${xCoords[n - 1]},110 ${xCoords[0]},110` : "";
		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label:
				i % labelStep === 0
					? `${o.date.getDate().toString().padStart(2, "0")}/${(o.date.getMonth() + 1).toString().padStart(2, "0")}`
					: "",
		}));
		return { pacePoints, pacePolyline, paceAreaPoints, xLabels, unit };
	});
}

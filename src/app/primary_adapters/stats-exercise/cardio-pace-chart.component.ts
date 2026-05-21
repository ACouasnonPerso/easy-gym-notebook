import { Component, ChangeDetectionStrategy, input, computed, inject } from "@angular/core";
import { CardioOccurrence } from "../../core_logic/shared/models";
import { getLabelStep } from "./label-step";
import { TranslateModule } from "@ngx-translate/core";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";
import { GroupBy } from "../../core_logic/stats-exercise/group-by.model";
import { getXAxisLabel } from "./x-axis-label";
import { LinearRegressionService } from "../../core_logic/stats-exercise/linear-regression.service";
import { computeRegressionOverlay, RegressionOverlay } from "./regression-overlay";

function formatPace(secondsPerUnit: number, unit: string): string {
	const total = Math.round(secondsPerUnit);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}/${unit}`;
}

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
	selector: "app-cardio-pace-chart",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./cardio-pace-chart.component.html",
	styleUrl: "./cardio-pace-chart.component.scss",
})
export class CardioPaceChartComponent {
	private readonly massUnitService = inject(MassUnitService);
	private readonly regressionService = inject(LinearRegressionService);
	readonly occurrences = input<CardioOccurrence[]>([]);
	readonly groupBy = input<GroupBy>('session');

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
		const pacePolyline = n > 1 ? smoothPath(pacePoints) : "";
		const paceAreaPoints = n > 1 ? smoothPath(pacePoints) + ` L ${xCoords[n - 1]},110 L ${xCoords[0]},110 Z` : "";
		const xLabels = data.map((o, i) => ({
			x: xCoords[i],
			label: i % labelStep === 0 ? getXAxisLabel(o.date, this.groupBy()) : "",
		}));
		return { pacePoints, pacePolyline, paceAreaPoints, xLabels, unit, paces };
	});

	readonly regressionOverlay = computed((): RegressionOverlay => {
		const cd = this.chartData();
		if (cd === null) return { visible: false };
		return computeRegressionOverlay(cd.pacePoints, this.regressionService, cd.paces, this.groupBy());
	});
}

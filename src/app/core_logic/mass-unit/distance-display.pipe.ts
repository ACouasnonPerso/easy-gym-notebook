import { inject, Pipe, PipeTransform } from "@angular/core";
import { MassUnitService } from "./mass-unit.service";

export type DistanceUnit = "m" | "km";

@Pipe({ name: "distanceDisplay", standalone: true, pure: false })
export class DistanceDisplayPipe implements PipeTransform {
	private readonly massUnitService = inject(MassUnitService);

	transform(value: number | null, unit: DistanceUnit): string {
		if (!value) {
			return "";
		}

		const system = this.massUnitService.activeMassUnit();

		if (system === "metric") {
			return `${value} ${unit}`;
		}

		if (unit === "m") {
			const ft = Math.round(value * 3.28084 * 10) / 10;
			return `${ft} ft`;
		}

		const mi = Math.round(value * 0.621371 * 10) / 10;
		return `${mi} mi`;
	}
}

import { inject, Pipe, PipeTransform } from "@angular/core";
import { MassUnitService } from "./mass-unit.service";

export type WeightUnit = "kg" | "t";

@Pipe({ name: "weightDisplay", standalone: true, pure: false })
export class WeightDisplayPipe implements PipeTransform {
	private readonly massUnitService = inject(MassUnitService);

	transform(value: number | null, unit: WeightUnit): string {
		if (!value) {
			return "";
		}
		const system = this.massUnitService.activeMassUnit();

		if (system === "metric") {
			const rounded = Math.round(value * 100) / 100;
			return `${rounded} ${unit}`;
		}

		if (unit === "kg") {
			const lbs = Math.round(value * 2.20462);
			return `${lbs} lb`;
		}

		if (unit === "t") {
			const divisor = system === "us" ? 0.907185 : 1.01605;
			const symbol = system === "us" ? "st" : "lt";
			const converted = Math.round((value / divisor) * 10) / 10;
			return `${converted} ${symbol}`;
		}

		return "";
	}
}

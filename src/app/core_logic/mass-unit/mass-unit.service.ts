import { Injectable, signal } from "@angular/core";

export type MassUnit = "metric" | "imperial" | "us";

@Injectable({ providedIn: "root" })
export class MassUnitService {
	readonly activeMassUnit = signal<MassUnit>(this.detect());

	setMassUnit(unit: MassUnit): void {
		if (unit === this.activeMassUnit()) return;
		this.activeMassUnit.set(unit);
		localStorage.setItem("massUnit", unit);
	}

	detect(): MassUnit {
		const stored = localStorage.getItem("massUnit") as MassUnit | null;
		if (stored) return stored;

		const locale = navigator.language;
		if (locale === "en-US") return "us";
		if (locale === "en-GB") return "imperial";
		return "metric";
	}
}

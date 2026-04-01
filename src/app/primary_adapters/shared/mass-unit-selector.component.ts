import { Component, ChangeDetectionStrategy, output, inject, signal } from "@angular/core";
import { MassUnitService, MassUnit } from "../../core_logic/mass-unit/mass-unit.service";
import { TranslateModule } from "@ngx-translate/core";

const MASS_UNIT_KEYS: Record<MassUnit, string> = {
	metric: "massUnit.metric",
	imperial: "massUnit.imperial",
	us: "massUnit.us",
};

@Component({
	selector: "app-mass-unit-selector",
	standalone: true,
	imports: [TranslateModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./mass-unit-selector.component.html",
	styleUrl: "./mass-unit-selector.component.css",
})
export class MassUnitSelectorComponent {
	readonly massUnitChange = output<MassUnit>();

	readonly massUnitService = inject(MassUnitService);
	readonly showDropdown = signal(false);

	readonly units: MassUnit[] = ["metric", "imperial", "us"];

	unitKey(unit: MassUnit): string {
		return MASS_UNIT_KEYS[unit];
	}

	select(unit: MassUnit): void {
		this.massUnitService.setMassUnit(unit);
		this.massUnitChange.emit(unit);
		this.showDropdown.set(false);
	}
}

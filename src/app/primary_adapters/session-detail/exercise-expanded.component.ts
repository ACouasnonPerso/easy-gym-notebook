import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Exercise, PyramidSet } from "../../core_logic/shared/models";
import { DrumPickerComponent } from "../shared/drum-picker.component";
import { DecimalInputDirective } from "../shared/decimal-input.directive";
import { generateRange } from "../../core_logic/shared/utils";
import { TranslateModule } from "@ngx-translate/core";
import { MassUnitService } from "../../core_logic/mass-unit/mass-unit.service";

function secondsToMmss(s: number): string {
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function mmssToSeconds(mmss: string): number {
	const [m, s] = mmss.split(":").map(Number);
	return m * 60 + s;
}

const WEIGHT_VALUES = [...generateRange(0, 30, 0.5), ...generateRange(31, 300, 1)];
const WEIGHT_VALUES_LB = generateRange(10, 500, 1);
const SETS_VALUES = generateRange(1, 20, 1);
const REPS_VALUES = generateRange(1, 50, 1);
const BREAK_VALUES = generateRange(0, 600, 5).map(secondsToMmss);
const HOURS_VALUES = generateRange(0, 12, 1);
const MINUTES_VALUES = generateRange(0, 59, 1);
const KM_VALUES: (number | string)[] = [
	"-",
	...generateRange(0.1, 2, 0.1).map((v) => Math.round(v * 10) / 10),
	...generateRange(2.5, 50, 0.5).map((v) => Math.round(v * 10) / 10),
	...generateRange(51, 200, 1),
];

@Component({
	selector: "app-exercise-expanded",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [DrumPickerComponent, FormsModule, TranslateModule, DecimalInputDirective],
	templateUrl: "./exercise-expanded.component.html",
	styleUrl: "./exercise-expanded.component.scss",
})
export class ExerciseExpandedComponent {
	private readonly massUnitService = inject(MassUnitService);
	readonly weightUnit = computed(() => (this.massUnitService.activeMassUnit() === "metric" ? "kg" : "lb"));

	readonly exercise = input.required<Exercise>();
	readonly update = output<Partial<Exercise>>();
	readonly validate = output<void>();
	readonly cancel = output<void>();
	readonly delete = output<void>();
	readonly openChrono = output<void>();
	readonly openStats = output<void>();

	readonly weightValuesForDisplay = computed<(number | string)[]>(() => {
		if (this.massUnitService.activeMassUnit() === "metric") return WEIGHT_VALUES;
		return WEIGHT_VALUES_LB;
	});

	readonly weightSelectedValue = computed<number | string>(() => {
		const kg = this.exercise().weightKg;
		if (this.massUnitService.activeMassUnit() === "metric") return kg;
		return Math.round(kg * 2.20462);
	});

	readonly setsValues = SETS_VALUES;
	readonly repsValues = REPS_VALUES;
	readonly breakValues = BREAK_VALUES;
	readonly hoursValues = HOURS_VALUES;
	readonly minutesValues = MINUTES_VALUES;
	readonly kmValues = KM_VALUES;
	readonly breakSelectedValue = computed(() => secondsToMmss(this.exercise().breakDurationSeconds));
	readonly durationHours = computed(() => Math.floor(this.exercise().durationSeconds / 3600));
	readonly durationMinutes = computed(() => Math.floor((this.exercise().durationSeconds % 3600) / 60));

	readonly isPyramidLocal = computed(() => this.exercise().isPyramid ?? false);
	readonly pyramidSetsLocal = signal<PyramidSet[] | null>(null);
	readonly effectivePyramidSets = computed(() => this.pyramidSetsLocal() ?? this.exercise().pyramidSets ?? []);

	togglePyramid(): void {
		const next = !this.isPyramidLocal();
		if (next && (this.exercise().pyramidSets ?? []).length === 0) {
			const count = this.exercise().sets;
			this.pyramidSetsLocal.set(
				Array.from({ length: count }, () => ({ weightKg: this.exercise().weightKg, reps: this.exercise().reps }))
			);
			this.update.emit({ isPyramid: true, pyramidSets: this.pyramidSetsLocal()! });
		} else {
			this.pyramidSetsLocal.set(null);
			this.update.emit({ isPyramid: next, pyramidSets: next ? this.exercise().pyramidSets : [] });
		}
	}

	addPyramidSet(): void {
		const current = this.effectivePyramidSets();
		const last = current.at(-1);
		const next = [...current, { weightKg: last?.weightKg ?? 30, reps: last?.reps ?? 10 }];
		this.pyramidSetsLocal.set(next);
		this.update.emit({ pyramidSets: next });
	}

	removePyramidSet(index: number): void {
		const next = this.effectivePyramidSets().filter((_, i) => i !== index);
		this.pyramidSetsLocal.set(next);
		this.update.emit({ pyramidSets: next });
	}

	updatePyramidSet(index: number, field: "weightKg" | "reps", value: number): void {
		const next = this.effectivePyramidSets().map((s, i) => (i === index ? { ...s, [field]: value } : s));
		this.pyramidSetsLocal.set(next);
		this.update.emit({ pyramidSets: next });
	}

	emitWeightUpdate(value: number | string): void {
		const displayValue = +value;
		if (this.massUnitService.activeMassUnit() === "metric") {
			this.update.emit({ weightKg: displayValue });
		} else {
			const kg = Math.round((displayValue / 2.20462) * 10) / 10;
			this.update.emit({ weightKg: kg });
		}
	}

	emitBreakUpdate(v: string | number): void {
		this.update.emit({ breakDurationSeconds: mmssToSeconds(String(v)) });
	}

	emitDurationUpdate(part: "hours" | "minutes", value: number): void {
		const current = this.exercise().durationSeconds;
		const h = Math.floor(current / 3600);
		const m = Math.floor((current % 3600) / 60);
		const newSeconds = part === "hours" ? value * 3600 + m * 60 : h * 3600 + value * 60;
		this.update.emit({ durationSeconds: newSeconds });
	}
}

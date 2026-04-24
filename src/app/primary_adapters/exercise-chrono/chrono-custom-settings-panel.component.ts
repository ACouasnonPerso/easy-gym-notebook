import { Component, ChangeDetectionStrategy, input, output, signal, computed } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoCustomSettings } from "../../core_logic/exercise-chrono/chrono-custom-settings";

@Component({
	selector: "app-chrono-custom-settings-panel",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-custom-settings-panel.component.html",
	styleUrl: "./chrono-custom-settings-panel.component.css",
})
export class ChronoCustomSettingsPanelComponent {
	readonly initialSettings = input.required<ChronoCustomSettings>();
	readonly confirmed = output<ChronoCustomSettings>();
	readonly cancelled = output<void>();

	private readonly _breakDurationVal = signal<number | null>(null);
	private readonly _repetitionsVal = signal<number | null | undefined>(undefined);
	private readonly _totalSetsVal = signal<number | null | undefined>(undefined);

	/** Last non-null integer for repetitions (used when toggling back from infinity). */
	private _lastRepetitions = 3;
	/** Last non-null integer for totalSets (used when toggling back from infinity). */
	private _lastTotalSets = 1;

	readonly breakDurationVal = computed(() => this._breakDurationVal() ?? this.initialSettings().breakDuration);

	readonly repetitionsVal = computed<number | null>(() => {
		const v = this._repetitionsVal();
		if (v === undefined) return this.initialSettings().repetitions;
		return v;
	});

	readonly totalSetsVal = computed<number | null>(() => {
		const v = this._totalSetsVal();
		if (v === undefined) return this.initialSettings().totalSets;
		return v;
	});

	readonly repetitionsInfinite = computed(() => this.repetitionsVal() === null);
	readonly totalSetsInfinite = computed(() => this.totalSetsVal() === null);

	onBreakDurationChange(delta: number): void {
		const current = this.breakDurationVal();
		this._breakDurationVal.set(Math.max(1, current + delta));
	}

	onRepetitionsChange(delta: number): void {
		const current = this.repetitionsVal();
		if (current === null) return;
		const next = Math.max(1, current + delta);
		this._lastRepetitions = next;
		this._repetitionsVal.set(next);
	}

	onTotalSetsChange(delta: number): void {
		const current = this.totalSetsVal();
		if (current === null) return;
		const next = Math.max(1, current + delta);
		this._lastTotalSets = next;
		this._totalSetsVal.set(next);
	}

	toggleRepetitionsInfinite(): void {
		const current = this.repetitionsVal();
		if (current === null) {
			this._repetitionsVal.set(this._lastRepetitions);
		} else {
			this._lastRepetitions = current;
			this._repetitionsVal.set(null);
		}
	}

	toggleTotalSetsInfinite(): void {
		const current = this.totalSetsVal();
		if (current === null) {
			this._totalSetsVal.set(this._lastTotalSets);
		} else {
			this._lastTotalSets = current;
			this._totalSetsVal.set(null);
		}
	}

	onConfirm(): void {
		this.confirmed.emit({
			breakDuration: this.breakDurationVal(),
			repetitions: this.repetitionsVal(),
			totalSets: this.totalSetsVal(),
		});
	}
}
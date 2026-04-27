import { Component, input, output, signal, ChangeDetectionStrategy, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoCustomSettings } from "../../core_logic/exercise-chrono/chrono-custom-settings";
import { DrumPickerComponent } from "../shared/drum-picker.component";

const INF = "∞";

@Component({
	selector: "app-chrono-custom-settings-panel",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, DrumPickerComponent],
	templateUrl: "./chrono-custom-settings-panel.component.html",
	styleUrl: "./chrono-custom-settings-panel.component.css",
})
export class ChronoCustomSettingsPanelComponent implements OnInit {
	readonly initialSettings = input.required<ChronoCustomSettings>();
	readonly confirmed = output<ChronoCustomSettings>();
	readonly cancelled = output<void>();

	readonly durationValues: (number | string)[] = [INF, ...Array.from({ length: 60 }, (_, i) => (i + 1) * 5)];
	readonly repValues: (number | string)[] = [INF, ...Array.from({ length: 30 }, (_, i) => i + 1)];

	readonly exerciseDuration = signal<number | string>(INF);
	readonly breakDuration = signal<number | string>(60);
	readonly repetitions = signal<number | string>(INF);

	ngOnInit(): void {
		const s = this.initialSettings();
		this.exerciseDuration.set(s.exerciseDuration === null ? INF : this.snapTo(s.exerciseDuration, this.durationValues));
		this.breakDuration.set(s.breakDuration === null ? INF : this.snapTo(s.breakDuration, this.durationValues));
		this.repetitions.set(s.repetitions === null ? INF : this.snapTo(s.repetitions, this.repValues));
	}

	confirm(): void {
		this.confirmed.emit({
			exerciseDuration: this.exerciseDuration() === INF ? null : (this.exerciseDuration() as number),
			breakDuration: this.breakDuration() === INF ? null : (this.breakDuration() as number),
			repetitions: this.repetitions() === INF ? null : (this.repetitions() as number),
		});
	}

	cancel(): void {
		this.cancelled.emit();
	}

	private snapTo(value: number, arr: (number | string)[]): number {
		const nums = arr.filter((v): v is number => typeof v === "number");
		return nums.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
	}
}

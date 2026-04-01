import { Component, input, output, ChangeDetectionStrategy, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoState } from "../../core_logic/exercise-chrono/exercise-chrono.service";
import { HapticService } from "../../core_logic/shared/haptic.service";

@Component({
	selector: "app-chrono-actions",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-actions.component.html",
	styleUrl: "./chrono-actions.component.css",
})
export class ChronoActionsComponent {
	private readonly haptic = inject(HapticService);

	readonly chronoState = input.required<ChronoState>();

	readonly start = output<void>();
	readonly pause = output<void>();
	readonly resume = output<void>();
	readonly reset = output<void>();
	readonly goBreak = output<void>();
	readonly goTraining = output<void>();
	readonly addTime = output<number>();

	onAddTime(seconds: number): void {
		this.haptic.vibrate();
		this.addTime.emit(seconds);
	}
}

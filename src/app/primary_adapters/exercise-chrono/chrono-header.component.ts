import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { ChronoBackButtonComponent } from "./chrono-back-button.component";
import { ChronoSoundButtonComponent } from "./chrono-sound-button.component";
import { ChronoSeriesBadgeComponent } from "./chrono-series-badge.component";
@Component({
	selector: "app-chrono-header",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ChronoBackButtonComponent, ChronoSoundButtonComponent, ChronoSeriesBadgeComponent],
	templateUrl: "./chrono-header.component.html",
	styleUrl: "./chrono-header.component.css",
})
export class ChronoHeaderComponent {
	readonly hasExercise = input.required<boolean>();
	readonly seriesCount = input.required<number>();
	readonly soundEnabled = input.required<boolean>();

	readonly back = output<void>();
	readonly toggleSound = output<void>();
	readonly incrementSeries = output<void>();
	readonly decrementSeries = output<void>();
	readonly openSettings = output<void>();
}

import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ChronoBackButtonComponent } from "./chrono-back-button.component";
import { ChronoSoundButtonComponent } from "./chrono-sound-button.component";

@Component({
	selector: "app-chrono-header",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule, ChronoBackButtonComponent, ChronoSoundButtonComponent],
	templateUrl: "./chrono-header.component.html",
	styleUrl: "./chrono-header.component.css",
})
export class ChronoHeaderComponent {
	readonly hasExercise = input.required<boolean>();
	readonly seriesCount = input.required<number>();
	readonly formattedBreakDuration = input.required<string>();
	readonly soundEnabled = input.required<boolean>();

	readonly back = output<void>();
	readonly openBreakDurationPopup = output<void>();
	readonly toggleSound = output<void>();
}

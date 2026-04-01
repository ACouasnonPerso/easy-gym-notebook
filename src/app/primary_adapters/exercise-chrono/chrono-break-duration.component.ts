import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-chrono-break-duration",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-break-duration.component.html",
	styleUrl: "./chrono-break-duration.component.css",
})
export class ChronoBreakDurationComponent {
	readonly hasExercise = input.required<boolean>();
	readonly formattedBreakDuration = input.required<string>();

	readonly openBreakDurationPopup = output<void>();
}

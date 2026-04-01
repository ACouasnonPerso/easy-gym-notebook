import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
	selector: "app-chrono-series-badge",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	templateUrl: "./chrono-series-badge.component.html",
	styleUrl: "./chrono-series-badge.component.css",
})
export class ChronoSeriesBadgeComponent {
	readonly hasExercise = input.required<boolean>();
	readonly seriesCount = input.required<number>();

	readonly incrementSeries = output<void>();
	readonly decrementSeries = output<void>();
}

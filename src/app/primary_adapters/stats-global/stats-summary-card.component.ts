import { Component, ChangeDetectionStrategy, input, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { MonthSummary } from "../../core_logic/stats-global/stats.service";
import { formatSummaryDuration } from "../../core_logic/shared/utils";
import { WeightDisplayPipe } from "../../core_logic/mass-unit/weight-display.pipe";

@Component({
	selector: "app-stats-summary-card",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TranslateModule],
	providers: [WeightDisplayPipe],
	templateUrl: "./stats-summary-card.component.html",
	styleUrl: "./stats-global.component.scss",
})
export class StatsSummaryCardComponent {
	private readonly weightDisplay = inject(WeightDisplayPipe);
	title = input<string>("");
	summary = input<MonthSummary>({ totalWeightKg: 0, sessionCount: 0, totalDurationSeconds: 0 });

	formatWeight(kg: number): string {
		if (kg >= 1000) return this.weightDisplay.transform(kg / 1000, "t");
		return this.weightDisplay.transform(Math.round(kg), "kg");
	}

	formatDuration(totalSeconds: number): string {
		return formatSummaryDuration(totalSeconds);
	}
}

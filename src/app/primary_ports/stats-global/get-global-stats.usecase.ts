import { Injectable, inject } from "@angular/core";
import { StatsService } from "../../core_logic/stats-global/stats.service";

@Injectable({ providedIn: "root" })
export class GetGlobalStatsUseCase {
	private readonly statsService = inject(StatsService);

	readonly heatmapData = this.statsService.heatmapData;
	readonly monthSummary = this.statsService.monthSummary;
	readonly weekSummary = this.statsService.weekSummary;
	readonly weeklyAverage = this.statsService.weeklyAverage;
	readonly muscleGroupDistribution = this.statsService.muscleGroupDistribution;
	readonly exerciseSummaries = this.statsService.exerciseSummaries;
	readonly sessionDurationsInMonth = this.statsService.sessionDurationsInMonth;
	readonly selectedMonth = this.statsService.selectedMonth;

	execute(): Promise<void> {
		return this.statsService.load();
	}
}

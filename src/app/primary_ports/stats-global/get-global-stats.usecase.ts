import { Injectable, inject } from "@angular/core";
import { StatsService } from "../../core_logic/stats-global/stats.service";

@Injectable({ providedIn: "root" })
export class GetGlobalStatsUseCase {
	private readonly statsService = inject(StatsService);

	readonly yearsWithSessions = this.statsService.yearsWithSessions;
	readonly heatmapData = this.statsService.heatmapData;
	readonly yearlyHeatmapData = this.statsService.yearlyHeatmapData;
	readonly monthSummary = this.statsService.monthSummary;
	readonly weekSummary = this.statsService.weekSummary;
	readonly weeklyAverage = this.statsService.weeklyAverage;
	readonly muscleGroupDistribution = this.statsService.muscleGroupDistribution;
	readonly muscleGroupDetails = this.statsService.muscleGroupDetails;
	readonly exerciseSummaries = this.statsService.exerciseSummaries;
	readonly sessionDurationsInMonth = this.statsService.sessionDurationsInMonth;
	readonly selectedMonth = this.statsService.selectedMonth;

	execute(): Promise<void> {
		return this.statsService.load();
	}
}

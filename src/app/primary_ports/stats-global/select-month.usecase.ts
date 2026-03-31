import { Injectable, inject } from "@angular/core";
import { StatsService } from "../../core_logic/stats-global/stats.service";

@Injectable({ providedIn: "root" })
export class SelectMonthUseCase {
	private readonly statsService = inject(StatsService);

	execute(month: Date): void {
		this.statsService.setMonth(month);
	}
}

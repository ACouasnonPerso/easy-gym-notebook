import { Injectable, inject } from "@angular/core";
import { StatsService, StatsViewType } from "../../core_logic/stats-global/stats.service";

@Injectable({ providedIn: "root" })
export class SelectViewTypeUseCase {
	private readonly statsService = inject(StatsService);

	execute(type: StatsViewType): void {
		this.statsService.setViewType(type);
	}
}

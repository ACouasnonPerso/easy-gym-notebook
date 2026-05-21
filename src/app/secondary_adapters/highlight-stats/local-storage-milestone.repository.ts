import { Injectable } from "@angular/core";
import { MilestoneRepository } from "../../secondary_ports/highlight-stats/milestone-repository.interface";

const STORAGE_KEY = "highlight_stats_last_milestone_kg";

@Injectable({ providedIn: "root" })
export class LocalStorageMilestoneRepository implements MilestoneRepository {
	getLastMilestoneKg(): number {
		const value = localStorage.getItem(STORAGE_KEY);
		if (value === null) return 0;
		const parsed = parseFloat(value);
		return isNaN(parsed) ? 0 : parsed;
	}

	setLastMilestoneKg(kg: number): void {
		localStorage.setItem(STORAGE_KEY, kg.toString());
	}
}

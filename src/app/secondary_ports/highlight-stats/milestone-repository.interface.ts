import { InjectionToken } from "@angular/core";

export interface MilestoneRepository {
	getLastMilestoneKg(): number;
	setLastMilestoneKg(kg: number): void;
}

export const MILESTONE_REPOSITORY = new InjectionToken<MilestoneRepository>("MILESTONE_REPOSITORY");

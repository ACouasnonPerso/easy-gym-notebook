import { Injectable, computed, inject } from "@angular/core";
import { ExerciseStatsService } from "../../core_logic/stats-exercise/exercise-stats.service";

@Injectable({ providedIn: "root" })
export class GetExerciseStatsUseCase {
	private readonly statsService = inject(ExerciseStatsService);

	readonly occurrences = this.statsService.occurrences;
	readonly cardioOccurrences = this.statsService.cardioOccurrences;
	readonly isCardio = computed(() => this.cardioOccurrences().length > 0);

	execute(exerciseName: string): Promise<void> {
		return this.statsService.loadForExercise(exerciseName);
	}
}

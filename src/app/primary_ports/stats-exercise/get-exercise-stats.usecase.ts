import { Injectable, inject } from '@angular/core';
import { ExerciseStatsService } from '../../core_logic/stats-exercise/exercise-stats.service';

@Injectable({ providedIn: 'root' })
export class GetExerciseStatsUseCase {
  private readonly statsService = inject(ExerciseStatsService);

  readonly occurrences = this.statsService.occurrences;

  execute(exerciseName: string): Promise<void> {
    return this.statsService.loadForExercise(exerciseName);
  }
}

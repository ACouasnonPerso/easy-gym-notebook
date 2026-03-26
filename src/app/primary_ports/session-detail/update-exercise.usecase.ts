import { Injectable, inject } from '@angular/core';
import { Exercise } from '../../core_logic/shared/models';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';

@Injectable({ providedIn: 'root' })
export class UpdateExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);

  execute(exerciseId: string, changes: Partial<Exercise>): void {
    this.exerciseService.update(exerciseId, changes);
  }
}

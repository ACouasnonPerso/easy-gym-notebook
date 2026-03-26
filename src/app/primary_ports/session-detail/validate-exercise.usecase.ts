import { Injectable, inject } from '@angular/core';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';

@Injectable({ providedIn: 'root' })
export class ValidateExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);

  execute(exerciseId: string): void {
    this.exerciseService.update(exerciseId, { status: 'validated' });
  }
}

import { Injectable, inject } from '@angular/core';
import { Exercise } from '../../core_logic/shared/models';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';
import { MuscleGroupDetectorService } from '../../core_logic/shared/muscle-group-detector.service';

@Injectable({ providedIn: 'root' })
export class UpdateExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);
  private readonly muscleDetector = inject(MuscleGroupDetectorService);

  execute(exerciseId: string, changes: Partial<Exercise>): void {
    if (changes.name !== undefined) {
      const name = changes.name.slice(0, 60);
      const { muscleGroups } = this.muscleDetector.detect(name);
      changes = { ...changes, name, muscleGroup: muscleGroups[0] ?? null, muscleGroups };
    }
    this.exerciseService.update(exerciseId, changes);
  }
}

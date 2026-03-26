import { Injectable, inject } from '@angular/core';
import { MergeExercisesService } from '../../core_logic/stats-global/merge-exercises.service';

@Injectable({ providedIn: 'root' })
export class MergeExercisesUseCase {
  private readonly mergeExercisesService = inject(MergeExercisesService);

  execute(sourceNames: string[], newName: string): Promise<void> {
    return this.mergeExercisesService.merge(sourceNames, newName);
  }
}

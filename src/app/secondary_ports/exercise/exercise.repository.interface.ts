import { InjectionToken } from '@angular/core';
import { Exercise } from '../../core_logic/shared/models';

export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getBySessionId(sessionId: string): Promise<Exercise[]>;
  save(exercise: Exercise): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EXERCISE_REPOSITORY = new InjectionToken<IExerciseRepository>('EXERCISE_REPOSITORY');

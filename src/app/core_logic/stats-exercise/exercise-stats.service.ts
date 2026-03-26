import { Injectable, inject, signal } from '@angular/core';
import { ExerciseOccurrence } from '../shared/models';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';

@Injectable({ providedIn: 'root' })
export class ExerciseStatsService {
  private readonly sessionRepository = inject(SESSION_REPOSITORY);
  private readonly exerciseRepository = inject(EXERCISE_REPOSITORY);

  private readonly _occurrences = signal<ExerciseOccurrence[]>([]);
  readonly occurrences = this._occurrences.asReadonly();

  async loadForExercise(exerciseName: string): Promise<void> {
    const [sessions, exercises] = await Promise.all([
      this.sessionRepository.getAll(),
      this.exerciseRepository.getAll(),
    ]);

    const sessionDateMap = new Map<string, Date>(sessions.map(s => [s.id, s.date]));

    const occurrences: ExerciseOccurrence[] = exercises
      .filter(e => e.name === exerciseName && e.status === 'validated')
      .map(e => ({
        exerciseId: e.id,
        sessionId: e.sessionId,
        date: sessionDateMap.get(e.sessionId) ?? new Date(0),
        name: e.name,
        weightKg: e.weightKg,
        sets: e.sets,
        reps: e.reps,
        breakDurationSeconds: e.breakDurationSeconds,
        volumeKg: e.weightKg * e.sets * e.reps,
        status: e.status,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    this._occurrences.set(occurrences);
  }
}

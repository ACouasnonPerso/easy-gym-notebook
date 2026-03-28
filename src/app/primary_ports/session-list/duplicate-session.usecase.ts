import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session, Exercise } from '../../core_logic/shared/models';
import { SessionService } from '../../core_logic/session/session.service';
import { SESSION_REPOSITORY } from '../../secondary_ports/session/session.repository.interface';
import { EXERCISE_REPOSITORY } from '../../secondary_ports/exercise/exercise.repository.interface';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';
import { AnalyticsService } from '../../core_logic/analytics/analytics.service';

@Injectable({ providedIn: 'root' })
export class DuplicateSessionUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly sessionRepo = inject(SESSION_REPOSITORY);
  private readonly exerciseRepo = inject(EXERCISE_REPOSITORY);
  private readonly router = inject(Router);
  private readonly sessionChronoService = inject(SessionChronoService);
  private readonly analyticsService = inject(AnalyticsService);

  async execute(sourceSessionId: string): Promise<void> {
    const sourceSession = await this.sessionRepo.getById(sourceSessionId);
    if (!sourceSession) return;

    const sourceExercises = await this.exerciseRepo.getBySessionId(sourceSessionId);

    const newSession: Session = {
      id: crypto.randomUUID(),
      date: new Date(),
      status: 'active',
      durationSeconds: 0,
      muscleGroup: sourceSession.muscleGroup,
      exercises: [],
    };

    const copiedExercises: Exercise[] = sourceExercises.map(e => ({
      ...e,
      id: crypto.randomUUID(),
      sessionId: newSession.id,
      status: 'pending',
    }));

    await this.sessionRepo.save(newSession);
    await Promise.all(copiedExercises.map(e => this.exerciseRepo.save(e)));
    await this.sessionService.loadAll();
    this.analyticsService.trackSessionStarted(newSession);
    this.sessionChronoService.start();
    this.router.navigate(['/sessions', newSession.id]);
  }
}

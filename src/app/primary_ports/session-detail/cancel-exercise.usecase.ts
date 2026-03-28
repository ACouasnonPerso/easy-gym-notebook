import { Injectable, inject } from '@angular/core';
import { ExerciseService } from '../../core_logic/session-detail/exercise.service';
import { SessionService } from '../../core_logic/session/session.service';
import { AnalyticsService } from '../../core_logic/analytics/analytics.service';

@Injectable({ providedIn: 'root' })
export class CancelExerciseUseCase {
  private readonly exerciseService = inject(ExerciseService);
  private readonly sessionService = inject(SessionService);
  private readonly analyticsService = inject(AnalyticsService);

  async execute(exerciseId: string): Promise<void> {
    await this.exerciseService.update(exerciseId, { status: 'cancelled' });

    const session = this.sessionService.currentSession();
    if (session) {
      const validatedNames = this.exerciseService.exercises()
        .filter(e => e.status === 'validated')
        .map(e => e.name);
      this.analyticsService.trackSessionUpdated(session, validatedNames);
    }
  }
}

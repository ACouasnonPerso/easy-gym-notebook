import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../core_logic/shared/models';
import { SessionService } from '../../core_logic/session/session.service';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';
import { AnalyticsService } from '../../core_logic/analytics/analytics.service';

@Injectable({ providedIn: 'root' })
export class CreateSessionUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly sessionChronoService = inject(SessionChronoService);
  private readonly analyticsService = inject(AnalyticsService);

  async execute(): Promise<void> {
    const session: Session = {
      id: crypto.randomUUID(),
      date: new Date(),
      status: 'active',
      durationSeconds: 0,
      exercises: [],
      muscleGroup: null,
    };
    await this.sessionService.create(session);
    this.sessionChronoService.start();
    this.router.navigate(['/sessions', session.id]);
  }
}

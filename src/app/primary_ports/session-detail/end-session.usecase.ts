import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core_logic/session/session.service';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';
import { AnalyticsService } from '../../core_logic/analytics/analytics.service';

@Injectable({ providedIn: 'root' })
export class EndSessionUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly sessionChronoService = inject(SessionChronoService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly showManualOverride = signal<boolean>(false);

  execute(): void {
    const session = this.sessionService.currentSession();
    const sessionId = session?.id;
    const elapsed = sessionId
      ? this.sessionChronoService.stopForSession(sessionId)
      : this.sessionChronoService.stop();

    const exercises = session?.exercises ?? [];
    const singleCardioDuration =
      exercises.length === 1 && exercises[0].isCardio && exercises[0].durationSeconds > 0
        ? exercises[0].durationSeconds
        : null;

    const durationToSave = singleCardioDuration ?? elapsed;

    if (durationToSave > 0) {
      this.sessionService.updateCurrentSession({ durationSeconds: durationToSave, status: 'completed' });
      const completedSession = this.sessionService.currentSession();
      if (completedSession) this.analyticsService.trackSessionCompleted(completedSession);
      this.router.navigate(['/sessions']);
    } else {
      this.showManualOverride.set(true);
    }
  }

  confirmEnd(): void {
    const sessionId = this.sessionService.currentSession()?.id;
    if (sessionId) this.sessionChronoService.stopForSession(sessionId);
    this.sessionService.updateCurrentSession({ durationSeconds: 0, status: 'completed' });
    const completedSession = this.sessionService.currentSession();
    if (completedSession) this.analyticsService.trackSessionCompleted(completedSession);
    this.router.navigate(['/sessions']);
  }
}

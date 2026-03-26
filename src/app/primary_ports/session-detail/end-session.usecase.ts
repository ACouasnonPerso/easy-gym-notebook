import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core_logic/session/session.service';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';

@Injectable({ providedIn: 'root' })
export class EndSessionUseCase {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly sessionChronoService = inject(SessionChronoService);

  readonly showManualOverride = signal<boolean>(false);

  execute(): void {
    const sessionId = this.sessionService.currentSession()?.id;
    const elapsed = sessionId
      ? this.sessionChronoService.stopForSession(sessionId)
      : this.sessionChronoService.stop();
    if (elapsed > 0) {
      this.sessionService.updateCurrentSession({ durationSeconds: elapsed, status: 'completed' });
      this.router.navigate(['/sessions']);
    } else {
      this.showManualOverride.set(true);
    }
  }

  confirmEnd(): void {
    const sessionId = this.sessionService.currentSession()?.id;
    if (sessionId) this.sessionChronoService.stopForSession(sessionId);
    this.sessionService.updateCurrentSession({ durationSeconds: 0, status: 'completed' });
    this.router.navigate(['/sessions']);
  }
}

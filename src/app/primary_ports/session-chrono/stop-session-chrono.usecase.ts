import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionChronoService } from '../../core_logic/chrono/session-chrono.service';
import { SessionService } from '../../core_logic/session/session.service';

@Injectable({ providedIn: 'root' })
export class StopSessionChronoUseCase {
  private readonly sessionChronoService = inject(SessionChronoService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  async execute(): Promise<void> {
    const elapsed = this.sessionChronoService.stop();
    if (elapsed > 0) {
      await this.sessionService.updateCurrentSession({ durationSeconds: elapsed, status: 'completed' });
    }
  }

  async executeForSession(sessionId: string): Promise<void> {
    const elapsed = this.sessionChronoService.stopForSession(sessionId);
    if (elapsed > 0) {
      await this.sessionService.updateCurrentSession({ durationSeconds: elapsed, status: 'completed' });
    }
  }

  async executeWithManual(seconds: number): Promise<void> {
    await this.sessionService.updateCurrentSession({ durationSeconds: seconds, status: 'completed' });
    this.router.navigate(['/sessions']);
  }

  navigateToSessions(): void {
    this.router.navigate(['/sessions']);
  }
}
